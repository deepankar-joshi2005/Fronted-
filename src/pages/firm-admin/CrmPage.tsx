import { useEffect, useState } from "react";
import {
  Plus,
  Contact2,
  Trash2,
  Pencil,
  Phone,
  Mail,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  History,
  StickyNote,
  Check,
  XCircle,
  CalendarClock,
  AlertTriangle,
  Clock,
  Users,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import * as crmApi from "../../api/crm.api.js";
import * as staffApi from "../../api/staff.api.js";
import * as businessClientApi from "../../api/businessClient.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { ROLES } from "../../config/roles.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Textarea from "../../components/ui/Textarea.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { sanitizePhone, validatePhone, validateEmail } from "../../utils/validators.js";

// Pipeline stages shown in the stepper — "lost" is a dead end, shown separately.
const STATUS_ORDER = ["new", "contacted", "qualified", "converted"];
const STATUS_CONFIG = {
  new: { label: "New", badge: "neutral" },
  contacted: { label: "Contacted", badge: "brand" },
  qualified: { label: "Qualified", badge: "warning" },
  converted: { label: "Won", badge: "success" },
  lost: { label: "Lost", badge: "danger" },
};
const LEAD_TYPE_LABELS = {
  individual: "Individual",
  business: "Business",
  startup: "Startup",
  company: "Company",
  existing_client_referral: "Existing Client Referral",
};
const BUSINESS_TYPE_LABELS = {
  proprietorship: "Proprietorship",
  partnership: "Partnership",
  llp: "LLP",
  private_limited: "Private Limited",
  other: "Other",
};
const SERVICE_LABELS = {
  gst_registration: "GST Registration",
  gst_filing: "GST Filing",
  income_tax_return: "Income Tax Return",
  tax_consultation: "Tax Consultation",
  accounting_bookkeeping: "Accounting / Bookkeeping",
  roc_compliance: "ROC Compliance",
  audit: "Audit",
  tds: "TDS",
  financial_statements: "Financial Statements",
  loan_advisory: "Loan / Financial Advisory",
  other: "Other",
};
const SOURCE_LABELS = {
  website: "Website",
  phone_call: "Phone Call",
  whatsapp: "WhatsApp",
  email: "Email",
  referral: "Referral",
  social_media: "Social Media",
  advertisement: "Advertisement",
  walk_in: "Walk-in",
  other: "Other",
};
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", dot: "bg-success" },
  { value: "medium", label: "Medium", dot: "bg-warning" },
  { value: "high", label: "High", dot: "bg-danger" },
];
const FOLLOWUP_TYPE_LABELS = { call: "Call", email: "Email", whatsapp: "WhatsApp", meeting: "Meeting" };
const BUSINESS_LEAD_TYPES = ["business", "company"];

const INITIAL_FORM = {
  name: "",
  leadType: "",
  phone: "",
  email: "",
  alternatePhone: "",
  company: "",
  businessType: "",
  industry: "",
  city: "",
  interestedServices: [],
  source: "",
  assignedTo: "",
  estimatedValue: "",
  priority: "medium",
  expectedClosingDate: "",
  description: "",
};

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function combineDateTime(dateStr, timeStr) {
  if (!dateStr) return "";
  return timeStr ? `${dateStr}T${timeStr}` : dateStr;
}

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}

function PillGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
              active ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface text-text-muted hover:text-text"
            }`}
          >
            {opt.dot && <span className={`h-2 w-2 rounded-full ${opt.dot}`} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, badge: "neutral" };
  return <Badge variant={cfg.badge}>{cfg.label}</Badge>;
}

function PriorityDot({ priority }) {
  const cfg = PRIORITY_OPTIONS.find((p) => p.value === priority);
  if (!cfg) return <span className="text-sm text-text-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text">
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} /> {cfg.label}
    </span>
  );
}

// A visual stepper across the pipeline — done steps get a checkmark, the current
// step is highlighted, and "lost" (a dead end, not part of the main pipeline) is
// called out separately in red.
function LeadPipeline({ status }) {
  const isLost = status === "lost";
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="flex items-start">
      {STATUS_ORDER.map((s, i) => {
        const done = !isLost && i < currentIndex;
        const active = !isLost && i === currentIndex;
        return (
          <div key={s} className={`flex items-center ${i === STATUS_ORDER.length - 1 ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-success text-white"
                    : active
                      ? "bg-brand text-white ring-4 ring-brand/15"
                      : "border border-border bg-surface text-text-muted"
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span
                className={`w-20 text-center text-[11px] font-medium leading-tight ${
                  active ? "text-brand" : done ? "text-success" : "text-text-muted"
                }`}
              >
                {STATUS_CONFIG[s].label}
              </span>
            </div>
            {i < STATUS_ORDER.length - 1 && <div className={`mx-1 mt-4 h-0.5 flex-1 ${done ? "bg-success" : "bg-border"}`} />}
          </div>
        );
      })}
      {isLost && (
        <div className="ml-3 flex flex-col items-center gap-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger text-white">
            <XCircle size={14} />
          </span>
          <span className="w-20 text-center text-[11px] font-medium leading-tight text-danger">Lost</span>
        </div>
      )}
    </div>
  );
}

function ServiceCheckboxes({ value, onChange }) {
  function toggle(service) {
    onChange(value.includes(service) ? value.filter((s) => s !== service) : [...value, service]);
  }
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {Object.entries(SERVICE_LABELS).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => toggle(key)}
          className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
            value.includes(key) ? "border-brand bg-brand-soft text-brand" : "border-border text-text-muted hover:text-text"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Add / Edit Lead ─────────────────────────────────────────────────────────

const CRM_SANITIZERS = {
  phone: sanitizePhone,
  alternatePhone: sanitizePhone,
};

function LeadFormModal({ open, onClose, editingLead, isAdmin, staffOptions, onSaved }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isBusinessType = BUSINESS_LEAD_TYPES.includes(form.leadType);

  const VALIDATORS = {
    name: (v) => (v.trim() ? "" : "Lead name is required"),
    leadType: (v) => (v ? "" : "Select a lead type"),
    phone: (v) => validatePhone(v, true),
    alternatePhone: (v) => validatePhone(v, false),
    email: (v) => validateEmail(v, false),
    company: (v) => (isBusinessType && !v.trim() ? "Business / company name is required" : ""),
    source: (v) => (v ? "" : "Select a lead source"),
  };

  useEffect(() => {
    if (!open) return;
    setError("");
    setFieldErrors({});
    if (editingLead) {
      setForm({
        name: editingLead.name || "",
        leadType: editingLead.leadType || "",
        phone: editingLead.phone || "",
        email: editingLead.email || "",
        alternatePhone: editingLead.alternatePhone || "",
        company: editingLead.company || "",
        businessType: editingLead.businessType || "",
        industry: editingLead.industry || "",
        city: editingLead.city || "",
        interestedServices: editingLead.interestedServices || [],
        source: editingLead.source || "",
        assignedTo: editingLead.assignedTo?._id || editingLead.assignedTo || "",
        estimatedValue: editingLead.estimatedValue ?? "",
        priority: editingLead.priority || "medium",
        expectedClosingDate: editingLead.expectedClosingDate ? editingLead.expectedClosingDate.slice(0, 10) : "",
        description: editingLead.description || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [open, editingLead]);

  function update(field) {
    return (e) => {
      const raw = e.target.value;
      const value = CRM_SANITIZERS[field] ? CRM_SANITIZERS[field](raw) : raw;
      setForm((f) => ({ ...f, [field]: value }));
      setFieldErrors((fe) => (field in fe ? { ...fe, [field]: VALIDATORS[field] ? VALIDATORS[field](value) : "" } : fe));
    };
  }

  function handleBlur(field) {
    return () => {
      if (!VALIDATORS[field]) return;
      setFieldErrors((fe) => ({ ...fe, [field]: VALIDATORS[field](form[field] || "") }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errors = {};
    for (const field of Object.keys(VALIDATORS)) {
      const msg = VALIDATORS[field](form[field] || "");
      if (msg) errors[field] = msg;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return;
    }
    if (form.interestedServices.length === 0) {
      setError("Select at least one service");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.estimatedValue) delete payload.estimatedValue;
      if (!payload.expectedClosingDate) delete payload.expectedClosingDate;
      if (editingLead) {
        await crmApi.updateLead(editingLead._id, payload);
      } else {
        await crmApi.createLead(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this lead");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingLead ? "Edit Lead" : "Add New Lead"}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="lead-form" type="submit" loading={submitting}>
            {editingLead ? "Save changes" : "Add Lead"}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Lead / Person Details</p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Lead name"
                required
                value={form.name}
                onChange={update("name")}
                onBlur={handleBlur("name")}
                error={fieldErrors.name}
              />
              <Select
                label="Lead type"
                required
                value={form.leadType}
                onChange={update("leadType")}
                onBlur={handleBlur("leadType")}
                error={fieldErrors.leadType}
              >
                <option value="" disabled>
                  Select type
                </option>
                {Object.entries(LEAD_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Mobile number"
                required
                value={form.phone}
                onChange={update("phone")}
                onBlur={handleBlur("phone")}
                error={fieldErrors.phone}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
              />
              <Input
                label="Alternate mobile"
                value={form.alternatePhone}
                onChange={update("alternatePhone")}
                onBlur={handleBlur("alternatePhone")}
                error={fieldErrors.alternatePhone}
                inputMode="numeric"
                maxLength={10}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={update("email")}
              onBlur={handleBlur("email")}
              error={fieldErrors.email}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Business Details</p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Business / company name"
                required={isBusinessType}
                value={form.company}
                onChange={update("company")}
                onBlur={handleBlur("company")}
                error={fieldErrors.company}
              />
              <Select label="Business type" value={form.businessType} onChange={update("businessType")}>
                <option value="">Select type</option>
                {Object.entries(BUSINESS_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Industry" value={form.industry} onChange={update("industry")} />
              <Input label="City" value={form.city} onChange={update("city")} />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Field label="Services required" required>
            <ServiceCheckboxes value={form.interestedServices} onChange={(v) => setForm((f) => ({ ...f, interestedServices: v }))} />
          </Field>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Source &amp; Assignment</p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Lead source"
                required
                value={form.source}
                onChange={update("source")}
                onBlur={handleBlur("source")}
                error={fieldErrors.source}
              >
                <option value="" disabled>
                  Select source
                </option>
                {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Priority">
                <PillGroup options={PRIORITY_OPTIONS} value={form.priority} onChange={(v) => setForm((f) => ({ ...f, priority: v }))} />
              </Field>
              <Input label="Estimated value (₹)" type="number" value={form.estimatedValue} onChange={update("estimatedValue")} />
            </div>
            <Input label="Expected closing date" type="date" value={form.expectedClosingDate} onChange={update("expectedClosingDate")} />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Textarea
            label="Additional notes"
            rows={3}
            value={form.description}
            onChange={update("description")}
            placeholder="Any background context about this lead..."
          />
        </div>
      </form>
    </Modal>
  );
}

// ── Change stage / disqualify / follow-up / notes / history ────────────────

function ChangeStageModal({ open, onClose, currentStatus, onSubmit }) {
  const [selected, setSelected] = useState(currentStatus);

  useEffect(() => {
    if (open) setSelected(currentStatus === "lost" ? "new" : currentStatus);
  }, [open, currentStatus]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change Stage"
      footer={
        <Button
          onClick={() => {
            onSubmit(selected);
            onClose();
          }}
        >
          Submit
        </Button>
      }
    >
      <div className="flex flex-col gap-0.5">
        {STATUS_ORDER.map((s) => (
          <label key={s} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2">
            <input type="radio" name="stage" checked={selected === s} onChange={() => setSelected(s)} className="h-4 w-4 accent-brand" />
            <span className="text-sm font-medium text-text">{STATUS_CONFIG[s].label}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}

function DisqualifyModal({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark Lead Lost"
      footer={
        <Button
          variant="danger"
          onClick={() => {
            onSubmit(reason);
            onClose();
          }}
        >
          Mark as Lost
        </Button>
      }
    >
      <Textarea
        label="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Budget mismatch, went with another CA, not responding..."
      />
    </Modal>
  );
}

function ScheduleFollowUpModal({ open, onClose, lead, onScheduled }) {
  const [form, setForm] = useState({ type: "call", date: "", time: "", note: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        type: lead?.followUpType || "call",
        date: lead?.followUpDate ? lead.followUpDate.slice(0, 10) : "",
        time: "",
        note: lead?.followUpNote || "",
      });
      setError("");
    }
  }, [open, lead]);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await crmApi.updateLead(lead._id, {
        followUpDate: combineDateTime(form.date, form.time),
        followUpType: form.type,
        followUpNote: form.note,
      });
      onScheduled();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not schedule this follow-up");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Follow-up"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="followup-form" type="submit" loading={submitting}>
            Schedule Follow-up
          </Button>
        </>
      }
    >
      <form id="followup-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <Select label="Type" value={form.type} onChange={update("type")}>
          {Object.entries(FOLLOWUP_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" required value={form.date} onChange={update("date")} />
          <Input label="Time" type="time" required value={form.time} onChange={update("time")} />
        </div>
        <Textarea label="Note (optional)" value={form.note} onChange={update("note")} placeholder="e.g. Explain GST filing package" />
      </form>
    </Modal>
  );
}

function NotesModal({ open, onClose, lead, onNoteAdded }) {
  const [notes, setNotes] = useState(lead?.notes || []);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes(lead?.notes || []);
      setNote("");
      setError("");
    }
  }, [open, lead]);

  async function handleAdd() {
    if (!note.trim()) return;
    setAdding(true);
    setError("");
    try {
      const { data } = await crmApi.addLeadNote(lead._id, { text: note.trim() });
      setNotes(data.data.notes);
      setNote("");
      onNoteAdded();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add note");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Notes & Activity">
      {error && <div className="mb-3 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
      <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
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
        <Button type="button" onClick={handleAdd} loading={adding}>
          Add
        </Button>
      </div>
    </Modal>
  );
}

function LeadHistoryModal({ open, onClose, lead }) {
  return (
    <Modal open={open} onClose={onClose} title="Lead History">
      <ol className="flex flex-col gap-3 border-l-2 border-border pl-4">
        {[...(lead?.statusHistory || [])].reverse().map((h, i) => (
          <li key={i} className="relative">
            <span className="absolute -left-5.25 top-1 h-2.5 w-2.5 rounded-full bg-brand" />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={h.status} />
              <span className="text-xs text-text-muted">{new Date(h.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-0.5 text-xs text-text-muted">
              by {h.changedByName || "System"}
              {h.note ? ` — ${h.note}` : ""}
            </p>
          </li>
        ))}
      </ol>
    </Modal>
  );
}

function DeleteLeadModal({ open, onClose, lead, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await crmApi.deleteLead(lead._id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete this lead");
      setDeleting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete lead"
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
        Delete lead <strong className="text-text">{lead?.name}</strong>? This cannot be undone.
      </p>
    </Modal>
  );
}

// ── Provision to HRMS ───────────────────────────────────────────────────────

function ProvisionModal({ lead, onClose, onDone }) {
  const [form, setForm] = useState({ adminName: lead.name, adminEmail: lead.email || "", adminPassword: "" });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleEmailBlur() {
    setEmailError(validateEmail(form.adminEmail, true));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const emailMsg = validateEmail(form.adminEmail, true);
    if (emailMsg) {
      setEmailError(emailMsg);
      setError("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, name: lead.name, email: lead.email, phone: lead.phone, leadId: lead._id };
      if (!payload.adminPassword) delete payload.adminPassword;
      await businessClientApi.createBusinessClient(payload);
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || "Could not provision HRMS access");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Provision HRMS — ${lead.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="provision-form" type="submit" loading={submitting}>
            Provision HRMS
          </Button>
        </>
      }
    >
      <form id="provision-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}
        <p className="text-sm text-text-muted">
          This gives <strong className="text-text">{lead.name}</strong> its own HRMS workspace (employees, attendance,
          payroll) with an admin login. Client details are carried over from this record.
        </p>
        <Input label="Admin name" required value={form.adminName} onChange={update("adminName")} />
        <Input
          label="Admin email"
          type="email"
          required
          value={form.adminEmail}
          onChange={update("adminEmail")}
          onBlur={handleEmailBlur}
          error={emailError}
        />
        <Input
          label="Admin password"
          type="text"
          minLength={8}
          value={form.adminPassword}
          onChange={update("adminPassword")}
          placeholder="Leave blank to auto-generate and email a temporary password"
        />
      </form>
    </Modal>
  );
}

// ── Client card (converted leads) ───────────────────────────────────────────

function ClientCard({ lead, isAdmin, onEdit, onDelete, onProvision, onChanged }) {
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  return (
    <Card className="relative flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-heading">{lead.name}</p>
          {lead.company && <span className="text-sm text-text-muted">({lead.company})</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Phone size={12} /> {lead.phone}
          </span>
          {lead.email && (
            <span className="flex items-center gap-1.5">
              <Mail size={12} /> {lead.email}
            </span>
          )}
          <span>Assigned: {lead.assignedTo?.name || "Unassigned"}</span>
        </div>
        {lead.interestedServices?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {lead.interestedServices.map((s) => (
              <Badge key={s} variant="neutral">
                {SERVICE_LABELS[s]}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setNotesModalOpen(true)}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <StickyNote size={12} /> Notes ({lead.notes?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setHistoryModalOpen(true)}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <History size={12} /> History
        </button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(lead)} aria-label="Edit client">
          <Pencil size={14} />
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(lead)} aria-label="Delete client">
            <Trash2 size={14} className="text-danger" />
          </Button>
        )}
        {lead.businessClientId ? (
          <Badge variant="success">
            <ShieldCheck size={12} className="mr-1 inline" /> HRMS active
          </Badge>
        ) : (
          isAdmin && (
            <Button size="sm" onClick={() => onProvision(lead)}>
              <ExternalLink size={14} /> Provision to HRMS
            </Button>
          )
        )}
      </div>

      <NotesModal open={notesModalOpen} onClose={() => setNotesModalOpen(false)} lead={lead} onNoteAdded={onChanged} />
      <LeadHistoryModal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)} lead={lead} />
    </Card>
  );
}

// ── Lead card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, isAdmin, onEdit, onDelete, onChanged }) {
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [disqualifyModalOpen, setDisqualifyModalOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const isLost = lead.status === "lost";
  const isProgressed = lead.status !== "new" && !isLost;
  const overdueFollowUp = lead.followUpDate && new Date(lead.followUpDate) < new Date() && !["converted", "lost"].includes(lead.status);

  async function handleStatusChange(status) {
    await crmApi.updateLead(lead._id, { status });
    onChanged();
  }

  async function handleDisqualify(reason) {
    await crmApi.updateLead(lead._id, { status: "lost", statusNote: reason || undefined });
    onChanged();
  }

  return (
    <Card className="relative p-4">
      <div className="absolute right-4 top-4 flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(lead)} aria-label="Edit lead">
          <Pencil size={14} />
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(lead)} aria-label="Delete lead">
            <Trash2 size={14} className="text-danger" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-xs text-text-muted">Lead type</p>
              <Badge variant="neutral">{LEAD_TYPE_LABELS[lead.leadType]}</Badge>
            </div>
            <div>
              <p className="text-xs text-text-muted">Lead date</p>
              <p className="text-sm font-medium text-text">{new Date(lead.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Priority</p>
              <PriorityDot priority={lead.priority} />
            </div>
            <div>
              <p className="text-xs text-text-muted">Assigned to</p>
              <p className="text-sm font-medium text-text">{lead.assignedTo?.name || "Unassigned"}</p>
            </div>
            {lead.estimatedValue ? (
              <div>
                <p className="text-xs text-text-muted">Estimated value</p>
                <p className="text-sm font-semibold text-text">₹{Number(lead.estimatedValue).toLocaleString("en-IN")}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStageModalOpen(true)}
              aria-label="Advance lead stage"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                isProgressed ? "border-success bg-success/10 text-success" : "border-border text-text-muted hover:bg-surface-2"
              }`}
            >
              <ThumbsUp size={15} />
            </button>
            <button
              type="button"
              onClick={() => setDisqualifyModalOpen(true)}
              aria-label="Mark lead lost"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                isLost ? "border-danger bg-danger/10 text-danger" : "border-border text-text-muted hover:bg-surface-2"
              }`}
            >
              <ThumbsDown size={15} />
            </button>
            <button
              type="button"
              onClick={() => setNotesModalOpen(true)}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <StickyNote size={12} /> Notes ({lead.notes?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setHistoryModalOpen(true)}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <History size={12} /> History
            </button>
            {isLost && <span className="text-xs font-semibold text-danger">Lead Lost</span>}
          </div>

          <div>
            <p className="text-base font-bold text-heading">{lead.name}</p>
            {lead.company && <p className="text-xs text-text-muted">{lead.company}</p>}
            {lead.interestedServices?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {lead.interestedServices.map((s) => (
                  <Badge key={s} variant="neutral">
                    {SERVICE_LABELS[s]}
                  </Badge>
                ))}
              </div>
            )}
            {lead.description && <p className="mt-1.5 line-clamp-2 text-xs text-text-muted">{lead.description}</p>}
          </div>
        </div>

        <div className="w-full shrink-0 border-t border-border pt-3 lg:w-56 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <p className="text-xs text-text-muted">Contact</p>
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Phone size={12} /> {lead.phone}
            </span>
            {lead.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={12} /> {lead.email}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <a
              href={`tel:${lead.phone}`}
              className="rounded-md border border-border p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
              aria-label="Call"
            >
              <Phone size={13} />
            </a>
            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
              aria-label="WhatsApp"
            >
              <MessageCircle size={13} />
            </a>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="rounded-md border border-border p-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
                aria-label="Email"
              >
                <Mail size={13} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <LeadPipeline status={lead.status} />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-t border-border pt-3">
        <div>
          <p className="text-xs text-text-muted">Next follow-up</p>
          <p className={`text-sm font-medium ${overdueFollowUp ? "text-danger" : "text-text"}`}>
            {lead.followUpDate
              ? new Date(lead.followUpDate).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
              : "—"}
            {lead.followUpType ? ` · ${FOLLOWUP_TYPE_LABELS[lead.followUpType]}` : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Source</p>
          <p className="text-sm font-medium text-text">{SOURCE_LABELS[lead.source]}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Stage</p>
          <StatusBadge status={lead.status} />
        </div>
        <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setFollowUpModalOpen(true)}>
          <CalendarClock size={13} /> Schedule Follow-up
        </Button>
      </div>

      <ChangeStageModal
        open={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        currentStatus={lead.status}
        onSubmit={handleStatusChange}
      />
      <DisqualifyModal open={disqualifyModalOpen} onClose={() => setDisqualifyModalOpen(false)} onSubmit={handleDisqualify} />
      <ScheduleFollowUpModal
        open={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        lead={lead}
        onScheduled={onChanged}
      />
      <NotesModal open={notesModalOpen} onClose={() => setNotesModalOpen(false)} lead={lead} onNoteAdded={onChanged} />
      <LeadHistoryModal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)} lead={lead} />
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

// Converted leads live in the "Clients" tab instead — Pipeline's own status
// filter only ever offers the in-progress/dead-end stages.
const PIPELINE_STATUSES = ["new", "contacted", "qualified", "lost"];

export default function CrmPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.CA_FIRM_ADMIN;

  const [tab, setTab] = useState("pipeline");

  const [dashboard, setDashboard] = useState(null);
  const [leads, setLeads] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState("");
  const [provisionTarget, setProvisionTarget] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadLeads(searchTerm = search, statusValue = status) {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusValue) params.status = statusValue;
      else params.excludeConverted = true;
      const { data } = await crmApi.listLeads(params);
      setLeads(data.data);
    } finally {
      setLoading(false);
    }
  }

  async function loadClients(searchTerm = clientSearch) {
    setClientsLoading(true);
    try {
      const params = { status: "converted", limit: 100 };
      if (searchTerm) params.search = searchTerm;
      const { data } = await crmApi.listLeads(params);
      setClients(data.data);
    } finally {
      setClientsLoading(false);
    }
  }

  async function loadDashboard() {
    const { data } = await crmApi.getCrmDashboard();
    setDashboard(data.data);
  }

  useEffect(() => {
    loadDashboard();
    loadClients();
    if (isAdmin) {
      staffApi.listStaff().then(({ data }) => {
        setStaffOptions([{ id: user.id, name: `${user.name} (You)` }, ...data.data.map((s) => ({ id: s.id, name: s.name }))]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLeads(search, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function refreshAll() {
    loadLeads();
    loadClients();
    loadDashboard();
  }

  function openCreate() {
    setEditingLead(null);
    setFormOpen(true);
  }
  function openEdit(lead) {
    setEditingLead(lead);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">CRM</h1>
          <p className="mt-1 text-sm text-text-muted">Track every lead from first contact to won or lost.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Add Lead
        </Button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs text-text-muted">Total Leads</p>
            <p className="mt-1 text-2xl font-bold text-heading">{dashboard.total}</p>
          </Card>
          {STATUS_ORDER.map((s) => (
            <Card key={s} className="p-4">
              <p className="truncate text-xs text-text-muted">{STATUS_CONFIG[s].label}</p>
              <p className="mt-1 text-2xl font-bold text-heading">{dashboard.pipeline[s] || 0}</p>
            </Card>
          ))}
        </div>
      )}

      {dashboard && (dashboard.dueForFollowUp > 0 || dashboard.overdueFollowUp > 0) && (
        <div className="flex flex-wrap gap-3">
          {dashboard.overdueFollowUp > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2 text-sm text-danger">
              <AlertTriangle size={15} /> {dashboard.overdueFollowUp} follow-up{dashboard.overdueFollowUp > 1 ? "s" : ""} overdue
            </div>
          )}
          {dashboard.dueForFollowUp > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2 text-sm text-brand">
              <Clock size={15} /> {dashboard.dueForFollowUp} follow-up{dashboard.dueForFollowUp > 1 ? "s" : ""} due in the next 3 days
            </div>
          )}
        </div>
      )}

      <div className="flex gap-1 self-start rounded-xl bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setTab("pipeline")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            tab === "pipeline" ? "bg-surface text-heading shadow-sm" : "text-text-muted hover:text-text"
          }`}
        >
          <Contact2 size={14} /> Pipeline
        </button>
        <button
          type="button"
          onClick={() => setTab("clients")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            tab === "clients" ? "bg-surface text-heading shadow-sm" : "text-text-muted hover:text-text"
          }`}
        >
          <Users size={14} /> Clients ({clients.length})
        </button>
      </div>

      {tab === "pipeline" ? (
        <>
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadLeads();
                }}
                className="min-w-50 flex-1"
              >
                <Input placeholder="Search by name, phone or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </form>
              <div className="sm:w-48">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  {PIPELINE_STATUSES.map((v) => (
                    <option key={v} value={v}>
                      {STATUS_CONFIG[v].label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {loading ? (
            <Card className="flex justify-center py-16">
              <Spinner size={28} />
            </Card>
          ) : leads.length === 0 ? (
            <Card className="p-6">
              <EmptyState icon={Contact2} title="No leads yet" description="Add your first lead to start tracking your pipeline." />
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {leads.map((lead) => (
                <LeadCard key={lead._id} lead={lead} isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleteTarget} onChanged={refreshAll} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadClients();
              }}
              className="min-w-50"
            >
              <Input placeholder="Search clients by name, phone or email..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
            </form>
          </Card>

          {clientsLoading ? (
            <Card className="flex justify-center py-16">
              <Spinner size={28} />
            </Card>
          ) : clients.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={Users}
                title="No clients yet"
                description="Mark a lead as Won in the Pipeline tab and it'll show up here."
              />
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {clients.map((lead) => (
                <ClientCard
                  key={lead._id}
                  lead={lead}
                  isAdmin={isAdmin}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onProvision={setProvisionTarget}
                  onChanged={refreshAll}
                />
              ))}
            </div>
          )}
        </>
      )}

      {provisionTarget && (
        <ProvisionModal
          lead={provisionTarget}
          onClose={() => setProvisionTarget(null)}
          onDone={() => {
            setProvisionTarget(null);
            refreshAll();
          }}
        />
      )}

      <LeadFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingLead={editingLead}
        isAdmin={isAdmin}
        staffOptions={staffOptions}
        onSaved={() => {
          setFormOpen(false);
          refreshAll();
        }}
      />

      {deleteTarget && (
        <DeleteLeadModal
          open
          onClose={() => setDeleteTarget(null)}
          lead={deleteTarget}
          onDeleted={() => {
            setDeleteTarget(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
