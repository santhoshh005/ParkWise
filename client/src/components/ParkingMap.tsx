import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { ZoneResult } from "../types";

/* ── Leaflet CSS ────────────────────────────────────────────────────────
   This import is critical — without it tiles render as grey boxes.
   It's imported here rather than index.css so the dependency is explicit. */
import "leaflet/dist/leaflet.css";

const KORAMANGALA_CENTER: [number, number] = [12.9352, 77.6245];
const DEFAULT_ZOOM = 15;

const FILL_COLORS = {
  high: "#10b981",    // emerald-500
  medium: "#f59e0b",  // amber-500
  low: "#ef4444",     // red-500
  neutral: "#94a3b8",  // slate-400
} as const;

const BORDER_COLORS = {
  high: "#059669",
  medium: "#d97706",
  low: "#dc2626",
  neutral: "#64748b",
} as const;

interface Props {
  zones: ZoneResult[] | null;
  selectedZoneId: string | null;
  onSelectZone: (zone: ZoneResult) => void;
}

/** Fly the map to a zone when it's selected from the card list. */
function FlyTo({ zone }: { zone: ZoneResult | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (zone) {
      map.flyTo([zone.latitude, zone.longitude], 16, { duration: 0.6 });
    }
  }, [zone, map]);
  return null;
}

export default function ParkingMap({
  zones,
  selectedZoneId,
  onSelectZone,
}: Props) {
  const selectedZone = zones?.find((z) => z.id === selectedZoneId);
  const hasPredictions = zones !== null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <MapContainer
        center={KORAMANGALA_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="h-[350px] w-full lg:h-[400px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyTo zone={selectedZone} />

        {zones?.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          const colorKey = hasPredictions ? zone.status : "neutral";
          // Scale radius by total spaces: min 8, max 18
          const radius = Math.max(8, Math.min(18, 6 + zone.totalSpaces / 30));

          return (
            <CircleMarker
              key={zone.id}
              center={[zone.latitude, zone.longitude]}
              radius={isSelected ? radius + 3 : radius}
              pathOptions={{
                fillColor: FILL_COLORS[colorKey],
                color: isSelected
                  ? "#0f172a"
                  : BORDER_COLORS[colorKey],
                weight: isSelected ? 3 : 2,
                fillOpacity: 0.75,
              }}
              eventHandlers={{
                click: () => onSelectZone(zone),
              }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="text-sm font-bold">{zone.name}</p>
                  {hasPredictions && (
                    <>
                      <p className="mt-1 text-xs text-slate-600">
                        {zone.availabilityPercent}% available ·{" "}
                        ~{zone.estimatedFreeSpaces} free
                      </p>
                      <p className="text-xs text-slate-600">
                        {zone.distanceKm} km · ₹{zone.suggestedHourlyPrice}/hr
                      </p>
                    </>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
