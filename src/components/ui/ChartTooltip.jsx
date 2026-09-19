// Recharts default tooltip is a plain white box — doesn't follow the app's
// light/dark theme. This renders one using the same Card surface tokens.
export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      {label && <p className="mb-1 font-medium text-heading">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-2 text-text-muted">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          {formatter ? formatter(entry.value, entry) : entry.value}
        </p>
      ))}
    </div>
  );
}
