/** @format */

import { useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "@/pages/HRMS/Alert/Toast";
import { X, Upload, Trash2, FileText, Video as VideoIcon } from "lucide-react";

interface ContentItem {
  _id: string;
  contentType: "Video" | "PDF" | "PPT";
  mediaUrl: string;
  fileName?: string;
  minWatchTime: number;
}

interface ModuleLike {
  _id: string;
  title: string;
  contents: ContentItem[];
}

export default function ManageMediaModal({
  module,
  mediaBase,
  onClose,
  onChanged,
}: {
  module: ModuleLike;
  mediaBase: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [contents, setContents] = useState<ContentItem[]>(module.contents || []);
  const [files, setFiles] = useState<File[]>([]);
  const [watchMinutes, setWatchMinutes] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setWatchMinutes(selected.map(() => 0));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const data = new FormData();
      files.forEach((f) => data.append("files", f));
      data.append("minWatchTimes", JSON.stringify(watchMinutes.map((m) => Math.round(m * 60))));
      const res = await axiosInstance.post(`/training/modules/${module._id}/media`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setContents(res.data.contents || []);
      setFiles([]);
      setWatchMinutes([]);
      toast({ type: "success", title: "Uploaded", message: "Chapters added successfully." });
      onChanged();
    } catch (err: any) {
      toast({ type: "error", title: "Upload failed", message: err.response?.data?.message || "Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!window.confirm("Remove this chapter? This cannot be undone.")) return;
    try {
      const res = await axiosInstance.delete(`/training/modules/${module._id}/media/${contentId}`);
      setContents(res.data.contents || []);
      toast({ type: "success", title: "Removed", message: "Chapter removed." });
      onChanged();
    } catch {
      toast({ type: "error", title: "Error", message: "Failed to remove chapter." });
    }
  };

  const handleWatchTimeSave = async (contentId: string, minutes: number) => {
    try {
      const res = await axiosInstance.put(`/training/modules/${module._id}/media/${contentId}`, {
        minWatchTime: Math.round(minutes * 60),
      });
      setContents(res.data.contents || []);
      onChanged();
    } catch {
      toast({ type: "error", title: "Error", message: "Failed to update watch time." });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-premium-lg w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Manage Content</h2>
            <p className="text-xs text-[var(--muted-foreground)]">{module.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-full hover:bg-[var(--muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            {contents.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No chapters uploaded yet.</p>}
            {contents.map((c, i) => (
              <div key={c._id} className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2.5">
                {c.contentType === "Video" ? <VideoIcon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" /> : <FileText className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />}
                <div className="flex-1 min-w-0">
                  <a href={`${mediaBase}${c.mediaUrl}`} target="_blank" rel="noreferrer" className="block truncate text-xs font-medium text-[var(--foreground)] hover:underline">
                    Chapter {i + 1}: {c.fileName || c.contentType}
                  </a>
                  {c.contentType === "Video" && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--muted-foreground)]">Min watch (min)</span>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        defaultValue={(c.minWatchTime / 60).toFixed(1)}
                        onBlur={(e) => handleWatchTimeSave(c._id, Number(e.target.value))}
                        className="w-16 h-7 rounded border border-[var(--border)] px-1.5 text-[11px]"
                      />
                    </div>
                  )}
                </div>
                <button onClick={() => handleDelete(c._id)} className="p-1.5 text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_8%,transparent)] rounded-md">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <label className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--border)] p-4 text-center cursor-pointer hover:border-[var(--primary)]">
              <Upload className="h-5 w-5 text-[var(--muted-foreground)]" />
              <span className="text-xs text-[var(--muted-foreground)]">{files.length ? `${files.length} file(s) selected` : "Add more chapters (video / PDF / PPT)"}</span>
              <input type="file" multiple accept="video/*,.pdf,.ppt,.pptx" onChange={handleFilesChange} className="hidden" />
            </label>
            {files.map((f, i) => (
              <div key={i} className="mt-2 flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-[var(--foreground)]">{f.name}</span>
                {f.type.startsWith("video/") && (
                  <>
                    <span className="text-[var(--muted-foreground)]">Min watch (min):</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      className="w-16 h-8 rounded border border-[var(--border)] px-2 text-xs"
                      value={watchMinutes[i] ?? 0}
                      onChange={(e) => {
                        const next = [...watchMinutes];
                        next[i] = Number(e.target.value);
                        setWatchMinutes(next);
                      }}
                    />
                  </>
                )}
              </div>
            ))}
            {files.length > 0 && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="mt-3 w-full h-10 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
