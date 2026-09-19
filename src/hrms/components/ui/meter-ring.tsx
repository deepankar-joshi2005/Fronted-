import { cn } from "@/lib/utils";

interface MeterRingProps {
  percent: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function severityColor(percent: number) {
  if (percent >= 90) return "var(--status-good)";
  if (percent >= 75) return "var(--status-warning)";
  return "var(--status-critical)";
}

export function MeterRing({
  percent,
  label,
  size = 132,
  strokeWidth = 12,
  className,
}: MeterRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = severityColor(clamped);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--foreground)]"
          style={{ fontSize: size * 0.2, fontWeight: 600 }}
        >
          {Math.round(clamped)}%
        </text>
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--muted-foreground)]"
          style={{ fontSize: size * 0.075 }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
