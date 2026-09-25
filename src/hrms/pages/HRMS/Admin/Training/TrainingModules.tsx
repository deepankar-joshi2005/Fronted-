/** @format */

import { useEffect, useState } from "react";
import axiosInstance, { API_URL } from "@/api/axiosInstance";
import { toast } from "@/pages/HRMS/Alert/Toast";
import { Plus, X, Upload, Trash2, FileQuestion, Film, Pencil, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ManageMediaModal from "@/components/training/ManageMediaModal";
import QuestionBankModal from "@/components/training/QuestionBankModal";

const MEDIA_BASE = API_URL.replace("/api", "");

const CATEGORIES = ["Induction", "SOP", "Process", "Compliance", "Other"];

const labelClass = "block mb-1.5 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide";
const inputClass = "w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
const selectClass = inputClass;

interface Department {
  _id: string;
  name: string;
}

interface TrainingModuleItem {
  _id: string;
  title: string;
  description?: string;
  departmentId?: { _id: string; name: string } | null;
  category?: string;
  sequenceOrder: number;
  contents: any[];
  testDurationMinutes: number;
  passPercentage: number;
  isActive: boolean;
}

export default function TrainingModules() {
  // Routes exist under both /hrms/SuperAdmin/training/... and /hrms/admin/training/...
  // — derive the active prefix from the URL instead of hardcoding one.
  const location = useLocation();
  const rolePrefix = location.pathname.split("/")[2] || "SuperAdmin";
  const [modules, setModules] = useState<TrainingModuleItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModuleItem | null>(null);
  const [mediaModalModule, setMediaModalModule] = useState<TrainingModuleItem | null>(null);
  const [questionModalModule, setQuestionModalModule] = useState<TrainingModuleItem | null>(null);

  const fetchModules = () => {
    setLoading(true);
    axiosInstance
      .get("/training/modules")
      .then((res) => setModules(res.data))
      .catch(() => toast({ type: "error", title: "Error", message: "Failed to load training modules." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchModules();
    axiosInstance.get("/departments").then((res) => setDepartments(res.data || [])).catch(() => {});
  }, []);

  const handleDeactivate = async (moduleId: string) => {
    if (!window.confirm("Deactivate this module? Trainees will no longer see it.")) return;
    try {
      await axiosInstance.delete(`/training/modules/${moduleId}`);
      toast({ type: "success", title: "Deactivated", message: "Module deactivated." });
      fetchModules();
    } catch {
      toast({ type: "error", title: "Error", message: "Failed to deactivate module." });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">Training Modules</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Upload department-wise training chapters and question banks.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/hrms/${rolePrefix}/training/trainees`}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            <Users className="h-4 w-4" /> Trainees
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditingModule(null);
              setShowFormModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-3.5 py-2.5 text-sm font-semibold text-white shadow-premium-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Module
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      ) : modules.length === 0 ? (
        <div className="card-premium p-8 text-center text-sm text-[var(--muted-foreground)]">No training modules yet. Create the first one.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <div key={m._id} className="card-premium shadow-premium-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]">
                    {m.departmentId?.name || "All Departments"}
                  </span>
                  <h3 className="mt-1.5 font-semibold text-[var(--foreground)]">{m.title}</h3>
                </div>
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">#{m.sequenceOrder}</span>
              </div>
              {m.description && <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{m.description}</p>}
              <p className="text-xs text-[var(--muted-foreground)]">
                {m.contents?.length || 0} chapters · {m.testDurationMinutes} min test · {m.passPercentage}% to pass
              </p>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingModule(m);
                    setShowFormModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setMediaModalModule(m)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  <Film className="h-3.5 w-3.5" /> Content
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionModalModule(m)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-2 py-2 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  <FileQuestion className="h-3.5 w-3.5" /> Questions
                </button>
                <button
                  type="button"
                  onClick={() => handleDeactivate(m._id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--status-critical)]/30 px-2 py-2 text-xs font-medium text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_8%,transparent)]"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <ModuleFormModal
          module={editingModule}
          departments={departments}
          onClose={() => setShowFormModal(false)}
          onSaved={() => {
            setShowFormModal(false);
            fetchModules();
          }}
        />
      )}

      {mediaModalModule && (
        <ManageMediaModal module={mediaModalModule} mediaBase={MEDIA_BASE} onClose={() => setMediaModalModule(null)} onChanged={fetchModules} />
      )}

      {questionModalModule && <QuestionBankModal module={questionModalModule} onClose={() => setQuestionModalModule(null)} />}
    </div>
  );
}

/* ======================================================
   CREATE / EDIT MODULE MODAL
   ====================================================== */
function ModuleFormModal({
  module,
  departments,
  onClose,
  onSaved,
}: {
  module: TrainingModuleItem | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!module;
  const [form, setForm] = useState({
    title: module?.title || "",
    description: module?.description || "",
    departmentId: module?.departmentId?._id || "",
    category: module?.category || "Induction",
    sequenceOrder: module?.sequenceOrder || 1,
    testDurationMinutes: module?.testDurationMinutes || 20,
    passPercentage: module?.passPercentage || 70,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [watchMinutes, setWatchMinutes] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setWatchMinutes(selected.map(() => 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ type: "error", title: "Missing title", message: "Please enter a module title." });
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/training/modules/${module!._id}`, {
          ...form,
          departmentId: form.departmentId || null,
        });
      } else {
        const data = new FormData();
        data.append("title", form.title);
        data.append("description", form.description);
        data.append("departmentId", form.departmentId);
        data.append("category", form.category);
        data.append("sequenceOrder", String(form.sequenceOrder));
        data.append("testDurationMinutes", String(form.testDurationMinutes));
        data.append("passPercentage", String(form.passPercentage));
        files.forEach((f) => data.append("files", f));
        data.append("minWatchTimes", JSON.stringify(watchMinutes.map((m) => Math.round(m * 60))));
        await axiosInstance.post("/training/modules", data, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast({ type: "success", title: "Saved", message: `Module ${isEdit ? "updated" : "created"} successfully.` });
      onSaved();
    } catch (err: any) {
      toast({ type: "error", title: "Save failed", message: err.response?.data?.message || "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-premium-lg w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--foreground)]">{isEdit ? "Edit Module" : "New Training Module"}</h2>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-full hover:bg-[var(--muted)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea className={`${inputClass} h-20 py-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Department</label>
              <select className={selectClass} value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select className={selectClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Sequence #</label>
              <input type="number" min={1} className={inputClass} value={form.sequenceOrder} onChange={(e) => setForm({ ...form, sequenceOrder: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Test Duration (min)</label>
              <input type="number" min={1} className={inputClass} value={form.testDurationMinutes} onChange={(e) => setForm({ ...form, testDurationMinutes: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Pass %</label>
              <input type="number" min={1} max={100} className={inputClass} value={form.passPercentage} onChange={(e) => setForm({ ...form, passPercentage: Number(e.target.value) })} />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className={labelClass}>Chapters (Video / PDF / PPT)</label>
              <label className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--border)] p-4 text-center cursor-pointer hover:border-[var(--primary)]">
                <Upload className="h-5 w-5 text-[var(--muted-foreground)]" />
                <span className="text-xs text-[var(--muted-foreground)]">{files.length ? `${files.length} file(s) selected` : "Click to select files (up to 5)"}</span>
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
              <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">You can add more chapters later from the "Content" button on the module card.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-11 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)]">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-11 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Module"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
