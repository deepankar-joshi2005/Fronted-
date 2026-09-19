import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-text-muted">
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="font-semibold text-heading">{title}</p>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
