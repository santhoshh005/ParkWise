import type { ModelMetrics } from "../types";
import { useState } from "react";

interface Props {
  metrics: ModelMetrics;
}

export default function ModelInfo({ metrics }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
        About this prediction
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-slate-500">MAE</p>
              <p className="text-sm font-semibold text-slate-800">
                {metrics.mae} pp
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">R²</p>
              <p className="text-sm font-semibold text-slate-800">
                {metrics.r2}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Training records
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {metrics.trainingRecords.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Test records
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {metrics.testRecords.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Trained on 84 days of simulated Koramangala occupancy data using a
            Random Forest model (150 trees). The moderate R² reflects the
            inherent noise in the synthetic data — not overfitting — and the
            MAE of ~10 percentage points means predictions are typically within
            one availability tier of reality.
          </p>
        </div>
      )}
    </section>
  );
}
