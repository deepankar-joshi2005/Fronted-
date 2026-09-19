import type { HTMLAttributes } from "react";

export default function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}
