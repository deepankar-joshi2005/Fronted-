// Fixed chart-fill palette — validated against BOTH the light and dark surface
// (see the data-viz skill's validator), so these exact hex values are used as-is
// in either theme rather than swapping to the brighter --dark-mode badge tokens,
// which are tuned for small text/icons and fail the lightness band as large fills.
export const CHART_COLORS = {
  brand: "#2452c9",
  teal: "#0d9488",
  gold: "#a86f09",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#d97706",
};
