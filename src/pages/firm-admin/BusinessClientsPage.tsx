import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Briefcase, Copy, Check, KeyRound, Ban, Power, Eye, Pencil, Trash2, Wallet, ArrowUpCircle } from "lucide-react";
import * as businessClientApi from "../../api/businessClient.api.js";
import * as hrmsPlanTierApi from "../../api/hrmsPlanTier.api.js";
import { useAuth } from "../../hooks/useAuth";
import { HRMS_BASE_PATH } from "../../utils/hrmsSso.js";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Card from "../../components/ui/Card.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import SegmentedTabs from "../../components/ui/SegmentedTabs.jsx";
import ViewClientModal from "../../components/business-clients/ViewClientModal.jsx";
import { sanitizePan, sanitizeGstin, sanitizePhone, sanitizePincode, validatePan, validateGstin, validatePhone, validatePincode, validateEmail } from "../../utils/validators.js";

const CLIENT_TYPE_LABELS = {
  individual: "Individual",
  proprietorship: "Proprietorship",
  partnership: "Partnership",
  llp: "LLP",
  company: "Company",
  other: "Other",
};
const SERVICE_LABELS = {
  gst: "GST",
  income_tax: "Income Tax",
  tds: "TDS",
  accounting: "Accounting",
  roc_compliance: "ROC Compliance",
  audit: "Audit",
  payroll: "Payroll",
  other: "Other",
};
const INDUSTRY_OPTIONS = [
  "Retail / Trading",
  "Manufacturing",
  "IT / Software Services",
  "Healthcare",
  "Real Estate / Construction",
  "Education",
  "Hospitality / Restaurant",
  "Transportation / Logistics",
  "Finance / Insurance",
  "Agriculture",
  "E-commerce",
  "Professional Services (Legal, Consulting, etc.)",
  "Textile / Garments",
  "Pharmaceuticals",
  "Automobile",
  "Media / Entertainment",
  "Other",
];

const INITIAL_FORM = {
  name: "",
  clientName: "",
  clientType: "",
  pan: "",
  gstin: "",
  industry: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  services: [],
  useHrms: true,
  adminPassword: "",
  planTierId: "",
};

function Field({ label, required = false, hint = null, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
      {children}
    </div>
  );
}

function ServiceCheckboxes({ value, onChange }) {
  function toggle(service) {
    onChange(value.includes(service) ? value.filter((s) => s !== service) : [...value, service]);
  }
  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 && <p className="text-xs text-text-muted">Please click to select service(s)</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
    </div>
  );
}

function TempPasswordNotice({ title, email, name, tempPassword, hint, onClose }: { title: string; email: string; name: string; tempPassword: string; hint?: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <p className="text-sm text-text-muted">
        Share these temporary credentials with <strong className="text-text">{name}</strong> securely.
        {hint && <> {hint}</>}
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

function ResetAdminPasswordModal({ client, onClose, onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await businessClientApi.resetBusinessClientAdminPassword(client._id, { newPassword });
      onDone(data.data.tempPassword);
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
      title={`Reset HRMS admin password — ${client.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="reset-client-admin-password-form" type="submit" loading={submitting}>
            Update password
          </Button>
        </>
      }
    >
      <form id="reset-client-admin-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      </form>
    </Modal>
  );
}

// ── Add / Edit Business Client ──────────────────────────────────────────────

const SANITIZERS = {
  pan: sanitizePan,
  gstin: sanitizeGstin,
  phone: sanitizePhone,
  pincode: sanitizePincode,
};

// HRMS plan tiers barely ever change — cache them for the page session so
// reopening "Add Client" doesn't refetch every single time.
let planTiersCache: any[] | null = null;
let planTiersPromise: Promise<any[]> | null = null;
function loadPlanTiers(): Promise<any[]> {
  if (planTiersCache) return Promise.resolve(planTiersCache);
  if (!planTiersPromise) {
    planTiersPromise = hrmsPlanTierApi.listHrmsPlanTiers().then(({ data }) => {
      planTiersCache = data.data;
      return planTiersCache;
    });
  }
  return planTiersPromise;
}

function ClientFormModal({ open, onClose, editingClient, onSaved }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [planTiers, setPlanTiers] = useState([]);

  const VALIDATORS = {
    name: (v) => (v.trim() ? "" : "Business name is required"),
    clientType: (v) => (v ? "" : "Select a client type"),
    pan: (v) => validatePan(v, false),
    gstin: (v) => validateGstin(v, false),
    contactPerson: (v) => (v.trim() ? "" : "Contact person name is required"),
    phone: (v) => validatePhone(v, true),
    email: (v) => validateEmail(v, !editingClient),
    pincode: (v) => validatePincode(v, false),
  };

  useEffect(() => {
    if (!open) return;
    loadPlanTiers().then(setPlanTiers);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setFieldErrors({});
    if (editingClient) {
      setForm({
        name: editingClient.name || "",
        clientName: editingClient.clientName || "",
        clientType: editingClient.clientType || "",
        pan: editingClient.pan || "",
        gstin: editingClient.gstin || "",
        industry: editingClient.industry || "",
        contactPerson: editingClient.contactPerson || "",
        phone: editingClient.phone || "",
        email: editingClient.email || "",
        address: editingClient.address || "",
        city: editingClient.city || "",
        state: editingClient.state || "",
        pincode: editingClient.pincode || "",
        services: editingClient.services || [],
        useHrms: editingClient.useHrms !== false,
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [open, editingClient]);

  function update(field) {
    return (e) => {
      const raw = e.target.value;
      const value = SANITIZERS[field] ? SANITIZERS[field](raw) : raw;
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
    if (form.services.length === 0) {
      setError("Select at least one service");
      return;
    }
    setSubmitting(true);
    try {
      if (editingClient) {
        const { services, useHrms, adminPassword, ...rest } = form;
        await businessClientApi.updateBusinessClient(editingClient._id, { ...rest, services });
        onSaved(null);
      } else {
        const { data } = await businessClientApi.createBusinessClient(form);
        onSaved(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not save this business client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingClient ? "Edit Business Client" : "Add Business Client"}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="client-form" type="submit" loading={submitting}>
            {editingClient ? "Save changes" : "Add Client"}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>
        )}

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Business Information</p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Business Name"
                required
                value={form.name}
                onChange={update("name")}
                onBlur={handleBlur("name")}
                error={fieldErrors.name}
              />
              <Input label="Client Name" value={form.clientName} onChange={update("clientName")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Client Type"
                required
                value={form.clientType}
                onChange={update("clientType")}
                onBlur={handleBlur("clientType")}
                error={fieldErrors.clientType}
              >
                <option value="" disabled>
                  Select type
                </option>
                {Object.entries(CLIENT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
              <Select label="Industry / Business Category" value={form.industry} onChange={update("industry")}>
                <option value="">Select industry</option>
                {INDUSTRY_OPTIONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="PAN"
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Primary Contact</p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Person Name"
                required
                value={form.contactPerson}
                onChange={update("contactPerson")}
                onBlur={handleBlur("contactPerson")}
                error={fieldErrors.contactPerson}
              />
              <Input
                label="Mobile Number"
                required
                value={form.phone}
                onChange={update("phone")}
                onBlur={handleBlur("phone")}
                error={fieldErrors.phone}
                placeholder="10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
              />
            </div>
            <Input
              label="Email"
              required={!editingClient}
              type="email"
              value={form.email}
              onChange={update("email")}
              onBlur={handleBlur("email")}
              error={fieldErrors.email}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Address</p>
          <div className="flex flex-col gap-4">
            <Input label="Address" value={form.address} onChange={update("address")} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" value={form.city} onChange={update("city")} />
              <Input label="State" value={form.state} onChange={update("state")} />
              <Input
                label="Pincode"
                value={form.pincode}
                onChange={update("pincode")}
                onBlur={handleBlur("pincode")}
                error={fieldErrors.pincode}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Field label="Services" required>
            <ServiceCheckboxes value={form.services} onChange={(v) => setForm((f) => ({ ...f, services: v }))} />
          </Field>
        </div>

        {!editingClient ? (
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Client Portal</p>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
              <input
                type="checkbox"
                checked={form.useHrms}
                onChange={(e) => setForm((f) => ({ ...f, useHrms: e.target.checked }))}
                className="mt-0.5 h-4 w-4 accent-brand"
              />
              <span>
                <span className="block text-sm font-medium text-text">Use HRMS</span>
                <span className="block text-xs text-text-muted">
                  This client always gets its own login using the Primary Contact details above. Tick this to also
                  provision a full HRMS workspace for them — leave it unticked and they land on a simpler dashboard
                  to manage their own employees instead.
                </span>
              </span>
            </label>
            <div className="mt-3 flex flex-col gap-3">
              <Input
                label={form.useHrms ? "HRMS admin password" : "Login password"}
                type="text"
                minLength={8}
                value={form.adminPassword}
                onChange={update("adminPassword")}
                placeholder="Leave blank to auto-generate and email a temporary password"
              />
              {form.useHrms && (
                <Field label="HRMS plan" hint="Optional — leave unselected and the client will be asked to subscribe after they log in.">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {planTiers.map((tier) => (
                      <button
                        key={tier._id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, planTierId: f.planTierId === tier._id ? "" : tier._id }))}
                        className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          form.planTierId === tier._id
                            ? "border-brand bg-brand-soft"
                            : "border-border hover:text-text"
                        }`}
                      >
                        <span className="text-sm font-semibold text-text">{tier.name}</span>
                        <span className="text-xs text-text-muted">
                          {tier.maxEmployees ? `${tier.minEmployees}-${tier.maxEmployees} employees` : `${tier.minEmployees}+ employees`}
                        </span>
                        <span className="text-xs font-medium text-brand">₹{tier.price.toLocaleString("en-IN")}/mo</span>
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Client Portal</p>
            <p className="text-sm text-text-muted">
              HRMS is{" "}
              <strong className="text-text">{editingClient.useHrms !== false ? "enabled" : "not enabled"}</strong> for
              this client.
            </p>
          </div>
        )}
      </form>
    </Modal>
  );
}

function DeleteClientModal({ client, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await businessClientApi.deleteBusinessClient(client._id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete this business client");
      setDeleting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete business client"
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
        Delete <strong className="text-text">{client.name}</strong>? This also removes their HRMS admin login. This
        cannot be undone.
      </p>
    </Modal>
  );
}

// ── Upgrade an Excel-payroll client to real HRMS ────────────────────────────

function UpgradeToHrmsModal({ client, onClose, onDone }) {
  const [adminName, setAdminName] = useState(client.contactPerson || client.name || "");
  const [adminEmail, setAdminEmail] = useState(client.email || "");
  const [adminPassword, setAdminPassword] = useState("");
  const [planTierId, setPlanTierId] = useState("");
  const [planTiers, setPlanTiers] = useState([]);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPlanTiers().then(setPlanTiers);
  }, []);

  function handleEmailBlur() {
    setEmailError(validateEmail(adminEmail, true));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const emailMsg = validateEmail(adminEmail, true);
    if (emailMsg) {
      setEmailError(emailMsg);
      setError("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await businessClientApi.upgradeToHrms(client._id, { adminName, adminEmail, adminPassword, planTierId });
      onDone(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not upgrade this client to HRMS");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Upgrade to HRMS — ${client.name}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="upgrade-to-hrms-form" type="submit" loading={submitting}>
            Upgrade
          </Button>
        </>
      }
    >
      <form id="upgrade-to-hrms-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <p className="text-sm text-text-muted">
          This client currently uses the Excel-based payroll. Upgrading creates a real HRMS admin login and moves them
          onto full HRMS — their Excel payroll history stays as-is but new payroll runs happen in HRMS instead.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="HRMS admin name" required value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          <Input
            label="HRMS admin email"
            required
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            onBlur={handleEmailBlur}
            error={emailError}
          />
        </div>
        <Input
          label="HRMS admin password"
          type="text"
          minLength={8}
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Leave blank to auto-generate and email a temporary password"
        />
        <Field label="HRMS plan" hint="Optional — leave unselected and the client will be asked to subscribe after they log in.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {planTiers.map((tier) => (
              <button
                key={tier._id}
                type="button"
                onClick={() => setPlanTierId((prev) => (prev === tier._id ? "" : tier._id))}
                className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  planTierId === tier._id ? "border-brand bg-brand-soft" : "border-border hover:text-text"
                }`}
              >
                <span className="text-sm font-semibold text-text">{tier.name}</span>
                <span className="text-xs text-text-muted">
                  {tier.maxEmployees ? `${tier.minEmployees}-${tier.maxEmployees} employees` : `${tier.minEmployees}+ employees`}
                </span>
                <span className="text-xs font-medium text-brand">₹{tier.price.toLocaleString("en-IN")}/mo</span>
              </button>
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}

export default function BusinessClientsPage() {
  const { basePath } = useAuth();
  const [clients, setClients] = useState([]);
  const [limit, setLimit] = useState({ used: 0, max: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [createdResult, setCreatedResult] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetTempPassword, setResetTempPassword] = useState(null);
  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [upgradeResult, setUpgradeResult] = useState(null);
  const [tab, setTab] = useState("hrms");

  const filteredClients = useMemo(
    () => clients.filter((c) => (tab === "hrms" ? c.useHrms !== false : c.useHrms === false)),
    [clients, tab]
  );

  async function load(searchTerm = search) {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      const { data } = await businessClientApi.listMyBusinessClients(params);
      setClients(data.data);
      setLimit(data.limit);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingClient(null);
    setFormOpen(true);
  }
  function openEdit(client) {
    setEditingClient(client);
    setFormOpen(true);
  }

  async function handleToggleActive(client) {
    await businessClientApi.updateBusinessClient(client._id, { isActive: !client.isActive });
    load();
  }

  const [hrmsPayrollBusyId, setHrmsPayrollBusyId] = useState(null);

  async function handleOpenHrmsPayroll(client) {
    setHrmsPayrollBusyId(client._id);
    try {
      const { data } = await businessClientApi.getClientHrmsSsoToken(client._id);
      const redirect = encodeURIComponent("/hrms/SuperAdmin/payroll/run");
      window.open(`${HRMS_BASE_PATH}/sso?token=${encodeURIComponent(data.data.token)}&redirect=${redirect}`, "_blank");
    } catch (err) {
      alert(err.response?.data?.message || "Could not open this client's HRMS payroll");
    } finally {
      setHrmsPayrollBusyId(null);
    }
  }

  const limitReached = limit.max !== null && limit.used >= limit.max;

  const columns = [
    {
      key: "name",
      label: "Business",
      render: (row) => (
        <div className="max-w-50">
          <p className="truncate font-medium text-heading" title={row.name}>
            {row.name}
          </p>
          <p className="text-xs text-text-muted">{CLIENT_TYPE_LABELS[row.clientType] || "—"}</p>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (row) => (
        <div className="max-w-50">
          <p className="truncate text-text" title={row.contactPerson || ""}>
            {row.contactPerson || "—"}
          </p>
          <p className="truncate text-xs text-text-muted" title={row.phone || row.email || ""}>
            {row.phone || row.email || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "services",
      label: "Services",
      render: (row) => (
        <div className="flex max-w-45 flex-wrap gap-1">
          {(row.services || []).slice(0, 2).map((s) => (
            <Badge key={s} variant="neutral">
              {SERVICE_LABELS[s] || s}
            </Badge>
          ))}
          {(row.services?.length || 0) > 2 && <Badge variant="neutral">+{row.services.length - 2}</Badge>}
        </div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => <Badge variant={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Suspended"}</Badge>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" title="View" onClick={() => setViewTarget(row._id)}>
            <Eye size={14} />
          </Button>
          <Button variant="ghost" size="sm" title="Edit" onClick={() => openEdit(row)}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={14} className="text-danger" />
          </Button>
          {row.useHrms === false && (
            <>
              <Link
                to={`${basePath}/clients/${row._id}/payroll`}
                title="Run payroll"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-text transition-colors hover:bg-surface-2"
              >
                <Wallet size={14} />
              </Link>
              <Button variant="ghost" size="sm" title="Upgrade to HRMS" onClick={() => setUpgradeTarget(row)}>
                <ArrowUpCircle size={14} />
              </Button>
            </>
          )}
          {row.useHrms !== false && row.hrmsCompanyId && (
            <Button
              variant="ghost"
              size="sm"
              title="View/run this client's payroll"
              onClick={() => handleOpenHrmsPayroll(row)}
              loading={hrmsPayrollBusyId === row._id}
            >
              <Wallet size={14} />
            </Button>
          )}
          {row.useHrms !== false && (
            <Button variant="ghost" size="sm" title="Reset HRMS admin password" onClick={() => setResetTarget(row)}>
              <KeyRound size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            title={row.isActive ? "Suspend" : "Activate"}
            onClick={() => handleToggleActive(row)}
          >
            {row.isActive ? <Ban size={14} /> : <Power size={14} />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Business Clients</h1>
          <p className="mt-1 text-sm text-text-muted">Onboard the businesses you manage into their own HRMS space.</p>
        </div>
        <Button onClick={openCreate} disabled={limitReached}>
          <Plus size={16} /> Add business client
        </Button>
      </div>

      <Card className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-text">
          <span className="font-semibold text-heading">{limit.used}</span> of{" "}
          <span className="font-semibold text-heading">{limit.max ?? "unlimited"}</span> business clients used
          {limitReached && <span className="ml-2 text-danger">— upgrade your plan to add more</span>}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="max-w-sm"
        >
          <Input placeholder="Search business clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </Card>

      <SegmentedTabs
        options={[
          { value: "hrms", label: "HRMS" },
          { value: "non-hrms", label: "Non-HRMS" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={clients.length === 0 ? "No business clients yet" : `No ${tab === "hrms" ? "HRMS" : "Non-HRMS"} clients`}
          description={
            clients.length === 0
              ? "Onboard your first business client to give them their own login."
              : "Switch tabs, or add a new business client."
          }
          action={
            <Button onClick={openCreate} size="sm">
              <Plus size={15} /> Add business client
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={filteredClients} keyField="_id" />
      )}

      <ClientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingClient={editingClient}
        onSaved={(created) => {
          setFormOpen(false);
          if (created) setCreatedResult(created);
          load();
        }}
      />

      {createdResult?.admin?.tempPassword && (
        <TempPasswordNotice
          title="Business client onboarded"
          email={createdResult.admin.email}
          name={createdResult.admin.name}
          tempPassword={createdResult.admin.tempPassword}
          hint={
            createdResult.client?.useHrms !== false
              ? "The same email and password also logs them into their HRMS."
              : "They'll land on their own dashboard to manage employees after logging in."
          }
          onClose={() => setCreatedResult(null)}
        />
      )}
      {createdResult && !createdResult.admin?.tempPassword && (
        <Modal open onClose={() => setCreatedResult(null)} title="Business client onboarded">
          <p className="text-sm text-text-muted">
            <strong className="text-text">{createdResult.client.name}</strong> has been added
            {createdResult.admin ? " — their admin can log in with the password you set." : "."}
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setCreatedResult(null)}>Done</Button>
          </div>
        </Modal>
      )}

      {viewTarget && <ViewClientModal clientId={viewTarget} onClose={() => setViewTarget(null)} />}

      {deleteTarget && (
        <DeleteClientModal
          client={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            load();
          }}
        />
      )}

      {resetTarget && (
        <ResetAdminPasswordModal
          client={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={(tempPassword) => {
            setResetTempPassword({ name: resetTarget.name, email: resetTarget.email, tempPassword });
            setResetTarget(null);
          }}
        />
      )}

      {resetTempPassword?.tempPassword && (
        <TempPasswordNotice
          title="Password reset"
          email={resetTempPassword.email}
          name={resetTempPassword.name}
          tempPassword={resetTempPassword.tempPassword}
          onClose={() => setResetTempPassword(null)}
        />
      )}
      {resetTempPassword && !resetTempPassword.tempPassword && (
        <Modal open onClose={() => setResetTempPassword(null)} title="Password updated">
          <p className="text-sm text-text-muted">
            <strong className="text-text">{resetTempPassword.name}</strong>'s admin password has been updated.
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setResetTempPassword(null)}>Done</Button>
          </div>
        </Modal>
      )}

      {upgradeTarget && (
        <UpgradeToHrmsModal
          client={upgradeTarget}
          onClose={() => setUpgradeTarget(null)}
          onDone={(result) => {
            setUpgradeTarget(null);
            setUpgradeResult(result);
            load();
          }}
        />
      )}
      {upgradeResult?.admin && (
        <TempPasswordNotice
          title="Upgraded to HRMS"
          email={upgradeResult.admin.email}
          name={upgradeResult.admin.name}
          tempPassword={upgradeResult.admin.tempPassword}
          hint="The same email and password also logs them into their HRMS."
          onClose={() => setUpgradeResult(null)}
        />
      )}
      {upgradeResult && !upgradeResult.admin && (
        <Modal open onClose={() => setUpgradeResult(null)} title="Upgraded to HRMS">
          <p className="text-sm text-text-muted">
            <strong className="text-text">{upgradeResult.client?.name}</strong> now uses HRMS. Their admin can log in
            with the password you set.
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setUpgradeResult(null)}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
