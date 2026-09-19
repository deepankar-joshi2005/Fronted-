import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "primary" | "good" | "warning" | "critical" | "violet";
  sublabel?: ReactNode;
  /** Real recent-history values (oldest -> newest). Omit if no genuine series exists for this metric. */
  sparklineData?: number[];
  /** "compact" tightens padding/type scale for dense KPI rows. Defaults to "default". */
  size?: "default" | "compact";
  className?: string;
}

const toneStyles: Record<string, { chip: string; icon: string; line: string }> = {
  primary: {
    chip: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]",
    icon: "text-[var(--primary)]",
    line: "var(--primary)",
  },
  good: {
    chip: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)]",
    icon: "text-[var(--status-good)]",
    line: "var(--status-good)",
  },
  warning: {
    chip: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]",
    icon: "text-[var(--status-warning)]",
    line: "var(--status-warning)",
  },
  critical: {
    chip: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)]",
    icon: "text-[var(--status-critical)]",
    line: "var(--status-critical)",
  },
  violet: {
    chip: "bg-[color-mix(in_oklab,#7C3AED_14%,transparent)]",
    icon: "text-[#7C3AED]",
    line: "#7C3AED",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  sublabel,
  sparklineData,
  size = "default",
  className,
}: StatCardProps) {
  const styles = toneStyles[tone] ?? toneStyles.primary;
  const compact = size === "compact";

  return (
    <div
      className={cn(
        "card-premium card-hover shadow-premium-sm relative flex flex-col overflow-hidden",
        compact ? "gap-2.5 p-4" : "gap-4 p-5",
        className
      )}
    >
      {sparklineData && sparklineData.length >= 2 && (
        <Sparkline
          data={sparklineData}
          color={styles.line}
          className={cn(
            "pointer-events-none absolute bottom-0 right-0 opacity-90 [mask-image:linear-gradient(to_right,transparent,black_30%)]",
            compact ? "h-11 w-[50%]" : "h-14 w-[55%]"
          )}
        />
      )}

      <div className="relative z-10 flex items-start justify-between">
        <span
          className={cn(
            "flex items-center justify-center rounded-xl",
            compact ? "h-9 w-9" : "h-11 w-11",
            styles.chip
          )}
        >
          <Icon className={cn(compact ? "h-4 w-4" : "h-5 w-5", styles.icon)} />
        </span>
      </div>
      <div className="relative z-10">
        <p className={cn("text-[var(--muted-foreground)]", compact ? "text-xs" : "text-sm")}>
          {label}
        </p>
        <p
          className={cn(
            "font-semibold tracking-tight text-[var(--foreground)]",
            compact ? "mt-1 text-xl" : "mt-1.5 text-2xl"
          )}
        >
          {value}
        </p>
        {sublabel && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
