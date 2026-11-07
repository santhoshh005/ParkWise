import { useId, useState } from "react";
import type { ModelMetrics } from "../types";

interface Props {
  metrics: ModelMetrics;
}

export default function ModelInfo({ metrics }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const intervalPercent = Math.round(metrics.intervalLevel * 100);
  const improvement = metrics.baselineMae > 0 ? Math.round((1 - metrics.mae / metrics.baselineMae) * 100) : 0;

  const stats = [
    { label: "Typical error (MAE)", value: `±${metrics.mae} pts` },
    { label: "Baseline MAE", value: `±${metrics.baselineMae} pts` },
    { label: "R²", value: metrics.r2.toFixed(3) },
    { label: `${intervalPercent}% range`, value: `±${metrics.intervalHalfWidth} pts` },
    { label: "Training records", value: metrics.trainingRecords.toLocaleString() },
    { label: "Test records", value: metrics.testRecords.toLocaleString() },
  ];

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <svg className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        How accurate is this prediction?
      </button>

      {open && (
        <div id={panelId} className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs font-medium text-slate-500">{stat.label}</dt>
                <dd className="text-sm font-semibold text-slate-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            {metrics.modelName} model evaluated on a {metrics.validation}, so these scores reflect forecasting days it
            never saw. Predictions are typically within {metrics.mae} percentage points of actual occupancy
            {improvement > 0 && `, ${improvement}% more accurate than the historical average for that hour`}. The shaded
            range on each bar contained the true value {Math.round(metrics.intervalCoverage * 100)}% of the time on held
            out data. Trained on simulated Koramangala history.
          </p>
        </div>
      )}
    </section>
  );
}
