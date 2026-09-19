import type { ReactNode } from "react";

const VARIANTS = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-surface-2 text-text-muted",
};

interface BadgeProps {
  variant?: keyof typeof VARIANTS;
  className?: string;
  children?: ReactNode;
}

export default function Badge({ variant = "neutral", className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
