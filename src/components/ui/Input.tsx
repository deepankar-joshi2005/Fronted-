import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", id, required, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        className={`w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-heading placeholder:text-text-muted outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          error ? "border-danger focus:border-danger focus:ring-danger/20" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
