import type { ZoneResult } from "../types";

const STATUS_COLORS = {
  high: "text-emerald-700 bg-emerald-50 ring-emerald-600/20",
  medium: "text-amber-700 bg-amber-50 ring-amber-600/20",
  low: "text-red-700 bg-red-50 ring-red-600/20",
} as const;

const STATUS_BAR_COLORS = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-red-500",
} as const;

interface Props {
  zone: ZoneResult;
  explanation: string;
}

export default function RecommendedSpot({ zone, explanation }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white p-6 shadow-md">
      {/* Badge */}
      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        🏆 Best Match
      </span>

      <h3 className="text-xl font-bold text-slate-900">{zone.name}</h3>

      {/* Availability bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Availability</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[zone.status]}`}
          >
            {zone.availabilityPercent}% {zone.status}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${STATUS_BAR_COLORS[zone.status]}`}
            style={{ width: `${Math.min(zone.availabilityPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-slate-50 px-2 py-2.5">
          <p className="text-lg font-bold text-slate-900">
            ~{zone.estimatedFreeSpaces}
          </p>
          <p className="text-xs text-slate-500">
            of {zone.totalSpaces} free
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2.5">
          <p className="text-lg font-bold text-slate-900">
            {zone.distanceKm} km
          </p>
          <p className="text-xs text-slate-500">from centre</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2.5">
          <p className="text-lg font-bold text-slate-900">
            ₹{zone.suggestedHourlyPrice}
          </p>
          <p className="text-xs text-slate-500">per hour</p>
        </div>
      </div>

      {/* Explanation */}
      <p className="mt-4 text-sm text-slate-600">
        <span className="font-medium text-emerald-700">Why this spot?</span>{" "}
        {explanation}
      </p>
    </div>
  );
}
