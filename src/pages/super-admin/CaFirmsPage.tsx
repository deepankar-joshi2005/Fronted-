import { useEffect, useState } from "react";
import { Plus, Building2, Copy, Check, KeyRound, Eye, Pencil, Trash2, Ban, Power } from "lucide-react";
import * as caFirmApi from "../../api/caFirm.api.js";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Card from "../../components/ui/Card.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { sanitizePan, sanitizeGstin, sanitizePhone, validatePan, validateGstin, validatePhone, validateEmail } from "../../utils/validators.js";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  icaiRegistrationNumber: "",
  constitutionType: "",
  pan: "",
  gstin: "",
  planTier: "starter",
  billingCycle: "monthly",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  adminDesignation: "",
  adminMembershipNo: "",
};

const PLAN_BADGE = { trial: "brand", active: "success", suspended: "danger", expired: "neutral" };
const CONSTITUTION_LABELS = { proprietorship: "Proprietorship", partnership: "Partnership", llp: "LLP" };

function TempPasswordNotice({ title, description, email, name, tempPassword, onClose }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <p className="text-sm text-text-muted">
        {description} <strong className="text-text">{name}</strong> securely. They'll be asked to set a new
        password on first login.
      </p>
      <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface-2 p-4">
        <div>
          <p className="text-xs font-medium text-text-muted">Email</p>
          <p className="text-sm font-medium text-text">{email}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-text-muted">Temporary password</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-medium text-text">{tempPassword}</p>
            <button onClick={copy} className="text-text-muted hover:text-brand" aria-label="Copy password">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}

function FirmCreatedNotice({ result, onClose }) {
  if (result.admin.tempPassword) {
    return (
      <TempPasswordNotice
        title="CA firm created"
        description="Share these temporary credentials with"
        email={result.admin.email}
        name={result.admin.name}
        tempPassword={result.admin.tempPassword}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal open onClose={onClose} title="CA firm created">
      <p className="text-sm text-text-muted">
        <strong className="text-text">{result.admin.name}</strong> can log in right away at{" "}
        <strong className="text-text">{result.admin.email}</strong> with the password you set.
      </p>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}

function ResetAdminPasswordModal({ firm, onClose, onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await caFirmApi.resetFirmAdminPassword(firm._id, { newPassword });
      onDone(firm.name, data.data.tempPassword);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset admin password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reset admin password — ${firm.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="reset-admin-password-form" type="submit" loading={submitting}>
            Update password
          </Button>
        </>
      }
    >
      <form id="reset-admin-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <Input
          label="New password"
          type="text"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave blank to auto-generate a temporary password"
        />
        <p className="text-xs text-text-muted">
          The admin's old password stops working immediately once you confirm this change.
        </p>
      </form>
    </Modal>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="text-sm font-medium text-text">{value || "—"}</p>
    </div>
  );
}

function FirmDetailsModal({ firm, onClose }) {
  const addr = firm.address || {};
  const addressLine = [addr.line1, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(", ");

  return (
    <Modal open onClose={onClose} title={firm.name} size="lg">
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Overview</p>
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Slug" value={firm.slug} />
            <DetailItem label="Status" value={firm.isActive ? "Active" : "Suspended"} />
            <DetailItem label="Email" value={firm.email} />
            <DetailItem label="Phone" value={firm.phone} />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Registration &amp; Compliance
          </p>
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="ICAI registration no. (FRN)" value={firm.icaiRegistrationNumber} />
            <DetailItem label="Constitution type" value={CONSTITUTION_LABELS[firm.constitutionType]} />
            <DetailItem label="PAN" value={firm.pan} />
            <DetailItem label="GSTIN" value={firm.gstin} />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Plan</p>
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Tier" value={firm.plan?.tier} />
            <DetailItem label="Status" value={firm.plan?.status} />
            <DetailItem label="Billing cycle" value={firm.plan?.billingCycle} />
            <DetailItem
              label="Licence expiry"
              value={firm.plan?.expiryDate ? new Date(firm.plan.expiryDate).toLocaleDateString() : null}
            />
          </div>
        </div>

        {addressLine && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Address</p>
            <p className="text-sm text-text">{addressLine}</p>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}

const FIRM_SANITIZERS = {
  pan: sanitizePan,
  gstin: sanitizeGstin,
  phone: sanitizePhone,
};

const FIRM_VALIDATORS = {
  name: (v) => (v.trim() ? "" : "Firm name is required"),
  email: (v) => validateEmail(v, false),
  phone: (v) => validatePhone(v, false),
  pan: (v) => validatePan(v, false),
  gstin: (v) => validateGstin(v, false),
};

const CREATE_FIRM_VALIDATORS = {
  ...FIRM_VALIDATORS,
  constitutionType: (v) => (v ? "" : "Select the firm's constitution type"),
  adminName: (v) => (v.trim() ? "" : "Admin name is required"),
  adminDesignation: (v) => (v ? "" : "Select the admin's designation"),
  adminEmail: (v) => validateEmail(v, true),
};

function EditFirmModal({ firm, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: firm.name || "",
    email: firm.email || "",
    phone: firm.phone || "",
    icaiRegistrationNumber: firm.icaiRegistrationNumber || "",
    constitutionType: firm.constitutionType || "",
    pan: firm.pan || "",
    gstin: firm.gstin || "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => {
      const raw = e.target.value;
      const value = FIRM_SANITIZERS[field] ? FIRM_SANITIZERS[field](raw) : raw;
      setForm((f) => ({ ...f, [field]: value }));
      setFieldErrors((fe) => (field in fe ? { ...fe, [field]: FIRM_VALIDATORS[field] ? FIRM_VALIDATORS[field](value) : "" } : fe));
    };
  }

  function handleBlur(field) {
    return () => {
      if (!FIRM_VALIDATORS[field]) return;
      setFieldErrors((fe) => ({ ...fe, [field]: FIRM_VALIDATORS[field](form[field] || "") }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const errors = {};
    for (const field of Object.keys(FIRM_VALIDATORS)) {
      const msg = FIRM_VALIDATORS[field](form[field] || "");
      if (msg) errors[field] = msg;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      await caFirmApi.updateCaFirm(firm._id, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update CA firm");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${firm.name}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="edit-firm-form" type="submit" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-firm-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <Input
          label="Firm name"
          required
          value={form.name}
          onChange={update("name")}
          onBlur={handleBlur("name")}
          error={fieldErrors.name}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Firm email"
            type="email"
            value={form.email}
            onChange={update("email")}
            onBlur={handleBlur("email")}
            error={fieldErrors.email}
          />
          <Input
            label="Firm phone"
            value={form.phone}
            onChange={update("phone")}
            onBlur={handleBlur("phone")}
            error={fieldErrors.phone}
            placeholder="10-digit mobile number"
            inputMode="numeric"
            maxLength={10}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ICAI registration no. (FRN)"
            value={form.icaiRegistrationNumber}
            onChange={update("icaiRegistrationNumber")}
            placeholder="e.g. 123456C"
          />
          <Select label="Constitution type" value={form.constitutionType} onChange={update("constitutionType")}>
            <option value="">Select type</option>
            <option value="proprietorship">Proprietorship</option>
            <option value="partnership">Partnership</option>
            <option value="llp">LLP</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Firm PAN"
            value={form.pan}
            onChange={update("pan")}
            onBlur={handleBlur("pan")}
            error={fieldErrors.pan}
            placeholder="ABCDE1234F"
            maxLength={10}
          />
          <Input
            label="GSTIN"
            value={form.gstin}
            onChange={update("gstin")}
            onBlur={handleBlur("gstin")}
            error={fieldErrors.gstin}
            placeholder="22ABCDE1234F1Z5"
            maxLength={15}
          />
        </div>
      </form>
    </Modal>
  );
}

function DeleteFirmModal({ firm, onClose, onDeleted }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    setError("");
    setSubmitting(true);
    try {
      await caFirmApi.deleteCaFirm(firm._id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete CA firm");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete CA firm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={submitting}>
            Delete firm
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      <p className="text-sm text-text-muted">
        This permanently deletes <strong className="text-text">{firm.name}</strong> along with its admin, staff, and
        business client records. This cannot be undone.
      </p>
    </Modal>
  );
}

export default function CaFirmsPage() {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdResult, setCreatedResult] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetDoneFor, setResetDoneFor] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadFirms(searchTerm = search, tabValue = tab) {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (tabValue !== "all") params.tab = tabValue;
      const { data } = await caFirmApi.listCaFirms(params);
      setFirms(data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirms(search, tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function update(field) {
    return (e) => {
      const raw = e.target.value;
      const value = FIRM_SANITIZERS[field] ? FIRM_SANITIZERS[field](raw) : raw;
      setForm((f) => ({ ...f, [field]: value }));
      setFieldErrors((fe) => (field in fe ? { ...fe, [field]: CREATE_FIRM_VALIDATORS[field] ? CREATE_FIRM_VALIDATORS[field](value) : "" } : fe));
    };
  }

  function handleBlur(field) {
    return () => {
      if (!CREATE_FIRM_VALIDATORS[field]) return;
      setFieldErrors((fe) => ({ ...fe, [field]: CREATE_FIRM_VALIDATORS[field](form[field] || "") }));
    };
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    const errors = {};
    for (const field of Object.keys(CREATE_FIRM_VALIDATORS)) {
      const msg = CREATE_FIRM_VALIDATORS[field](form[field] || "");
      if (msg) errors[field] = msg;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.adminPassword) delete payload.adminPassword;
      const { data } = await caFirmApi.createCaFirm(payload);
      setModalOpen(false);
      setForm(INITIAL_FORM);
      setFieldErrors({});
      setCreatedResult(data.data);
      loadFirms();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create CA firm");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(firm) {
    await caFirmApi.updateCaFirm(firm._id, { isActive: !firm.isActive });
    loadFirms();
  }

  const columns = [
    {
      key: "name",
      label: "Firm",
      render: (row) => (
        <div className="max-w-55">
          <p className="truncate font-medium text-heading" title={row.name}>
            {row.name}
          </p>
          <p className="truncate text-xs text-text-muted" title={row.slug}>
            {row.slug}
          </p>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (row) => (
        <p className="max-w-50 truncate" title={row.email || ""}>
          {row.email || "—"}
        </p>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (row) => (
        <Badge variant={PLAN_BADGE[row.plan?.status] || "neutral"}>
          {row.plan?.tier} · {row.plan?.status}
        </Badge>
      ),
    },
    { key: "cycle", label: "Billing", render: (row) => (row.plan?.billingCycle === "annual" ? "Annual" : "Monthly") },
    {
      key: "isActive",
      label: "Status",
      render: (row) => <Badge variant={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Suspended"}</Badge>,
    },
    {
      key: "expiryDate",
      label: "Licence expiry",
      render: (row) => (row.plan?.expiryDate ? new Date(row.plan.expiryDate).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" title="View" onClick={() => setViewTarget(row)}>
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" title="Edit" onClick={() => setEditTarget(row)}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="sm" title="Reset admin password" onClick={() => setResetTarget(row)}>
            <KeyRound size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title={row.isActive ? "Suspend" : "Activate"}
            onClick={() => handleToggleActive(row)}
          >
            {row.isActive ? <Ban size={14} /> : <Power size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Delete"
            className="text-danger hover:bg-danger-bg"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">CA Management</h1>
          <p className="mt-1 text-sm text-text-muted">Every licensee CA firm on the platform and their admin.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Onboard new CA firm
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Firms" },
          { value: "active", label: "Active" },
          { value: "trial", label: "Trial" },
          { value: "expired", label: "Expired" },
          { value: "suspended", label: "Suspended" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? "bg-brand text-white" : "bg-surface-2 text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadFirms();
          }}
          className="max-w-sm"
        >
          <Input placeholder="Search CA firms..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : firms.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No CA firms yet"
          description="Onboard your first licensee CA firm to get started."
          action={
            <Button onClick={() => setModalOpen(true)} size="sm">
              <Plus size={15} /> Onboard new CA firm
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={firms} keyField="_id" />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Onboard a new CA firm"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button form="create-firm-form" type="submit" loading={submitting}>
              Create firm
            </Button>
          </>
        }
      >
        <form id="create-firm-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          <Input
            label="Firm name"
            required
            value={form.name}
            onChange={update("name")}
            onBlur={handleBlur("name")}
            error={fieldErrors.name}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Firm email"
              type="email"
              value={form.email}
              onChange={update("email")}
              onBlur={handleBlur("email")}
              error={fieldErrors.email}
            />
            <Input
              label="Firm phone"
              value={form.phone}
              onChange={update("phone")}
              onBlur={handleBlur("phone")}
              error={fieldErrors.phone}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              maxLength={10}
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Registration &amp; Compliance
            </p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ICAI registration no. (FRN)"
                  value={form.icaiRegistrationNumber}
                  onChange={update("icaiRegistrationNumber")}
                  placeholder="e.g. 123456C"
                />
                <Select
                  label="Constitution type"
                  required
                  value={form.constitutionType}
                  onChange={update("constitutionType")}
                  onBlur={handleBlur("constitutionType")}
                  error={fieldErrors.constitutionType}
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="proprietorship">Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="llp">LLP</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Firm PAN"
                  value={form.pan}
                  onChange={update("pan")}
                  onBlur={handleBlur("pan")}
                  error={fieldErrors.pan}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                <Input
                  label="GSTIN"
                  value={form.gstin}
                  onChange={update("gstin")}
                  onBlur={handleBlur("gstin")}
                  error={fieldErrors.gstin}
                  placeholder="22ABCDE1234F1Z5"
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Subscription</p>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Plan tier" value={form.planTier} onChange={update("planTier")}>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </Select>
              <Select label="Billing cycle" value={form.billingCycle} onChange={update("billingCycle")}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </Select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">CA Firm Admin</p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Admin name"
                  required
                  value={form.adminName}
                  onChange={update("adminName")}
                  onBlur={handleBlur("adminName")}
                  error={fieldErrors.adminName}
                />
                <Select
                  label="Designation"
                  required
                  value={form.adminDesignation}
                  onChange={update("adminDesignation")}
                  onBlur={handleBlur("adminDesignation")}
                  error={fieldErrors.adminDesignation}
                >
                  <option value="" disabled>
                    Select designation
                  </option>
                  <option value="proprietor">Proprietor</option>
                  <option value="partner">Partner</option>
                  <option value="director">Director</option>
                  <option value="authorized_signatory">Authorized Signatory</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Admin email"
                  type="email"
                  required
                  value={form.adminEmail}
                  onChange={update("adminEmail")}
                  onBlur={handleBlur("adminEmail")}
                  error={fieldErrors.adminEmail}
                />
                <Input
                  label="ICAI membership no."
                  value={form.adminMembershipNo}
                  onChange={update("adminMembershipNo")}
                  placeholder="e.g. 123456"
                  maxLength={7}
                />
              </div>
              <Input
                label="Admin password"
                type="text"
                minLength={8}
                value={form.adminPassword}
                onChange={update("adminPassword")}
                placeholder="Leave blank to auto-generate a temporary password"
              />
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Set a password above and the admin can log in with it immediately — or leave it blank and we'll
            generate a temporary one you'll see once after creation.
          </p>
        </form>
      </Modal>

      {createdResult && <FirmCreatedNotice result={createdResult} onClose={() => setCreatedResult(null)} />}

      {viewTarget && <FirmDetailsModal firm={viewTarget} onClose={() => setViewTarget(null)} />}

      {editTarget && (
        <EditFirmModal
          firm={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            loadFirms();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteFirmModal
          firm={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            loadFirms();
          }}
        />
      )}

      {resetTarget && (
        <ResetAdminPasswordModal
          firm={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={(firmName, tempPassword) => {
            setResetTarget(null);
            setResetDoneFor({ firmName, tempPassword });
          }}
        />
      )}

      {resetDoneFor && (
        <Modal open onClose={() => setResetDoneFor(null)} title="Password updated">
          {resetDoneFor.tempPassword ? (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                Share this temporary password with <strong className="text-text">{resetDoneFor.firmName}</strong>'s
                admin securely.
              </p>
              <div className="rounded-lg border border-border bg-surface-2 p-3 font-mono text-sm text-text">
                {resetDoneFor.tempPassword}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              <strong className="text-text">{resetDoneFor.firmName}</strong>'s admin password has been updated.
            </p>
          )}
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setResetDoneFor(null)}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
