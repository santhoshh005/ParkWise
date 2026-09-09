import "dotenv/config";
import cors from "cors";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { rankParkingZones, recommendationExplanation } from "./services/recommendation.js";
import { runPythonScript } from "./services/pythonBridge.js";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

app.get("/api/zones", async (_request, response) => {
  try {
    const zones = await prisma.parkingZone.findMany({ orderBy: { name: "asc" } });
    response.json(zones);
  } catch {
    response.status(500).json({ message: "Unable to load parking zones." });
  }
});

app.post("/api/predictions", async (request, response) => {
  const { date, time, weather, hasEvent } = request.body;
  const validWeather = ["clear", "cloudy", "rainy"];
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time) || !validWeather.includes(weather) || typeof hasEvent !== "boolean") {
    return response.status(400).json({ message: "Provide a valid date, time, weather (clear, cloudy, or rainy), and event choice." });
  }

  try {
    const zones = await prisma.parkingZone.findMany({ where: { area: "Koramangala" } });
    const modelResult = await runPythonScript("predict.py", { date, time, weather, hasEvent, zones }) as {
      predictions: { zoneId: string; occupancyPercent: number }[];
      metrics: { mae: number; r2: number; trainingRecords: number; testRecords: number };
    };
    const rankedZones = rankParkingZones(zones, modelResult.predictions);
    response.json({
      request: { area: "Koramangala", date, time, weather, hasEvent },
      recommended: rankedZones[0],
      explanation: recommendationExplanation(rankedZones[0]),
      zones: rankedZones,
      modelMetrics: modelResult.metrics,
    });
  } catch (error) {
    console.error(error);
    response.status(503).json({ message: "Predictions are temporarily unavailable. Run npm run train:model before starting the API." });
  }
});

app.listen(port, () => console.log(`ParkWise API running at http://localhost:${port}`));
