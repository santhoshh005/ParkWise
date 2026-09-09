import type { ZoneResult } from "../types";

const BAR_COLORS = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-red-500",
} as const;

const STATUS_DOTS = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-red-500",
} as const;

interface Props {
  zone: ZoneResult;
  rank: number;
  selected: boolean;
  onSelect: (zone: ZoneResult) => void;
}

export default function ZoneCard({ zone, rank, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(zone)}
      className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${
        selected
          ? "border-emerald-300 ring-2 ring-emerald-200"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {rank}
            </span>
            <h4 className="truncate text-sm font-semibold text-slate-900">
              {zone.name}
            </h4>
          </div>

          {/* Availability bar */}
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${BAR_COLORS[zone.status]}`}
                style={{
                  width: `${Math.min(zone.availabilityPercent, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOTS[zone.status]}`}
              />
              {zone.availabilityPercent}% avail
            </span>
            <span>~{zone.estimatedFreeSpaces} free</span>
            <span>{zone.distanceKm} km</span>
            <span>₹{zone.suggestedHourlyPrice}/hr</span>
          </div>
        </div>
      </div>
    </button>
  );
}
