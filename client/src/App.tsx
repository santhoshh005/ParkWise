import { useState } from "react";
import { fetchPredictions } from "./api/predictions";
import LoadingSpinner from "./components/LoadingSpinner";
import ModelInfo from "./components/ModelInfo";
import ParkingMap from "./components/ParkingMap";
import PredictionForm from "./components/PredictionForm";
import RecommendedSpot from "./components/RecommendedSpot";
import ZoneList from "./components/ZoneList";
import type { PredictionRequest, PredictionResponse, ZoneResult } from "./types";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  async function handleSubmit(request: PredictionRequest) {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPredictions(request);
      setResult(data);
      setSelectedZoneId(data.recommended.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectZone(zone: ZoneResult) {
    setSelectedZoneId(zone.id);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <header>
        <p className="text-sm font-semibold tracking-[0.2em] text-emerald-600">
          PARKWISE AI
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Predict. Compare. Park.
        </h1>
        <p className="mt-2 max-w-xl text-slate-600">
          Smart parking predictions for Koramangala, before you arrive.
        </p>
      </header>

      {/* ── Form ── */}
      <section className="mt-8">
        <PredictionForm onSubmit={handleSubmit} loading={loading} />
      </section>

      {/* ── Error ── */}
      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">
              Prediction failed
            </p>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && <LoadingSpinner />}

      {/* ── Results ── */}
      {result && !loading && (
        <>
          {/* Recommended + Map grid */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <RecommendedSpot
              zone={result.recommended}
              explanation={result.explanation}
            />
            <ParkingMap
              zones={result.zones}
              selectedZoneId={selectedZoneId}
              onSelectZone={handleSelectZone}
            />
          </div>

          {/* Other zones */}
          <ZoneList
            zones={result.zones.slice(1)}
            selectedZoneId={selectedZoneId}
            onSelectZone={handleSelectZone}
          />

          {/* Model transparency */}
          <ModelInfo metrics={result.modelMetrics} />
        </>
      )}
    </main>
  );
}
