/** @format */

import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { AlertTriangle, GraduationCap } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
}

function ConfirmUI({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  onResolve,
}: ConfirmOptions & { onResolve: (value: boolean) => void }) {
  const [closing, setClosing] = useState(false);

  const close = (value: boolean) => {
    setClosing(true);
    setTimeout(() => onResolve(value), 150);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 transition-opacity duration-150 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={() => close(false)}
    >
      <div
        className={`card-premium w-full max-w-sm shadow-2xl p-5 transition-all duration-150 ${
          closing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === "danger" ? "bg-red-100 text-red-600" : "bg-[var(--primary)]/10 text-[var(--primary)]"
            }`}
          >
            {tone === "danger" ? <AlertTriangle className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
            {message && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{message}</p>}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => close(false)}
            className="h-9 rounded-lg border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => close(true)}
            className={`h-9 rounded-lg px-4 text-sm font-semibold text-white shadow-premium-sm hover:opacity-90 ${
              tone === "danger" ? "bg-red-600" : "bg-gradient-to-r from-[var(--primary)] to-[#7C3AED]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   🔥 GLOBAL CONFIRM FUNCTION
   Same imperative, portal-mounted pattern as toast() in ./Toast — drop-in
   replacement for window.confirm() that matches the HRMS look instead of
   the browser's native dialog.
   =============================== */

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleResolve = (value: boolean) => {
      root.unmount();
      container.remove();
      resolve(value);
    };

    root.render(<ConfirmUI {...options} onResolve={handleResolve} />);
  });
}
