// Compact magnitude-comparison bars for a small set of named categories
// (firm status, plan tier, CRM pipeline stage, compliance status). Value is
// always shown as text next to the label — never color-only — since some
// palette entries (brand blue) fall under 3:1 contrast on the dark surface.
export default function HorizontalBars({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-text">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              {d.label}
            </span>
            <span className="font-semibold text-heading">{d.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
