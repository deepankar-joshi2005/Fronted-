import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface MultiTrendChartProps {
  data: Record<string, string | number>[];
  series: TrendSeries[];
  height?: number;
  /** Format a raw series value for the tooltip/legend, e.g. currency compaction. */
  formatValue?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatValue }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--popover)] px-3 py-2 text-xs shadow-premium">
      <p className="mb-1.5 font-medium text-[var(--foreground)]">{label}</p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[var(--muted-foreground)]">{p.name}</span>
            <span className="ml-auto font-semibold text-[var(--foreground)]">
              {formatValue ? formatValue(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
      {payload.map((entry: any) => (
        <span key={entry.value} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

export function MultiTrendChart({ data, series, height = 260, formatValue }: MultiTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`multiTrendFill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          allowDecimals={false}
          tickFormatter={(v) => (formatValue ? formatValue(v) : v)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip formatValue={formatValue} />} cursor={{ stroke: "var(--border)" }} />
        <Legend content={<CustomLegend />} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#multiTrendFill-${s.key})`}
            dot={{ r: 4, fill: s.color, strokeWidth: 2, stroke: "var(--card)" }}
            activeDot={{ r: 5, fill: s.color, stroke: "var(--card)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
