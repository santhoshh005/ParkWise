export const WEATHER_OPTIONS = ["clear", "cloudy", "rainy"] as const;
export type Weather = (typeof WEATHER_OPTIONS)[number];
export type PredictionRequest = { date: string; time: string; weather: Weather; hasEvent: boolean };

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** True only for real calendar dates (rejects 2026-02-30, 2026-13-01, ...). */
export function isValidDate(value: string) {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parsePredictionRequest(body: unknown): { ok: true; value: PredictionRequest } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) return { ok: false, message: "Request body must be a JSON object." };
  const { date, time, weather, hasEvent } = body as Record<string, unknown>;
  if (typeof date !== "string" || !isValidDate(date)) return { ok: false, message: "Provide a valid date in YYYY-MM-DD format." };
  if (typeof time !== "string" || !TIME_PATTERN.test(time)) return { ok: false, message: "Provide a valid 24-hour time in HH:MM format." };
  if (typeof weather !== "string" || !(WEATHER_OPTIONS as readonly string[]).includes(weather)) {
    return { ok: false, message: `Weather must be one of: ${WEATHER_OPTIONS.join(", ")}.` };
  }
  if (typeof hasEvent !== "boolean") return { ok: false, message: "hasEvent must be true or false." };
  return { ok: true, value: { date, time, weather: weather as Weather, hasEvent } };
}
