import type { PredictionRequest, PredictionResponse } from "../types";

const API_BASE = "/api";         // Vite proxy rewrites to http://localhost:4000
const TIMEOUT_MS = 15_000;       // Python bridge + model load can be slow on first call

class PredictionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PredictionError";
  }
}

export async function fetchPredictions(
  request: PredictionRequest,
): Promise<PredictionResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        (body as { message?: string }).message ??
        `Server error (${response.status})`;
      throw new PredictionError(message, response.status);
    }

    return (await response.json()) as PredictionResponse;
  } catch (error) {
    if (error instanceof PredictionError) throw error;
    if ((error as Error).name === "AbortError") {
      throw new PredictionError(
        "Request timed out — the prediction service may be starting up. Try again in a moment.",
        408,
      );
    }
    throw new PredictionError(
      "Unable to reach the prediction server. Is the backend running?",
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}
