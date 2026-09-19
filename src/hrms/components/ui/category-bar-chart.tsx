import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList, ResponsiveContainer } from "recharts";

export interface CategoryBarDatum {
  label: string;
  value: number;
}

interface CategoryBarChartProps {
  data: CategoryBarDatum[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

function CustomTooltip({ active, payload, formatValue }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--popover)] px-3 py-2 text-xs shadow-premium">
      <p className="font-medium text-[var(--foreground)]">{item.payload.label}</p>
      <p className="text-[var(--muted-foreground)]">
        {formatValue ? formatValue(item.value) : item.value}
      </p>
    </div>
  );
}

export function CategoryBarChart({ data, color = "var(--primary)", height = 240, formatValue }: CategoryBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
        barCategoryGap={14}
      >
        <XAxis type="number" hide domain={[0, (max: number) => max * 1.2]} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={100}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip
          content={<CustomTooltip formatValue={formatValue} />}
          cursor={{ fill: "var(--muted)" }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: any) => {
              const n = Number(v);
              return formatValue ? formatValue(n) : String(n);
            }}
            fill="var(--foreground)"
            fontSize={12}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
