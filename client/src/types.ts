/* ── ParkWise shared types ── */

export type Weather = "clear" | "cloudy" | "rainy";

export type AvailabilityStatus = "high" | "medium" | "low";

/** Body sent to POST /api/predictions */
export interface PredictionRequest {
  date: string;          // "YYYY-MM-DD"
  time: string;          // "HH:MM" (24-hour)
  weather: Weather;
  hasEvent: boolean;
}

/** A single parking zone after ranking by the backend */
export interface ZoneResult {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  totalSpaces: number;
  hourlyPrice: number;
  occupancyPercent: number;
  availabilityPercent: number;
  /** Lower / upper bound of the model's prediction interval for availability. */
  availabilityLow: number;
  availabilityHigh: number;
  distanceKm: number;
  estimatedFreeSpaces: number;
  status: AvailabilityStatus;
  suggestedHourlyPrice: number;
  recommendationScore: number;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
  baselineMae: number;
  modelName: string;
  intervalLevel: number;
  intervalHalfWidth: number;
  intervalCoverage: number;
  validation: string;
  trainingRecords: number;
  testRecords: number;
  trainedAt: string;
}

/** Full response from POST /api/predictions */
export interface PredictionResponse {
  request: PredictionRequest & { area: string };
  recommended: ZoneResult;
  explanation: string;
  zones: ZoneResult[];
  modelMetrics: ModelMetrics;
  warnings: string[];
}
