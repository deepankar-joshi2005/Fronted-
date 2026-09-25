import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary:
    "bg-brand text-white shadow-md shadow-brand/25 hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/35 active:brightness-95",
  brand:
    "bg-brand text-white shadow-md shadow-brand/25 hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/35 active:brightness-95",
  secondary: "bg-surface-2 text-text hover:bg-border border border-border",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
