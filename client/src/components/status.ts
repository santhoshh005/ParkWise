import type { AvailabilityStatus } from "../types";

export const STATUS_LABELS: Record<AvailabilityStatus, string> = { high: "High", medium: "Medium", low: "Low" };

export const STATUS_BAR_COLORS: Record<AvailabilityStatus, string> = {
  high: "bg-emerald-500",
  medium: "bg-amber-500",
  low: "bg-red-500",
};

export const STATUS_BADGE_COLORS: Record<AvailabilityStatus, string> = {
  high: "text-emerald-700 bg-emerald-50 ring-emerald-600/20",
  medium: "text-amber-700 bg-amber-50 ring-amber-600/20",
  low: "text-red-700 bg-red-50 ring-red-600/20",
};
