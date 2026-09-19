import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  centerLabel?: string;
  size?: number;
  className?: string;
  /** Noun shown after each tooltip value, e.g. "employees", "claims", "₹". Defaults to "employees". */
  unit?: string;
  /** Format the raw slice value (e.g. currency). Defaults to the plain number. */
  formatValue?: (value: number) => string;
}

function CustomTooltip({ active, payload, unit, formatValue }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const shown = formatValue ? formatValue(item.value) : item.value;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--popover)] px-3 py-2 text-xs shadow-premium">
      <p className="font-medium text-[var(--foreground)]">{item.name}</p>
      <p className="text-[var(--muted-foreground)]">
        {shown}
        {unit ? ` ${unit}` : ""}
      </p>
    </div>
  );
}

export function DonutChart({
  data,
  centerLabel,
  size = 168,
  className,
  unit = "employees",
  formatValue,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const hasData = total > 0;

  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-5 sm:flex-row sm:items-center", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 3 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip unit={unit} formatValue={formatValue} />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full border-8 border-[var(--muted)]" />
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-[var(--foreground)]">
            {formatValue ? formatValue(total) : total}
          </span>
          {centerLabel && (
            <span className="text-[11px] text-[var(--muted-foreground)]">{centerLabel}</span>
          )}
        </div>
      </div>

      <div className="min-w-0 w-full flex-1 space-y-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex min-w-0 items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="min-w-0 flex-1 truncate text-[var(--muted-foreground)]" title={d.label}>
              {d.label}
            </span>
            <span className="shrink-0 font-semibold text-[var(--foreground)]">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
            <span className="w-9 shrink-0 text-right text-xs text-[var(--muted-foreground)]">
              {hasData ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
