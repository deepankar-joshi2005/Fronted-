/** @format */

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "@/pages/HRMS/Alert/Toast";
import { confirmDialog } from "@/pages/HRMS/Alert/Confirm";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, GraduationCap, ListChecks } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  "In-Training": "bg-blue-100 text-blue-700",
  Pending_2nd_Attempt: "bg-amber-100 text-amber-700",
  Passed: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
  Completed_Onboarding: "bg-slate-200 text-slate-700",
};

interface ModuleRef {
  _id: string;
  title: string;
  sequenceOrder?: number;
}

export default function TraineeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [allModules, setAllModules] = useState<ModuleRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModules, setEditingModules] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    axiosInstance
      .get(`/training/trainees/${id}`)
      .then((res) => {
        setProfile(res.data.profile);
        setProgress(res.data.progress || []);
        setAttempts(res.data.attempts || []);
        setSelectedModuleIds((res.data.profile.assignedModules || []).map((m: ModuleRef) => m._id));
      })
      .catch(() => toast({ type: "error", title: "Error", message: "Failed to load trainee details." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    axiosInstance.get("/training/modules").then((res) => setAllModules(res.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCompleteOnboarding = async () => {
    const confirmed = await confirmDialog({
      title: "Complete onboarding for this trainee?",
      message: "They will get full access based on their role.",
      confirmLabel: "Complete Onboarding",
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await axiosInstance.post(`/training/trainees/${id}/complete-onboarding`);
      toast({ type: "success", title: "Onboarded", message: "Trainee onboarded successfully." });
      load();
    } catch (err: any) {
      toast({ type: "error", title: "Error", message: err.response?.data?.message || "Failed to complete onboarding." });
    } finally {
      setBusy(false);
    }
  };

  const handleResetAttempts = async (moduleId: string) => {
    const confirmed = await confirmDialog({
      title: "Reset test attempts for this module?",
      message: "The trainee will be able to retake it.",
      confirmLabel: "Reset Attempts",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      await axiosInstance.post(`/training/trainees/${id}/reset-attempts`, { moduleId });
      toast({ type: "success", title: "Reset", message: "Attempts reset." });
      load();
    } catch {
      toast({ type: "error", title: "Error", message: "Failed to reset attempts." });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveModules = async () => {
    setBusy(true);
    try {
      await axiosInstance.put(`/training/trainees/${id}/modules`, { assignedModules: selectedModuleIds });
      toast({ type: "success", title: "Updated", message: "Assigned modules updated." });
      setEditingModules(false);
      load();
    } catch {
      toast({ type: "error", title: "Error", message: "Failed to update modules." });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-[var(--muted-foreground)]">Loading…</div>;
  if (!profile) return <div className="p-6 text-sm text-[var(--status-critical)]">Trainee not found.</div>;

  const assignedModules: ModuleRef[] = profile.assignedModules || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <ArrowLeft className="h-4 w-4" /> Back to Trainees
      </button>

      <div className="card-premium shadow-premium-sm p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{profile.user?.name}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{profile.user?.email} · {profile.departmentId?.name || "No Department"}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_BADGE[profile.status] || ""}`}>{profile.status.replace(/_/g, " ")}</span>
          {profile.status !== "Completed_Onboarding" && (
            <button
              onClick={handleCompleteOnboarding}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2 text-sm font-semibold text-white shadow-premium-sm hover:opacity-90 disabled:opacity-50"
            >
              <GraduationCap className="h-4 w-4" /> Complete Onboarding
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Assigned Modules</h2>
        <button
          onClick={() => setEditingModules((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)]"
        >
          <ListChecks className="h-3.5 w-3.5" /> {editingModules ? "Cancel" : "Edit Modules"}
        </button>
      </div>

      {editingModules && (
        <div className="card-premium p-4 space-y-2">
          {allModules.map((m) => (
            <label key={m._id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedModuleIds.includes(m._id)}
                onChange={(e) => {
                  setSelectedModuleIds((prev) => (e.target.checked ? [...prev, m._id] : prev.filter((id) => id !== m._id)));
                }}
              />
              {m.title}
            </label>
          ))}
          <button onClick={handleSaveModules} disabled={busy} className="mt-2 h-9 px-4 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
            Save
          </button>
        </div>
      )}

      <div className="space-y-3">
        {assignedModules.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">No modules assigned.</p>}
        {assignedModules.map((m) => {
          const moduleProgress = progress.find((p) => p.module?._id === m._id);
          const moduleAttempts = attempts.filter((a) => a.module?._id === m._id);
          return (
            <div key={m._id} className="card-premium shadow-premium-sm p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-[var(--foreground)]">{m.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {moduleProgress?.status || "Not started"} · {moduleProgress?.completedContentIds?.length || 0} chapters done
                  </span>
                  {moduleAttempts.length > 0 && (
                    <button
                      onClick={() => handleResetAttempts(m._id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1 text-xs font-medium hover:bg-[var(--muted)] disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset Attempts
                    </button>
                  )}
                </div>
              </div>

              {moduleAttempts.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {moduleAttempts.map((a) => (
                    <div key={a._id} className="flex items-center justify-between rounded-lg bg-[var(--muted)] px-3 py-2 text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
                        {a.isPassed ? <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-good)]" /> : <XCircle className="h-3.5 w-3.5 text-[var(--status-critical)]" />}
                        Attempt {a.attemptNumber}
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {a.scorePercentage ?? "—"}% {a.isTimeExpired && "(time expired)"} {a.finishedAt ? `· ${new Date(a.finishedAt).toLocaleString()}` : "· in progress"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
