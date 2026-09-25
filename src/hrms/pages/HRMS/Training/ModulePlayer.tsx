/** @format */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance, { API_URL } from "@/api/axiosInstance";
import { ArrowLeft, CheckCircle2, Circle, FileText, Video as VideoIcon, GraduationCap, Lock } from "lucide-react";

const MEDIA_BASE = API_URL.replace("/api", "");

interface ContentItem {
  _id: string;
  contentType: "Video" | "PDF" | "PPT";
  mediaUrl: string;
  fileName?: string;
  minWatchTime: number;
}

export default function ModulePlayer() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<any>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [isTestUnlocked, setIsTestUnlocked] = useState(false);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockedMessage, setLockedMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    axiosInstance
      .get(`/my-training/module/${moduleId}`)
      .then((res) => {
        setModule(res.data.module);
        setCompletedIds(new Set(res.data.progress?.completedContentIds || []));
        setIsTestUnlocked(!!res.data.progress?.isTestUnlocked);
        setActiveContentId((prev) => prev || res.data.module?.contents?.[0]?._id || null);
      })
      .catch((err) => {
        if (err.response?.data?.code === "SEQUENCE_LOCKED") {
          setLockedMessage(err.response.data.message || "Complete the previous module first.");
        } else {
          setLockedMessage("Failed to load this module.");
        }
      })
      .finally(() => setLoading(false));
  }, [moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  const markComplete = async (contentId: string) => {
    if (completedIds.has(contentId)) return;
    try {
      const res = await axiosInstance.post("/my-training/module/mark-content-completed", { moduleId, contentId });
      setCompletedIds(new Set(res.data.completedContentIds || []));
      setIsTestUnlocked(!!res.data.isTestUnlocked);
    } catch {
      // non-fatal — user can retry by finishing the video again
    }
  };

  const handleTimeUpdate = (content: ContentItem) => {
    const video = videoRef.current;
    if (!video || completedIds.has(content._id)) return;
    if (content.minWatchTime > 0 && video.currentTime >= content.minWatchTime) {
      markComplete(content._id);
    }
  };

  if (loading) return <div className="p-6 text-sm text-[var(--muted-foreground)]">Loading module…</div>;

  if (lockedMessage) {
    return (
      <div className="p-6 sm:p-8">
        <div className="card-premium max-w-lg mx-auto p-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Module locked</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{lockedMessage}</p>
          <Link to="/hrms/training" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
            <ArrowLeft className="h-4 w-4" /> Back to Training
          </Link>
        </div>
      </div>
    );
  }

  if (!module) return null;

  const contents: ContentItem[] = module.contents || [];
  const activeContent = contents.find((c) => c._id === activeContentId) || contents[0];
  const allDone = contents.length > 0 && contents.every((c) => completedIds.has(c._id));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <Link to="/hrms/training" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft className="h-4 w-4" /> Back to Training
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{module.title}</h1>
        {module.description && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{module.description}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Chapter list */}
        <div className="card-premium shadow-premium-sm p-3 space-y-1 h-fit">
          {contents.map((c, i) => (
            <button
              key={c._id}
              type="button"
              onClick={() => setActiveContentId(c._id)}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                activeContentId === c._id ? "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]" : "hover:bg-[var(--muted)] text-[var(--foreground)]"
              }`}
            >
              {completedIds.has(c._id) ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--status-good)]" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              )}
              {c.contentType === "Video" ? <VideoIcon className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
              <span className="truncate">Chapter {i + 1}: {c.fileName || c.contentType}</span>
            </button>
          ))}

          {contents.length === 0 && <p className="px-2 py-3 text-xs text-[var(--muted-foreground)]">No chapters uploaded yet.</p>}

          <div className="pt-2 mt-2 border-t border-[var(--border)]">
            {allDone && isTestUnlocked ? (
              <button
                type="button"
                onClick={() => navigate(`/hrms/training/module/${moduleId}/test`)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-premium-sm hover:opacity-90"
              >
                <GraduationCap className="h-4 w-4" /> Start Test
              </button>
            ) : (
              <p className="px-2 py-2 text-xs text-[var(--muted-foreground)]">
                Complete all chapters to unlock the test ({completedIds.size}/{contents.length})
              </p>
            )}
          </div>
        </div>

        {/* Viewer */}
        <div className="card-premium shadow-premium-sm p-4 sm:p-6">
          {!activeContent && <p className="text-sm text-[var(--muted-foreground)]">Select a chapter to begin.</p>}

          {activeContent && activeContent.contentType === "Video" && (
            <div className="space-y-3">
              <video
                ref={videoRef}
                key={activeContent._id}
                src={`${MEDIA_BASE}${activeContent.mediaUrl}`}
                controls
                controlsList="nodownload"
                className="w-full rounded-lg bg-black aspect-video"
                onTimeUpdate={() => handleTimeUpdate(activeContent)}
                onEnded={() => markComplete(activeContent._id)}
              />
              {activeContent.minWatchTime > 0 && !completedIds.has(activeContent._id) && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Watch at least {Math.ceil(activeContent.minWatchTime / 60)} min to mark this chapter complete.
                </p>
              )}
            </div>
          )}

          {activeContent && activeContent.contentType !== "Video" && (
            <div className="space-y-3">
              <iframe
                key={activeContent._id}
                src={`${MEDIA_BASE}${activeContent.mediaUrl}`}
                title={activeContent.fileName || activeContent.contentType}
                className="w-full h-[70vh] rounded-lg border border-[var(--border)]"
              />
              <button
                type="button"
                disabled={completedIds.has(activeContent._id)}
                onClick={() => markComplete(activeContent._id)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:pointer-events-none"
              >
                <CheckCircle2 className="h-4 w-4" />
                {completedIds.has(activeContent._id) ? "Marked as Read" : "Mark as Read"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
