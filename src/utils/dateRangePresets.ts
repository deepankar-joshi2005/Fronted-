import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  formatISO,
} from "date-fns";

export type DateRangePreset = "all" | "weekly" | "monthly" | "yearly" | "custom";

export interface DateRangeValue {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
}

export const DATE_RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "This month" },
  { value: "yearly", label: "This year" },
  { value: "custom", label: "Custom range" },
];

// Returns an ISO (yyyy-MM-dd) start/end pair for a preset, or empty strings
// for "all" (no filter) and "custom" (caller supplies its own dates).
export function resolvePresetRange(preset: DateRangePreset): { startDate: string; endDate: string } {
  const now = new Date();
  switch (preset) {
    case "weekly":
      return {
        startDate: formatISO(startOfWeek(now, { weekStartsOn: 1 }), { representation: "date" }),
        endDate: formatISO(endOfWeek(now, { weekStartsOn: 1 }), { representation: "date" }),
      };
    case "monthly":
      return {
        startDate: formatISO(startOfMonth(now), { representation: "date" }),
        endDate: formatISO(endOfMonth(now), { representation: "date" }),
      };
    case "yearly":
      return {
        startDate: formatISO(startOfYear(now), { representation: "date" }),
        endDate: formatISO(endOfYear(now), { representation: "date" }),
      };
    default:
      return { startDate: "", endDate: "" };
  }
}
