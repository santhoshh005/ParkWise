import type { ZoneResult } from "../types";
import ZoneCard from "./ZoneCard";

interface Props {
  zones: ZoneResult[];
  selectedZoneId: string | null;
  onSelectZone: (zone: ZoneResult) => void;
}

export default function ZoneList({ zones, selectedZoneId, onSelectZone }: Props) {
  if (zones.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold text-slate-900">
        Other Parking Options{" "}
        <span className="font-normal text-slate-500">
          ({zones.length} ranked)
        </span>
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone, index) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            rank={index + 2}
            selected={zone.id === selectedZoneId}
            onSelect={onSelectZone}
          />
        ))}
      </div>
    </section>
  );
}
