// Rotating accent palette for stat cards, feature icons, badges — keeps
// dashboards from looking monotone while staying consistent across pages.
export const ACCENT_COLORS = [
  { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", solid: "bg-blue-500" },
  { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", solid: "bg-teal-500" },
  { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", solid: "bg-amber-500" },
  { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", solid: "bg-violet-500" },
  { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", solid: "bg-rose-500" },
  { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", solid: "bg-emerald-500" },
];

export function accentAt(index) {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}
