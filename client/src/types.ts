/* ── ParkWise shared types ── */

/** Body sent to POST /api/predictions */
export interface PredictionRequest {
  date: string;          // "YYYY-MM-DD"
  time: string;          // "HH:MM"
  weather: Weather;
  hasEvent: boolean;
}

export type Weather = "clear" | "cloudy" | "rainy";

export type AvailabilityStatus = "high" | "medium" | "low";

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
  distanceKm: number;
  estimatedFreeSpaces: number;
  status: AvailabilityStatus;
  suggestedHourlyPrice: number;
  recommendationScore: number;
}

export interface ModelMetrics {
  mae: number;
  r2: number;
  trainingRecords: number;
  testRecords: number;
}

/** Full response from POST /api/predictions */
export interface PredictionResponse {
  request: {
    area: string;
    date: string;
    time: string;
    weather: Weather;
    hasEvent: boolean;
  };
  recommended: ZoneResult;
  explanation: string;
  zones: ZoneResult[];
  modelMetrics: ModelMetrics;
}
