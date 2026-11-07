import type { ZoneResult } from "../types";
import { STATUS_BAR_COLORS, STATUS_LABELS } from "./status";

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
      aria-pressed={selected}
      className={`w-full rounded-xl border-2 bg-white p-4 text-left shadow-sm transition-shadow duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:translate-y-px ${
        selected ? "border-emerald-500" : "border-slate-200"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {rank}
        </span>
        <h4 className="truncate text-sm font-semibold text-slate-900">{zone.name}</h4>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${STATUS_BAR_COLORS[zone.status]}`} style={{ width: `${Math.min(zone.availabilityPercent, 100)}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
          <span className={`inline-block h-2 w-2 rounded-full ${STATUS_BAR_COLORS[zone.status]}`} aria-hidden="true" />
          {zone.availabilityPercent}% available
          <span className="sr-only">({STATUS_LABELS[zone.status]})</span>
        </span>
        <span>range {zone.availabilityLow} to {zone.availabilityHigh}%</span>
        <span>~{zone.estimatedFreeSpaces} free</span>
        <span>{zone.distanceKm} km</span>
        <span>₹{zone.suggestedHourlyPrice}/hr</span>
      </div>
    </button>
  );
}
