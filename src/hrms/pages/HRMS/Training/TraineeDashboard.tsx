/** @format */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { BookOpen, Lock, CheckCircle2, PlayCircle, RotateCcw, GraduationCap } from "lucide-react";

interface ModuleCard {
  module: {
    _id: string;
    title: string;
    description?: string;
    category?: string;
    sequenceOrder: number;
    contents: any[];
    testDurationMinutes: number;
  };
  progress: { status: string; isTestUnlocked: boolean; completedContentIds: string[] } | null;
  attemptsUsed: number;
  isPassed: boolean;
  isLockedBySequence: boolean;
}

const STATUS_COPY: Record<string, { label: string; className: string }> = {
  "In-Training": { label: "In Training", className: "bg-blue-100 text-blue-700" },
  Pending_2nd_Attempt: { label: "2nd Attempt Pending", className: "bg-amber-100 text-amber-700" },
  Passed: { label: "Passed — Awaiting HR Review", className: "bg-emerald-100 text-emerald-700" },
  Failed: { label: "Not Eligible — Contact HR", className: "bg-red-100 text-red-700" },
  Completed_Onboarding: { label: "Onboarded", className: "bg-emerald-100 text-emerald-700" },
};

export default function TraineeDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [modules, setModules] = useState<ModuleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance
      .get("/my-training/dashboard")
      .then((res) => {
        setProfile(res.data.profile);
        setModules(res.data.modules || []);
      })
      .catch(() => setError("Failed to load your training dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-[var(--muted-foreground)]">Loading your training…</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-[var(--status-critical)]">{error}</div>;
  }

  if (!profile || modules.length === 0) {
    return (
      <div className="p-6 sm:p-8">
        <div className="card-premium max-w-xl mx-auto p-8 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">No training modules assigned yet</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Please contact HR — modules for your department haven't been assigned to you yet.
          </p>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_COPY[profile.status] || STATUS_COPY["In-Training"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">My Training</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Complete each module in order to finish onboarding.</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusInfo.className}`}>{statusInfo.label}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(({ module, progress, attemptsUsed, isPassed, isLockedBySequence }) => {
          const contentDone = progress?.completedContentIds?.length || 0;
          const contentTotal = module.contents?.length || 0;

          let cta = "Start Learning";
          let ctaIcon = PlayCircle;
          if (isLockedBySequence) {
            cta = "Locked";
          } else if (isPassed) {
            cta = "Review Materials";
            ctaIcon = CheckCircle2;
          } else if (attemptsUsed === 1) {
            cta = "Retake Test (1 Attempt Left)";
            ctaIcon = RotateCcw;
          } else if (progress?.isTestUnlocked) {
            cta = "Take Test";
            ctaIcon = GraduationCap;
          } else if (contentDone > 0) {
            cta = "Continue Learning";
          }

          const Icon = isLockedBySequence ? Lock : ctaIcon;

          return (
            <div key={module._id} className="card-premium shadow-premium-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]">
                  <BookOpen className="h-5 w-5" />
                </div>
                {isPassed && <CheckCircle2 className="h-5 w-5 text-[var(--status-good)]" />}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">{module.title}</h3>
                {module.description && (
                  <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">{module.description}</p>
                )}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {contentTotal > 0 ? `${contentDone}/${contentTotal} chapters completed` : "No chapters yet"}
              </div>
              <button
                type="button"
                disabled={isLockedBySequence}
                onClick={() => navigate(`/hrms/training/module/${module._id}`)}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none disabled:bg-none disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
              >
                <Icon className="h-4 w-4" />
                {cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
