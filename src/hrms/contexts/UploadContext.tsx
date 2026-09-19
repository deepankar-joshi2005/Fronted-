import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface ActiveUploadMeta {
  id: string;
  title: string;
  fileName: string;
}

interface ActiveUploadState extends ActiveUploadMeta {
  progress: number; // 0-100
  startedAt: number;
}

interface UploadContextValue {
  activeUpload: ActiveUploadState | null;
  startUpload: (meta: ActiveUploadMeta) => void;
  updateProgress: (percent: number) => void;
  finishUpload: () => void;
  isUploading: boolean;
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [activeUpload, setActiveUpload] = useState<ActiveUploadState | null>(null);
  const isUploading = !!activeUpload && activeUpload.progress < 100;

  const hasBeforeUnload = useRef(false);

  const startUpload = useCallback((meta: ActiveUploadMeta) => {
    setActiveUpload({ ...meta, progress: 0, startedAt: Date.now() });
  }, []);

  const updateProgress = useCallback((percent: number) => {
    setActiveUpload((prev) => (prev ? { ...prev, progress: Math.max(0, Math.min(100, Math.round(percent))) } : prev));
  }, []);

  const finishUpload = useCallback(() => {
    setActiveUpload((prev) => (prev ? { ...prev, progress: 100 } : prev));
    // Emit custom event when upload completes
    window.dispatchEvent(new CustomEvent('uploadCompleted'));
    // Allow a short delay for UI to show 100% then clear
    setTimeout(() => setActiveUpload(null), 1500);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = "Your upload is still in progress. Leaving will cancel it.";
        return e.returnValue;
      }
      return undefined;
    };

    if (isUploading && !hasBeforeUnload.current) {
      window.addEventListener("beforeunload", handler);
      hasBeforeUnload.current = true;
    }

    if (!isUploading && hasBeforeUnload.current) {
      window.removeEventListener("beforeunload", handler);
      hasBeforeUnload.current = false;
    }

    return () => {
      if (hasBeforeUnload.current) {
        window.removeEventListener("beforeunload", handler);
        hasBeforeUnload.current = false;
      }
    };
  }, [isUploading]);

  const value = useMemo<UploadContextValue>(
    () => ({ activeUpload, startUpload, updateProgress, finishUpload, isUploading }),
    [activeUpload, startUpload, updateProgress, finishUpload, isUploading]
  );

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useUpload must be used within an UploadProvider");
  return ctx;
}


