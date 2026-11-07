import type { KeyboardEvent } from "react";
import type { ZoneResult } from "../types";
import { STATUS_BADGE_COLORS, STATUS_BAR_COLORS, STATUS_LABELS } from "./status";

interface Props {
  zone: ZoneResult;
  explanation: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function RecommendedSpot({ zone, explanation, isSelected, onSelect }: Props) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Best match: ${zone.name}. Show on map.`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        isSelected ? "border-emerald-500" : "border-slate-200"
      }`}
    >
      <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
        Best match
      </span>

      <h3 className="pr-24 text-xl font-semibold text-slate-900">{zone.name}</h3>

      {/* Availability bar with the model's likely range shaded behind it */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Predicted availability</span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE_COLORS[zone.status]}`}>
            {zone.availabilityPercent}% · {STATUS_LABELS[zone.status]}
          </span>
        </div>
        <div
          className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`${zone.availabilityPercent}% available, likely between ${zone.availabilityLow}% and ${zone.availabilityHigh}%`}
        >
          <div
            className="absolute inset-y-0 bg-slate-300"
            style={{ left: `${zone.availabilityLow}%`, width: `${Math.max(0, zone.availabilityHigh - zone.availabilityLow)}%` }}
          />
          <div className={`relative h-full rounded-full ${STATUS_BAR_COLORS[zone.status]}`} style={{ width: `${Math.min(zone.availabilityPercent, 100)}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Likely range {zone.availabilityLow}% to {zone.availabilityHigh}%
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-slate-50 px-2 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Free spaces</p>
          <p className="text-lg font-semibold text-slate-900">~{zone.estimatedFreeSpaces}</p>
          <p className="text-xs text-slate-500">of {zone.totalSpaces}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Distance</p>
          <p className="text-lg font-semibold text-slate-900">{zone.distanceKm} km</p>
          <p className="text-xs text-slate-500">from centre</p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-2 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">Price</p>
          <p className="text-lg font-semibold text-emerald-900">₹{zone.suggestedHourlyPrice}</p>
          <p className="text-xs text-emerald-700">
            per hour{zone.suggestedHourlyPrice !== zone.hourlyPrice && ` (list ₹${zone.hourlyPrice})`}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">
        <span className="font-medium text-emerald-700">Why this spot?</span> {explanation}
      </p>
    </article>
  );
}
