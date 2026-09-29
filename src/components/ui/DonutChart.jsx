import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip.jsx";

// Part-to-whole share for a handful of categories (status, plan tier, ...).
// Pairs with HorizontalBars (magnitude) — this is specifically for "what
// share of the total is each slice", with a legend + center total so identity
// and scale never depend on color alone.
export default function DonutChart({ data, formatValue = (v) => v }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={total > 0 ? 2 : 0}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatter={(value, entry) => `${entry.name}: ${formatValue(value)}`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-heading">{formatValue(total)}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Total</span>
        </div>
      </div>
      {/* Grid keeps the value column fixed and right-aligned even when a long
          label wraps to two lines — a flex row would instead dump the value
          onto its own orphaned, left-aligned line once the label wraps. */}
      <ul className="grid w-full min-w-0 flex-1 grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="contents">
            <span className="flex min-w-0 items-start gap-2 text-sm text-text">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="min-w-0">{d.label}</span>
            </span>
            <span className="whitespace-nowrap text-right text-sm font-semibold text-heading">
              {formatValue(d.value)}
              <span className="ml-1.5 text-xs font-normal text-text-muted">
                ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
