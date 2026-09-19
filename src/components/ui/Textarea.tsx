import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, className = "", id, required, rows = 3, ...props }: TextareaProps) {
  const textareaId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-text">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        required={required}
        rows={rows}
        className={`w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-heading placeholder:text-text-muted outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          error ? "border-danger focus:border-danger focus:ring-danger/20" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
