import { lazy, Suspense, useState } from "react";
import { fetchPredictions } from "./api/predictions";
import LoadingSkeleton from "./components/LoadingSkeleton";
import ModelInfo from "./components/ModelInfo";
import PredictionForm from "./components/PredictionForm";
import RecommendedSpot from "./components/RecommendedSpot";
import ZoneList from "./components/ZoneList";
import type { PredictionRequest, PredictionResponse, ZoneResult } from "./types";

// Leaflet is large and only needed once results exist, so load the map on demand.
const ParkingMap = lazy(() => import("./components/ParkingMap"));

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
      setSelectedZoneId(data.recommended?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectZone(zone: ZoneResult) {
    setSelectedZoneId(zone.id);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold tracking-widest text-emerald-700">PARKWISE</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Predict. Compare. Park.</h1>
        <p className="mt-2 max-w-xl text-slate-600">Smart parking predictions for Koramangala, before you arrive.</p>
      </header>

      <section className="mt-8" aria-label="Prediction inputs">
        <PredictionForm onSubmit={handleSubmit} loading={loading} />
      </section>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Prediction failed</p>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {!result && !loading && !error && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-base font-semibold text-slate-900">Pick a time to see where to park</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Choose when you plan to arrive, the expected weather and whether there is an event nearby. ParkWise ranks
            all 8 Koramangala zones by predicted free space, distance and price.
          </p>
        </section>
      )}

      {result && !loading && (
        <section aria-label="Prediction results" aria-live="polite">
          {result.warnings.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4" role="status">
              {result.warnings.map((warning) => (
                <p key={warning} className="text-sm text-amber-800">{warning}</p>
              ))}
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <RecommendedSpot
              zone={result.recommended}
              explanation={result.explanation}
              isSelected={selectedZoneId === result.recommended.id}
              onSelect={() => handleSelectZone(result.recommended)}
            />
            <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 lg:h-96" />}>
              <ParkingMap zones={result.zones} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />
            </Suspense>
          </div>

          <ZoneList zones={result.zones.slice(1)} selectedZoneId={selectedZoneId} onSelectZone={handleSelectZone} />

          <ModelInfo metrics={result.modelMetrics} />
        </section>
      )}
    </main>
  );
}
