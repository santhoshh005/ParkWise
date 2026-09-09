import { useState } from "react";
import type { PredictionRequest, Weather } from "../types";

const WEATHER_OPTIONS: { value: Weather; label: string; icon: string }[] = [
  { value: "clear", label: "Clear", icon: "☀️" },
  { value: "cloudy", label: "Cloudy", icon: "☁️" },
  { value: "rainy", label: "Rainy", icon: "🌧️" },
];

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentHourString(): string {
  return `${String(new Date().getHours()).padStart(2, "0")}:00`;
}

interface Props {
  onSubmit: (request: PredictionRequest) => void;
  loading: boolean;
}

export default function PredictionForm({ onSubmit, loading }: Props) {
  const [date, setDate] = useState(todayString);
  const [time, setTime] = useState(currentHourString);
  const [weather, setWeather] = useState<Weather>("clear");
  const [hasEvent, setHasEvent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    onSubmit({ date, time, weather, hasEvent });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        When are you parking?
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Date */}
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        {/* Time */}
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>
      </div>

      {/* Weather toggle */}
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-slate-700">Weather</legend>
        <div className="mt-1 inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5">
          {WEATHER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWeather(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                weather === opt.value
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Event toggle */}
      <label className="mt-4 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">
          Event nearby?
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={hasEvent}
          onClick={() => setHasEvent(!hasEvent)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
            hasEvent ? "bg-emerald-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
              hasEvent ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className="text-xs text-slate-500">
          {hasEvent ? "Yes" : "No"}
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Analyzing…
          </>
        ) : (
          "Get Predictions"
        )}
      </button>
    </form>
  );
}
