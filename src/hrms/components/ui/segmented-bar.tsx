import { cn } from "@/lib/utils";

export interface SegmentedBarItem {
  label: string;
  value: number;
  color: string;
}

interface SegmentedBarProps {
  items: SegmentedBarItem[];
  total: number;
  className?: string;
}

export function SegmentedBar({ items, total, className }: SegmentedBarProps) {
  const safeTotal = total > 0 ? total : 1;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded-full bg-[var(--muted)]">
        {items.map((item, i) =>
          item.value > 0 ? (
            <div
              key={i}
              title={`${item.label}: ${item.value}`}
              style={{
                width: `${(item.value / safeTotal) * 100}%`,
                backgroundColor: item.color,
              }}
              className="h-full rounded-full transition-all duration-500"
            />
          ) : null
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[var(--muted-foreground)]">{item.label}</span>
            <span className="font-semibold text-[var(--foreground)]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
