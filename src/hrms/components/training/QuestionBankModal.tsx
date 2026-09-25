/** @format */

import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "@/pages/HRMS/Alert/Toast";
import { X, Plus, Trash2, Pencil, CheckCircle2 } from "lucide-react";

interface Option {
  _id: string;
  text: string;
}
interface Question {
  _id: string;
  questionText: string;
  options: Option[];
  correctOptionId: string;
}

const MIN_QUESTIONS_RECOMMENDED = 4;

export default function QuestionBankModal({ module, onClose }: { module: { _id: string; title: string }; onClose: () => void }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchQuestions = () => {
    setLoading(true);
    axiosInstance
      .get(`/training/modules/${module._id}/questions`)
      .then((res) => setQuestions(res.data))
      .catch(() => toast({ type: "error", title: "Error", message: "Failed to load questions." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module._id]);

  const resetForm = () => {
    setEditingId(null);
    setQuestionText("");
    setOptions(["", ""]);
    setCorrectIndex(0);
  };

  const startEdit = (q: Question) => {
    setEditingId(q._id);
    setQuestionText(q.questionText);
    setOptions(q.options.map((o) => o.text));
    setCorrectIndex(Math.max(0, q.options.findIndex((o) => o._id === q.correctOptionId)));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await axiosInstance.delete(`/training/questions/${id}`);
      toast({ type: "success", title: "Deleted", message: "Question removed." });
      fetchQuestions();
      if (editingId === id) resetForm();
    } catch {
      toast({ type: "error", title: "Error", message: "Failed to delete question." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!questionText.trim() || cleanOptions.length < 2) {
      toast({ type: "error", title: "Incomplete", message: "Enter a question and at least 2 options." });
      return;
    }
    if (correctIndex >= cleanOptions.length) {
      toast({ type: "error", title: "Invalid", message: "Select a valid correct option." });
      return;
    }
    setSaving(true);
    try {
      const payload = { questionText: questionText.trim(), options: cleanOptions, correctOptionIndex: correctIndex };
      if (editingId) {
        await axiosInstance.put(`/training/questions/${editingId}`, payload);
        toast({ type: "success", title: "Updated", message: "Question updated." });
      } else {
        await axiosInstance.post(`/training/modules/${module._id}/questions`, payload);
        toast({ type: "success", title: "Added", message: "Question added." });
      }
      resetForm();
      fetchQuestions();
    } catch (err: any) {
      toast({ type: "error", title: "Save failed", message: err.response?.data?.message || "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-premium-lg w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">Question Bank</h2>
            <p className="text-xs text-[var(--muted-foreground)]">{module.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-full hover:bg-[var(--muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {!loading && questions.length < MIN_QUESTIONS_RECOMMENDED && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              At least {MIN_QUESTIONS_RECOMMENDED} questions are needed before trainees can take this module's test
              ({questions.length}/{MIN_QUESTIONS_RECOMMENDED} so far).
            </div>
          )}

          <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">{editingId ? "Edit Question" : "Add Question"}</p>
            <textarea
              placeholder="Question text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm h-16"
            />
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                    title="Mark as correct answer"
                  />
                  <input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    className="flex-1 h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setOptions(options.filter((_, idx) => idx !== i));
                        if (correctIndex >= i && correctIndex > 0) setCorrectIndex(correctIndex - 1);
                      }}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--status-critical)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={() => setOptions([...options, ""])}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]"
                >
                  <Plus className="h-3.5 w-3.5" /> Add option
                </button>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              {editingId && (
                <button type="button" onClick={resetForm} className="h-9 px-4 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--muted)]">
                  Cancel Edit
                </button>
              )}
              <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : editingId ? "Save Question" : "Add Question"}
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {loading && <p className="text-xs text-[var(--muted-foreground)]">Loading questions…</p>}
            {!loading && questions.length === 0 && <p className="text-xs text-[var(--muted-foreground)]">No questions yet.</p>}
            {questions.map((q, i) => (
              <div key={q._id} className="rounded-lg border border-[var(--border)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--foreground)]">{i + 1}. {q.questionText}</p>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => startEdit(q)} className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(q._id)} className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--status-critical)]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 space-y-0.5">
                  {q.options.map((o) => (
                    <p key={o._id} className={`text-xs ${o._id === q.correctOptionId ? "font-semibold text-emerald-600 flex items-center gap-1" : "text-[var(--muted-foreground)]"}`}>
                      {o._id === q.correctOptionId && <CheckCircle2 className="h-3 w-3" />} {o.text}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
