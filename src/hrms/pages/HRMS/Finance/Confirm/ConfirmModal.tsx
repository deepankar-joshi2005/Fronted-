/** @format */

import { createRoot } from "react-dom/client";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
}

function ConfirmUI({ title, message, onConfirm, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-sm p-5 animate-scaleIn">
        <div className="flex items-center gap-2 text-yellow-600 mb-3">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">{title}</h3>
        </div>

        <p className="text-sm text-gray-600 mb-5">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700"
          >
            Confirm
          </button>
        </div>

        <button onClick={onClose} className="absolute top-3 right-3">
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}

export function confirmToast(options: ConfirmOptions) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);

  const close = () => {
    root.unmount();
    container.remove();
  };

  root.render(
    <ConfirmUI
      title={options.title}
      message={options.message}
      onConfirm={options.onConfirm}
      onClose={close}
    />,
  );
}
