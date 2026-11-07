import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { PythonWorker } from "./services/pythonBridge.js";
import { rankParkingZones, recommendationExplanation, type ModelPrediction, type ParkingZone } from "./services/recommendation.js";
import { parsePredictionRequest } from "./validation.js";

type ModelResult = { predictions: ModelPrediction[]; metrics: Record<string, unknown>; warnings: string[] };

const AREA = "Koramangala";
const ZONE_CACHE_MS = 5 * 60_000;
const port = Number(process.env.PORT) || 4000;
const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");

const app = express();
const prisma = new PrismaClient();
const predictor = new PythonWorker("predict.py");

let zoneCache: { zones: ParkingZone[]; expiresAt: number } | null = null;
async function getZones() {
  if (zoneCache && zoneCache.expiresAt > Date.now()) return zoneCache.zones;
  const zones = await prisma.parkingZone.findMany({ where: { area: AREA }, orderBy: { name: "asc" } });
  zoneCache = { zones, expiresAt: Date.now() + ZONE_CACHE_MS };
  return zones;
}

app.disable("x-powered-by");
app.use((_request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
// Same-origin by default (the Vite dev proxy and the production static server need no CORS).
app.use("/api", cors({ origin: allowedOrigins?.length ? allowedOrigins : false }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/zones", async (_request, response) => {
  try {
    response.json(await getZones());
  } catch (error) {
    console.error("Failed to load zones:", error);
    response.status(500).json({ message: "Unable to load parking zones." });
  }
});

app.post("/api/predictions", async (request, response) => {
  const parsed = parsePredictionRequest(request.body);
  if (!parsed.ok) {
    response.status(400).json({ message: parsed.message });
    return;
  }

  try {
    const zones = await getZones();
    if (zones.length === 0) {
      response.status(503).json({ message: "No parking zones found. Seed the database with `npm run db:seed`." });
      return;
    }
    const modelResult = (await predictor.run({ ...parsed.value, zones: zones.map(({ id }) => ({ id })) })) as ModelResult;
    const rankedZones = rankParkingZones(zones, modelResult.predictions);
    response.json({
      request: { area: AREA, ...parsed.value },
      recommended: rankedZones[0],
      explanation: recommendationExplanation(rankedZones[0]),
      zones: rankedZones,
      modelMetrics: modelResult.metrics,
      warnings: modelResult.warnings ?? [],
    });
  } catch (error) {
    console.error("Prediction failed:", error instanceof Error ? error.message : error);
    response.status(503).json({ message: "Predictions are temporarily unavailable. Please try again shortly." });
  }
});

app.use("/api", (_request, response) => {
  response.status(404).json({ message: "Not found." });
});

// In production, serve the built client from the same origin.
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: "1h", index: false }));
  app.get(/^(?!\/api).*/, (_request, response) => response.sendFile(path.join(clientDist, "index.html")));
}

const handleErrors: ErrorRequestHandler = (error, _request, response, _next) => {
  const status = typeof error?.status === "number" && error.status < 500 ? error.status : 500;
  if (status === 500) console.error(error);
  response.status(status).json({ message: status === 500 ? "Internal server error." : "Malformed request." });
};
app.use(handleErrors);

const server = app.listen(port, () => console.log(`ParkWise API running at http://localhost:${port}`));

function shutdown() {
  predictor.stop();
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
