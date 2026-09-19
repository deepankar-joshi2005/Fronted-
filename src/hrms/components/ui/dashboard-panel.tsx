import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardPanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DashboardPanel({
  title,
  subtitle,
  action,
  children,
  className,
  contentClassName,
}: DashboardPanelProps) {
  return (
    <div className={cn("card-premium shadow-premium-sm min-w-0 p-5 sm:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
