import { useEffect, useRef, useState } from "react";
import {
  Plus,
  ClipboardCheck,
  Trash2,
  Pencil,
  Eye,
  RefreshCw,
  AlertTriangle,
  Clock,
  Check as CheckIcon,
  Hourglass,
  CheckCircle2,
  ListChecks,
  CalendarDays,
  Upload,
  Paperclip,
  Download,
  X as XIcon,
} from "lucide-react";
import * as complianceApi from "../../api/compliance.api.js";
import * as crmApi from "../../api/crm.api.js";
import * as staffApi from "../../api/staff.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ROLES } from "../../config/roles.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ComplianceCalendar from "../../components/compliance/ComplianceCalendar.jsx";

const CATEGORY_LABELS = { gst: "GST", tds: "TDS", roc: "ROC", income_tax: "Income Tax", other: "Other" };
const RECURRENCE_LABELS = { one_time: "One-time", monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
const STATUS_LABELS = { pending: "Pending", in_progress: "In Progress", done: "Done" };
const STATUS_BADGE = { pending: "neutral", in_progress: "brand", done: "success" };
const TEMPLATES = [
  { label: "Custom task", title: "", category: "other", recurrence: "one_time" },
  { label: "GST Monthly Filing", title: "GST Monthly Filing", category: "gst", recurrence: "monthly" },
  { label: "TDS Quarterly Filing", title: "TDS Quarterly Filing", category: "tds", recurrence: "quarterly" },
  { label: "ROC Annual Filing", title: "ROC Annual Filing", category: "roc", recurrence: "annual" },
  { label: "Income Tax Return", title: "Income Tax Return", category: "income_tax", recurrence: "annual" },
];

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function TaskFormModal({ isAdmin, staffOptions, clientOptions, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    category: "other",
    recurrence: "one_time",
    dueDate: "",
    clientId: "",
    assignedTo: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function applyTemplate(e) {
    const tpl = TEMPLATES.find((t) => t.label === e.target.value);
    if (tpl) setForm((f) => ({ ...f, title: tpl.title, category: tpl.category, recurrence: tpl.recurrence }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.assignedTo) delete payload.assignedTo;
      await complianceApi.createTask(payload);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add task");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add a compliance task"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="create-task-form" type="submit" loading={submitting}>
            Add task
          </Button>
        </>
      }
    >
      <form id="create-task-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <Select label="Start from a template" onChange={applyTemplate} defaultValue="Custom task">
          {TEMPLATES.map((t) => (
            <option key={t.label} value={t.label}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input label="Title" required value={form.title} onChange={update("title")} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" value={form.category} onChange={update("category")}>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select label="Recurrence" value={form.recurrence} onChange={update("recurrence")}>
            {Object.entries(RECURRENCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Due date" type="date" required value={form.dueDate} onChange={update("dueDate")} />
          <Select label="Client" required value={form.clientId} onChange={update("clientId")}>
            <option value="" disabled>
              Select client
            </option>
            {clientOptions.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
                {c.company ? ` (${c.company})` : ""}
              </option>
            ))}
          </Select>
        </div>
        {isAdmin && (
          <Select label="Assign to" value={form.assignedTo} onChange={update("assignedTo")}>
            <option value="">Unassigned</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </form>
    </Modal>
  );
}

// ── Document checklist (shared by Edit and Upload Document modals) ─────────

function DocumentChecklistEditor({ documents, newDoc, setNewDoc, uploading, fileInputRef, onToggle, onAdd, onRemove, onFileSelected }) {
  return (
    <div className="flex flex-col gap-2">
      {documents.map((doc, i) =>
        doc.fileUrl ? (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
            <Paperclip size={14} className="shrink-0 text-brand" />
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 truncate text-sm font-medium text-text hover:text-brand"
              title={doc.fileName}
            >
              {doc.label}
            </a>
            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-text-muted hover:text-brand" title="Download">
              <Download size={14} />
            </a>
            <button type="button" onClick={() => onRemove(i)} className="text-text-muted hover:text-danger">
              <XIcon size={14} />
            </button>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle(i)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                doc.done ? "border-success bg-success text-white" : "border-border"
              }`}
            >
              {doc.done && <CheckIcon size={12} />}
            </button>
            <span className={`flex-1 text-sm ${doc.done ? "text-text-muted line-through" : "text-text"}`}>{doc.label}</span>
            <button type="button" onClick={() => onRemove(i)} className="text-xs text-text-muted hover:text-danger">
              Remove
            </button>
          </div>
        )
      )}
      <div className="mt-1 flex gap-2">
        <Input placeholder="Add a document/checklist item..." value={newDoc} onChange={(e) => setNewDoc(e.target.value)} />
        <Button type="button" variant="secondary" onClick={onAdd}>
          Add
        </Button>
      </div>
      <div>
        <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />
        <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileInputRef.current?.click()}>
          <Upload size={14} /> Attach a file (proof of filing)
        </Button>
        <span className="ml-2 text-xs text-text-muted">PDF, image, or Office doc — max 10MB</span>
      </div>
    </div>
  );
}

// ── View (read-only) ─────────────────────────────────────────────────────────

function ViewTaskModal({ task, onClose, onChanged }) {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(task.notes || []);
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState("");

  async function handleAddNote() {
    if (!note.trim()) return;
    setAddingNote(true);
    setError("");
    try {
      const { data } = await complianceApi.addTaskNote(task._id, { text: note.trim() });
      setNotes(data.data.notes);
      setNote("");
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add note");
    } finally {
      setAddingNote(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={task.title} size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-text-muted">Client</p>
            <p className="text-text">
              {task.clientId?.name}
              {task.clientId?.company ? ` (${task.clientId.company})` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Assigned to</p>
            <p className="text-text">{task.assignedTo?.name || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Category</p>
            <p className="text-text">{CATEGORY_LABELS[task.category]}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Recurrence</p>
            <p className="text-text">{RECURRENCE_LABELS[task.recurrence]}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Due date</p>
            <p className="text-text">{formatDate(task.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Status</p>
            <Badge variant={STATUS_BADGE[task.status]}>{STATUS_LABELS[task.status]}</Badge>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Document checklist</p>
          {(task.documents || []).length === 0 ? (
            <p className="text-sm text-text-muted">No documents yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {task.documents.map((doc, i) =>
                doc.fileUrl ? (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
                    <Paperclip size={14} className="shrink-0 text-brand" />
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate text-sm font-medium text-text hover:text-brand"
                      title={doc.fileName}
                    >
                      {doc.label}
                    </a>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-text-muted hover:text-brand" title="Download">
                      <Download size={14} />
                    </a>
                  </div>
                ) : (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        doc.done ? "border-success bg-success text-white" : "border-border"
                      }`}
                    >
                      {doc.done && <CheckIcon size={12} />}
                    </span>
                    <span className={`flex-1 text-sm ${doc.done ? "text-text-muted line-through" : "text-text"}`}>{doc.label}</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Notes &amp; activity</p>
          {error && <div className="mb-3 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
          <div className="flex max-h-48 flex-col gap-3 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-sm text-text-muted">No notes yet.</p>
            ) : (
              [...notes].reverse().map((n, i) => (
                <div key={i} className="rounded-lg border border-border bg-surface-2 p-3">
                  <p className="text-sm text-text">{n.text}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {n.createdByName} · {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Input placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="button" onClick={handleAddNote} loading={addingNote}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Update status (Admin + assigned Staff) ──────────────────────────────────

function UpdateStatusModal({ task, onClose, onUpdated }) {
  const [status, setStatus] = useState(task.status);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await complianceApi.updateTask(task._id, { status });
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Update status — ${task.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="update-status-form" type="submit" loading={saving}>
            Update status
          </Button>
        </>
      }
    >
      <form id="update-status-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}

// ── Upload document (assigned Staff) ────────────────────────────────────────

function DocumentsModal({ task, onClose, onUpdated }) {
  const [documents, setDocuments] = useState(task.documents || []);
  const [newDoc, setNewDoc] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function toggleDoc(i) {
    setDocuments((docs) => docs.map((d, idx) => (idx === i ? { ...d, done: !d.done } : d)));
  }
  function addDocItem() {
    if (!newDoc.trim()) return;
    setDocuments((docs) => [...docs, { label: newDoc.trim(), done: false }]);
    setNewDoc("");
  }
  function removeDocItem(i) {
    setDocuments((docs) => docs.filter((_, idx) => idx !== i));
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await complianceApi.uploadTaskDocument(task._id, formData);
      setDocuments(data.data.documents);
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await complianceApi.updateTask(task._id, { documents });
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save documents");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Documents — ${task.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      {error && <div className="mb-3 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
      <DocumentChecklistEditor
        documents={documents}
        newDoc={newDoc}
        setNewDoc={setNewDoc}
        uploading={uploading}
        fileInputRef={fileInputRef}
        onToggle={toggleDoc}
        onAdd={addDocItem}
        onRemove={removeDocItem}
        onFileSelected={handleFileSelected}
      />
    </Modal>
  );
}

// ── Edit (Admin only) ────────────────────────────────────────────────────────

function EditTaskModal({ task, staffOptions, onClose, onChanged }) {
  const [form, setForm] = useState({
    title: task.title,
    category: task.category,
    recurrence: task.recurrence,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    assignedTo: task.assignedTo?._id || task.assignedTo || "",
  });
  const [documents, setDocuments] = useState(task.documents || []);
  const [newDoc, setNewDoc] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
  function toggleDoc(i) {
    setDocuments((docs) => docs.map((d, idx) => (idx === i ? { ...d, done: !d.done } : d)));
  }
  function addDocItem() {
    if (!newDoc.trim()) return;
    setDocuments((docs) => [...docs, { label: newDoc.trim(), done: false }]);
    setNewDoc("");
  }
  function removeDocItem(i) {
    setDocuments((docs) => docs.filter((_, idx) => idx !== i));
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await complianceApi.uploadTaskDocument(task._id, formData);
      setDocuments(data.data.documents);
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload file");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await complianceApi.updateTask(task._id, { ...form, documents });
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit — ${task.title}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button form="task-edit-form" type="submit" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="task-edit-form" onSubmit={handleSave} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <p className="text-sm text-text-muted">
          Client: <span className="font-medium text-text">{task.clientId?.name}</span>
          {task.clientId?.company ? ` (${task.clientId.company})` : ""}
        </p>
        <Input label="Title" required value={form.title} onChange={update("title")} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" value={form.category} onChange={update("category")}>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select label="Recurrence" value={form.recurrence} onChange={update("recurrence")}>
            {Object.entries(RECURRENCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" value={form.status} onChange={update("status")}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Input label="Due date" type="date" required value={form.dueDate} onChange={update("dueDate")} />
        </div>
        <Select label="Assigned to" value={form.assignedTo} onChange={update("assignedTo")}>
          <option value="">Unassigned</option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </form>

      <div className="mt-6 border-t border-border pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Document checklist</p>
        <DocumentChecklistEditor
          documents={documents}
          newDoc={newDoc}
          setNewDoc={setNewDoc}
          uploading={uploading}
          fileInputRef={fileInputRef}
          onToggle={toggleDoc}
          onAdd={addDocItem}
          onRemove={removeDocItem}
          onFileSelected={handleFileSelected}
        />
      </div>
    </Modal>
  );
}

function DeleteTaskModal({ task, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await complianceApi.deleteTask(task._id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task");
      setDeleting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete compliance task"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </>
      }
    >
      {error && <div className="mb-3 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
      <p className="text-sm text-text-muted">
        Delete <strong className="text-text">{task.title}</strong>? This cannot be undone.
      </p>
    </Modal>
  );
}

export default function CompliancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.CA_FIRM_ADMIN;

  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [statusTask, setStatusTask] = useState(null);
  const [documentsTask, setDocumentsTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState("list");
  const [refreshTick, setRefreshTick] = useState(0);

  async function loadTasks(statusValue = status) {
    setLoading(true);
    try {
      const params = {};
      if (statusValue) params.status = statusValue;
      const { data } = await complianceApi.listTasks(params);
      setTasks(data.data);
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard() {
    const { data } = await complianceApi.getComplianceDashboard();
    setDashboard(data.data);
  }

  useEffect(() => {
    loadDashboard();
    // Only converted leads count as "active clients" (Module Scope doc,
    // Section 3) — compliance tasks are for clients, not raw leads.
    crmApi.listLeads({ limit: 100, status: "converted" }).then(({ data }) => setClientOptions(data.data));
    if (isAdmin) {
      staffApi.listStaff().then(({ data }) => {
        setStaffOptions([{ id: user.id, name: `${user.name} (You)` }, ...data.data.map((s) => ({ id: s.id, name: s.name }))]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTasks(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function refreshAll() {
    loadTasks();
    loadDashboard();
    setRefreshTick((t) => t + 1);
  }

  const columns = [
    {
      key: "title",
      label: "Task",
      render: (row) => (
        <button className="text-left" onClick={() => setViewTask(row)}>
          <p className="font-medium text-heading hover:text-brand">{row.title}</p>
          <p className="text-xs text-text-muted">
            {row.clientId?.name}
            {row.clientId?.company ? ` (${row.clientId.company})` : ""}
          </p>
        </button>
      ),
    },
    { key: "category", label: "Category", render: (row) => CATEGORY_LABELS[row.category] },
    {
      key: "dueDate",
      label: "Due",
      render: (row) => {
        const overdue = new Date(row.dueDate) < new Date() && row.status !== "done";
        return <span className={overdue ? "font-medium text-danger" : ""}>{formatDate(row.dueDate)}</span>;
      },
    },
    { key: "assignedTo", label: "Assigned to", render: (row) => row.assignedTo?.name || "Unassigned" },
    { key: "status", label: "Status", render: (row) => <Badge variant={STATUS_BADGE[row.status]}>{STATUS_LABELS[row.status]}</Badge> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" title="View" onClick={() => setViewTask(row)}>
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" title="Update status" onClick={() => setStatusTask(row)}>
            <RefreshCw size={14} />
          </Button>
          {isAdmin ? (
            <>
              <Button variant="ghost" size="sm" title="Edit" onClick={() => setEditTask(row)}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(row)}>
                <Trash2 size={14} className="text-danger" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" title="Upload document" onClick={() => setDocumentsTask(row)}>
              <Upload size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Compliance Tool</h1>
          <p className="mt-1 text-sm text-text-muted">Track statutory filings and deadlines per client.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add task
        </Button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Hourglass size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold text-heading">{dashboard.counts.pending || 0}</p>
            <p className="text-xs text-text-muted">{STATUS_LABELS.pending}</p>
          </Card>
          <Card className="p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <ListChecks size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold text-heading">{dashboard.counts.in_progress || 0}</p>
            <p className="text-xs text-text-muted">{STATUS_LABELS.in_progress}</p>
          </Card>
          <Card className="p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-bg text-success">
              <CheckCircle2 size={18} />
            </div>
            <p className="mt-3 text-2xl font-bold text-heading">{dashboard.counts.done || 0}</p>
            <p className="text-xs text-text-muted">{STATUS_LABELS.done}</p>
          </Card>
        </div>
      )}

      {dashboard && (dashboard.overdue > 0 || dashboard.dueThisWeek > 0) && (
        <div className="flex flex-wrap gap-3">
          {dashboard.overdue > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2 text-sm text-danger">
              <AlertTriangle size={15} /> {dashboard.overdue} task{dashboard.overdue > 1 ? "s" : ""} overdue
            </div>
          )}
          {dashboard.dueThisWeek > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2 text-sm text-brand">
              <Clock size={15} /> {dashboard.dueThisWeek} task{dashboard.dueThisWeek > 1 ? "s" : ""} due this week
            </div>
          )}
        </div>
      )}

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "list" ? "bg-surface text-heading shadow-sm" : "text-text-muted hover:text-text"
            }`}
          >
            <ListChecks size={14} /> List
          </button>
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view === "calendar" ? "bg-surface text-heading shadow-sm" : "text-text-muted hover:text-text"
            }`}
          >
            <CalendarDays size={14} /> Calendar
          </button>
        </div>
        {view === "list" && (
          <div className="w-full sm:w-56">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Card>

      {view === "calendar" ? (
        <ComplianceCalendar onSelectTask={setViewTask} refreshKey={refreshTick} />
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No compliance tasks yet"
          description="Add a task for one of your clients to start tracking deadlines."
          action={
            <Button onClick={() => setModalOpen(true)} size="sm">
              <Plus size={15} /> Add task
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={tasks} keyField="_id" />
      )}

      {modalOpen && (
        <TaskFormModal
          isAdmin={isAdmin}
          staffOptions={staffOptions}
          clientOptions={clientOptions}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            refreshAll();
          }}
        />
      )}

      {viewTask && <ViewTaskModal task={viewTask} onClose={() => setViewTask(null)} onChanged={refreshAll} />}

      {statusTask && (
        <UpdateStatusModal
          task={statusTask}
          onClose={() => setStatusTask(null)}
          onUpdated={() => {
            setStatusTask(null);
            refreshAll();
          }}
        />
      )}

      {documentsTask && (
        <DocumentsModal
          task={documentsTask}
          onClose={() => setDocumentsTask(null)}
          onUpdated={() => {
            setDocumentsTask(null);
            refreshAll();
          }}
        />
      )}

      {editTask && (
        <EditTaskModal
          task={editTask}
          staffOptions={staffOptions}
          onClose={() => setEditTask(null)}
          onChanged={() => {
            setEditTask(null);
            refreshAll();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteTaskModal
          task={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
