import type { ReactNode } from "react";
import { X } from "lucide-react";

const SIZES = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
}

export default function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80" onClick={onClose} />
      <div
        className={`fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] ${SIZES[size]} -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-surface shadow-2xl`}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6">
          <h2 className="text-lg font-bold text-heading">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className={`overflow-y-auto px-6 ${footer ? "" : "pb-6"}`}>{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>
        )}
      </div>
    </>
  );
}
