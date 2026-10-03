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
  Receipt,
  Percent,
  Building2,
  Landmark,
  FileText,
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
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import ComplianceCalendar from "../../components/compliance/ComplianceCalendar.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";

const PAGE_SIZE = 15;

const CATEGORY_LABELS = { gst: "GST", tds: "TDS", roc: "ROC", income_tax: "Income Tax", other: "Other" };
const RECURRENCE_LABELS = { one_time: "One-time", monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
const STATUS_LABELS = { pending: "Pending", in_progress: "In Progress", done: "Done" };
const STATUS_BADGE = { pending: "neutral", in_progress: "brand", done: "success" };

// One dashboard card per "Main task" category — icon + accent color so GST,
// TDS, ROC, Income Tax and Other are visually distinct at a glance.
const CATEGORY_ICONS = { gst: Receipt, tds: Percent, roc: Building2, income_tax: Landmark, other: FileText };
const CATEGORY_ICON_STYLES = {
  gst: "bg-brand-soft text-brand",
  tds: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  roc: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  income_tax: "bg-success-bg text-success",
  other: "bg-surface-2 text-text-muted",
};
const EMPTY_CATEGORY_COUNTS = { pending: 0, in_progress: 0, done: 0, total: 0 };

// Every category's real-world filing/subtype vocabulary — powers the Subcategory
// select (dependent on Category) and the "Start from a template" picker. Not a
// separate DB collection on purpose (see ComplianceTask model comment): these are
// just title/category/subCategory/recurrence presets, every task is still created
// manually per period.
const TASK_CATALOG = {
  gst: [
    { value: "gstr1", label: "GSTR-1 — Outward Supplies", recurrence: "monthly" },
    { value: "gstr3b", label: "GSTR-3B — Summary Return", recurrence: "monthly" },
    { value: "gstr9", label: "GSTR-9 — Annual Return", recurrence: "annual" },
    { value: "gstr9c", label: "GSTR-9C — Reconciliation Statement", recurrence: "annual" },
    { value: "gstr4", label: "GSTR-4 — Composition Scheme Return", recurrence: "annual" },
    { value: "cmp08", label: "CMP-08 — Composition Quarterly Statement", recurrence: "quarterly" },
    { value: "gstr7", label: "GSTR-7 — TDS under GST", recurrence: "monthly" },
    { value: "gstr8", label: "GSTR-8 — TCS under GST (E-commerce)", recurrence: "monthly" },
    { value: "gstr5", label: "GSTR-5 — Non-Resident Taxable Person", recurrence: "monthly" },
    { value: "gstr6", label: "GSTR-6 — Input Service Distributor", recurrence: "monthly" },
    { value: "gst_registration", label: "GST Registration / Amendment", recurrence: "one_time" },
    { value: "eway_bill", label: "E-Way Bill Compliance", recurrence: "one_time" },
    { value: "gst_refund", label: "GST Refund Application", recurrence: "one_time" },
    { value: "lut", label: "LUT — Letter of Undertaking (Exports)", recurrence: "annual" },
    { value: "itc04", label: "ITC-04 — Job Work Return", recurrence: "quarterly" },
  ],
  tds: [
    { value: "24q", label: "24Q — Salary TDS Return", recurrence: "quarterly" },
    { value: "26q", label: "26Q — Non-Salary TDS Return (Resident)", recurrence: "quarterly" },
    { value: "27q", label: "27Q — TDS Return (Non-Resident)", recurrence: "quarterly" },
    { value: "27eq", label: "27EQ — TCS Return", recurrence: "quarterly" },
    { value: "tds_payment", label: "TDS Payment — Challan 281", recurrence: "monthly" },
    { value: "form16", label: "Form 16 — Salary TDS Certificate", recurrence: "annual" },
    { value: "form16a", label: "Form 16A — Non-Salary TDS Certificate", recurrence: "quarterly" },
    { value: "26as_recon", label: "Form 26AS / AIS Reconciliation", recurrence: "quarterly" },
    { value: "26qb", label: "Form 26QB — TDS on Property Purchase", recurrence: "one_time" },
    { value: "26qc", label: "Form 26QC — TDS on Rent", recurrence: "one_time" },
    { value: "27d", label: "Form 27D — TCS Certificate", recurrence: "quarterly" },
    { value: "tds_lower_deduction", label: "Lower/Nil Deduction Certificate (Form 13)", recurrence: "annual" },
  ],
  income_tax: [
    { value: "itr1", label: "ITR-1 (Sahaj)", recurrence: "annual" },
    { value: "itr2", label: "ITR-2", recurrence: "annual" },
    { value: "itr3", label: "ITR-3", recurrence: "annual" },
    { value: "itr4", label: "ITR-4 (Sugam)", recurrence: "annual" },
    { value: "itr5", label: "ITR-5", recurrence: "annual" },
    { value: "itr6", label: "ITR-6", recurrence: "annual" },
    { value: "itr7", label: "ITR-7", recurrence: "annual" },
    { value: "advance_tax", label: "Advance Tax Payment", recurrence: "quarterly" },
    { value: "tax_audit", label: "Tax Audit Report — 3CA/3CB-3CD", recurrence: "annual" },
    { value: "form3ceb", label: "Form 3CEB — Transfer Pricing Report", recurrence: "annual" },
    { value: "form15cacb", label: "Form 15CA/15CB — Foreign Remittance", recurrence: "one_time" },
    { value: "form10e", label: "Form 10E — Salary Arrears Relief", recurrence: "one_time" },
    { value: "scrutiny", label: "Assessment / Scrutiny Response", recurrence: "one_time" },
    { value: "revised_return", label: "Rectification / Revised Return", recurrence: "one_time" },
    { value: "lower_tds_cert", label: "Lower TDS Certificate (Form 13)", recurrence: "annual" },
  ],
  roc: [
    { value: "aoc4", label: "AOC-4 — Financial Statements", recurrence: "annual" },
    { value: "mgt7", label: "MGT-7 / MGT-7A — Annual Return", recurrence: "annual" },
    { value: "dir3kyc", label: "DIR-3 KYC — Director KYC", recurrence: "annual" },
    { value: "adt1", label: "ADT-1 — Auditor Appointment", recurrence: "annual" },
    { value: "dpt3", label: "DPT-3 — Return of Deposits", recurrence: "annual" },
    { value: "inc20a", label: "INC-20A — Commencement of Business", recurrence: "one_time" },
    { value: "inc22", label: "INC-22 — Registered Office Change", recurrence: "one_time" },
    { value: "msme1", label: "MSME-1 — Half-Yearly Return", recurrence: "annual" },
    { value: "pas3", label: "PAS-3 — Return of Allotment", recurrence: "one_time" },
    { value: "agm", label: "AGM Compliance", recurrence: "annual" },
    { value: "board_resolution", label: "Board Resolution / Minutes Filing", recurrence: "one_time" },
    { value: "statutory_registers", label: "Statutory Registers Maintenance", recurrence: "annual" },
    { value: "din_change", label: "DIR-6 / DIR-12 — Director Change", recurrence: "one_time" },
    { value: "llp_form8", label: "LLP Form 8 — Statement of Accounts", recurrence: "annual" },
    { value: "llp_form11", label: "LLP Form 11 — Annual Return", recurrence: "annual" },
  ],
  other: [
    { value: "pt_registration", label: "Professional Tax Registration", recurrence: "one_time" },
    { value: "pt_return", label: "Professional Tax Return", recurrence: "monthly" },
    { value: "esi_return", label: "ESI Return", recurrence: "monthly" },
    { value: "pf_return", label: "PF Return (EPF)", recurrence: "monthly" },
    { value: "shop_establishment", label: "Shop & Establishment Registration/Renewal", recurrence: "annual" },
    { value: "trademark", label: "Trademark / IP Filing", recurrence: "one_time" },
    { value: "msme_udyam", label: "MSME / Udyam Registration", recurrence: "one_time" },
    { value: "fssai", label: "FSSAI License Registration/Renewal", recurrence: "annual" },
    { value: "iec", label: "IEC — Import Export Code", recurrence: "one_time" },
    { value: "custom", label: "Custom Task", recurrence: "one_time" },
  ],
};

// Flat value -> label lookup for display (table column, view modal) regardless
// of which category a subCategory value belongs to.
const SUBCATEGORY_LABELS = Object.fromEntries(
  Object.values(TASK_CATALOG)
    .flat()
    .map((item) => [item.value, item.label])
);

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function TaskFormModal({ isAdmin, staffOptions, clientOptions, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    category: "other",
    subCategory: "custom",
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

  // "Main task" (category) — jumps to that category's first task and prefills
  // title/recurrence from it, same as picking it in the "Task" select below.
  function updateCategory(e) {
    const category = e.target.value;
    const first = TASK_CATALOG[category]?.[0];
    setForm((f) => ({
      ...f,
      category,
      subCategory: first?.value || "",
      title: first && first.value !== "custom" ? first.label : "",
      recurrence: first?.recurrence || f.recurrence,
    }));
  }

  // "Task" (subcategory) — prefills title/recurrence from the picked filing
  // type; picking "Custom Task" clears the title for free-form entry instead.
  function updateSubCategory(e) {
    const subCategory = e.target.value;
    const item = TASK_CATALOG[form.category]?.find((i) => i.value === subCategory);
    setForm((f) => ({
      ...f,
      subCategory,
      title: item && item.value !== "custom" ? item.label : "",
      recurrence: item?.recurrence || f.recurrence,
    }));
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
        <div className={TASK_CATALOG[form.category]?.length ? "grid grid-cols-2 gap-4" : ""}>
          <Select label="Main task" value={form.category} onChange={updateCategory}>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          {/* Only rendered when the selected main task actually has filing
              types under it — a category with nothing in TASK_CATALOG just
              leaves title/recurrence for manual entry below. */}
          {TASK_CATALOG[form.category]?.length > 0 && (
            <Select label="Task" value={form.subCategory} onChange={updateSubCategory}>
              {TASK_CATALOG[form.category].map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          )}
        </div>
        <Input label="Title" required value={form.title} onChange={update("title")} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Recurrence" value={form.recurrence} onChange={update("recurrence")}>
            {Object.entries(RECURRENCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Input label="Due date" type="date" required value={form.dueDate} onChange={update("dueDate")} />
        </div>
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
            <p className="text-text">
              {CATEGORY_LABELS[task.category]}
              {task.subCategory && SUBCATEGORY_LABELS[task.subCategory] ? ` — ${SUBCATEGORY_LABELS[task.subCategory]}` : ""}
            </p>
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
    subCategory: task.subCategory || TASK_CATALOG[task.category]?.[0]?.value || "",
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

  function updateCategory(e) {
    const category = e.target.value;
    setForm((f) => ({ ...f, category, subCategory: TASK_CATALOG[category]?.[0]?.value || "" }));
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
          <Select label="Category" value={form.category} onChange={updateCategory}>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select label="Subcategory" value={form.subCategory} onChange={update("subCategory")}>
            {(TASK_CATALOG[form.category] || []).map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Recurrence" value={form.recurrence} onChange={update("recurrence")}>
            {Object.entries(RECURRENCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select label="Status" value={form.status} onChange={update("status")}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Due date" type="date" required value={form.dueDate} onChange={update("dueDate")} />
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
  const canAdd = isAdmin || !!user?.permissions?.compliance?.add;
  const canEdit = isAdmin || !!user?.permissions?.compliance?.edit;
  const canDelete = isAdmin || !!user?.permissions?.compliance?.delete;

  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [clientOptions, setClientOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [clientFilter, setClientFilter] = useState("");
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(
    `${status}|${debouncedSearch}|${clientFilter}|${categoryFilters.join(",")}|${dateRange.startDate}|${dateRange.endDate}`
  );

  function toggleCategoryFilter(category) {
    setCategoryFilters((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  }
  const [modalOpen, setModalOpen] = useState(false);
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [statusTask, setStatusTask] = useState(null);
  const [documentsTask, setDocumentsTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState("list");
  const [refreshTick, setRefreshTick] = useState(0);

  async function loadTasks() {
    setLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (status) params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      if (clientFilter) params.clientId = clientFilter;
      if (categoryFilters.length > 0) params.category = categoryFilters.join(",");
      if (dateRange.startDate) params.dueFrom = dateRange.startDate;
      if (dateRange.endDate) params.dueTo = dateRange.endDate;
      const { data } = await complianceApi.listTasks(params);
      setTasks(data.data);
      setMeta(data.meta || { total: data.data.length, totalPages: 1 });
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
    // includeHidden: clients added directly via /firm-admin/clients must stay
    // selectable here even though their backing Lead is hidden from the CRM page.
    crmApi.listLeads({ limit: 100, status: "converted", includeHidden: true }).then(({ data }) => setClientOptions(data.data));
    if (isAdmin) {
      staffApi.listStaff().then(({ data }) => {
        setStaffOptions([{ id: user.id, name: `${user.name} (You)` }, ...data.data.map((s) => ({ id: s.id, name: s.name }))]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, debouncedSearch, clientFilter, categoryFilters, dateRange.startDate, dateRange.endDate]);

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
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <div>
          <p className="text-text">{CATEGORY_LABELS[row.category]}</p>
          {row.subCategory && SUBCATEGORY_LABELS[row.subCategory] && (
            <p className="text-xs text-text-muted">{SUBCATEGORY_LABELS[row.subCategory]}</p>
          )}
        </div>
      ),
    },
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
          {canEdit && (
            <Button variant="ghost" size="sm" title="Edit" onClick={() => setEditTask(row)}>
              <Pencil size={14} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(row)}>
              <Trash2 size={14} className="text-danger" />
            </Button>
          )}
          {!isAdmin && (
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
        {canAdd && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Add task
          </Button>
        )}
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

      {dashboard && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const Icon = CATEGORY_ICONS[key];
            const c = dashboard.byCategory?.[key] || EMPTY_CATEGORY_COUNTS;
            const active = categoryFilters.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  toggleCategoryFilter(key);
                  setView("list");
                }}
                className={`rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                  active ? "border-brand bg-brand-soft/30" : "border-border bg-surface hover:border-brand/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${CATEGORY_ICON_STYLES[key]}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-2xl font-bold text-heading">{c.total}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-heading">{label}</p>
                <div className="mt-2 flex items-center gap-2.5 text-xs">
                  <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400" title={STATUS_LABELS.pending}>
                    <Hourglass size={11} /> {c.pending}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-brand" title={STATUS_LABELS.in_progress}>
                    <ListChecks size={11} /> {c.in_progress}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-success" title={STATUS_LABELS.done}>
                    <CheckCircle2 size={11} /> {c.done}
                  </span>
                </div>
              </button>
            );
          })}
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

      <Card className="flex flex-col gap-4 p-4">
        <div className="flex gap-1 self-start rounded-xl bg-surface-2 p-1">
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
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-52">
                <Input label="Search" placeholder="Search by task title..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="w-full sm:w-44">
                <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-full sm:w-52">
                <Select label="Client" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                  <option value="">All clients</option>
                  {clientOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {c.company ? ` (${c.company})` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <DateRangeFilter
                preset={dateRange.preset}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={setDateRange}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-text-muted">Task:</span>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleCategoryFilter(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    categoryFilters.includes(v)
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  {l}
                </button>
              ))}
              {categoryFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCategoryFilters([])}
                  className="text-xs font-medium text-text-muted underline hover:text-text"
                >
                  Clear
                </button>
              )}
            </div>
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
          title="No compliance tasks found"
          description="Try adjusting your search or filters, or add a task for one of your clients."
          action={
            canAdd && (
              <Button onClick={() => setModalOpen(true)} size="sm">
                <Plus size={15} /> Add task
              </Button>
            )
          }
        />
      ) : (
        <Table
          columns={columns}
          data={tasks}
          keyField="_id"
          pagination={{ page, totalPages: meta.totalPages, total: meta.total, limit: PAGE_SIZE, onChange: setPage }}
        />
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
