import { useEffect, useState } from "react";
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

const INITIAL_FORM = {
  name: "",
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

function req(label) {
  return (
    <>
      {label} <span className="text-danger">*</span>
    </>
  );
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

function ServiceCheckboxes({ value, onChange }) {
  function toggle(service) {
    onChange(value.includes(service) ? value.filter((s) => s !== service) : [...value, service]);
  }
  return (
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

function ClientFormModal({ open, onClose, editingClient, onSaved }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [planTiers, setPlanTiers] = useState([]);

  useEffect(() => {
    if (!open) return;
    hrmsPlanTierApi.listHrmsPlanTiers().then(({ data }) => setPlanTiers(data.data));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (editingClient) {
      setForm({
        name: editingClient.name || "",
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
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.services.length === 0) {
      setError("Select at least one service");
      return;
    }
    if (!editingClient && form.useHrms && !form.email) {
      setError("Email is required to create the HRMS login");
      return;
    }
    if (!editingClient && form.useHrms && !form.planTierId) {
      setError("Select an HRMS plan for this client");
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
              <Input label={req("Business / Client Name")} required value={form.name} onChange={update("name")} />
              <Select label={req("Client Type")} required value={form.clientType} onChange={update("clientType")}>
                <option value="" disabled>
                  Select type
                </option>
                {Object.entries(CLIENT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="PAN" value={form.pan} onChange={update("pan")} />
              <Input label="GSTIN" value={form.gstin} onChange={update("gstin")} />
            </div>
            <Input label="Industry / Business Category" value={form.industry} onChange={update("industry")} />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Primary Contact</p>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={req("Contact Person Name")} required value={form.contactPerson} onChange={update("contactPerson")} />
              <Input label={req("Mobile Number")} required value={form.phone} onChange={update("phone")} />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={update("email")} />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Address</p>
          <div className="flex flex-col gap-4">
            <Input label="Address" value={form.address} onChange={update("address")} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" value={form.city} onChange={update("city")} />
              <Input label="State" value={form.state} onChange={update("state")} />
              <Input label="Pincode" value={form.pincode} onChange={update("pincode")} />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <Field label={req("Services")}>
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
                  Creates an HR/admin login for this business client's own HRMS workspace, using the Primary Contact
                  details above. Leave unticked and this client gets no login at all.
                </span>
              </span>
            </label>
            {form.useHrms && (
              <div className="mt-3 flex flex-col gap-3">
                <Input
                  label="HRMS admin password"
                  type="text"
                  minLength={8}
                  value={form.adminPassword}
                  onChange={update("adminPassword")}
                  placeholder="Leave blank to auto-generate and email a temporary password"
                />
                <Field label={req("HRMS plan")}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {planTiers.map((tier) => (
                      <button
                        key={tier._id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, planTierId: tier._id }))}
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
              </div>
            )}
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

// ── View Business Client ────────────────────────────────────────────────────

function ViewClientModal({ client, onClose }) {
  return (
    <Modal open onClose={onClose} title={client.name} size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Business Information</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-text-muted">Client Type</p>
              <p className="text-text">{CLIENT_TYPE_LABELS[client.clientType] || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Industry</p>
              <p className="text-text">{client.industry || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">PAN</p>
              <p className="text-text">{client.pan || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">GSTIN</p>
              <p className="text-text">{client.gstin || "—"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Primary Contact</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-text-muted">Contact Person</p>
              <p className="text-text">{client.contactPerson || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Mobile</p>
              <p className="text-text">{client.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Email</p>
              <p className="text-text">{client.email || "—"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Address</p>
          <p className="text-sm text-text">
            {[client.address, client.city, client.state, client.pincode].filter(Boolean).join(", ") || "—"}
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Services</p>
          {client.services?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {client.services.map((s) => (
                <Badge key={s} variant="neutral">
                  {SERVICE_LABELS[s] || s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">—</p>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Client Portal</p>
          <p className="text-sm text-text">HRMS {client.useHrms !== false ? "enabled" : "not enabled"}</p>
        </div>
      </div>
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    hrmsPlanTierApi.listHrmsPlanTiers().then(({ data }) => setPlanTiers(data.data));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!adminEmail) {
      setError("An email is required to create the HRMS login");
      return;
    }
    if (!planTierId) {
      setError("Select an HRMS plan for this client");
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
          <Input label={req("HRMS admin name")} required value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          <Input
            label={req("HRMS admin email")}
            required
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
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
        <Field label={req("HRMS plan")}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {planTiers.map((tier) => (
              <button
                key={tier._id}
                type="button"
                onClick={() => setPlanTierId(tier._id)}
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
          <Button variant="ghost" size="sm" title="View" onClick={() => setViewTarget(row)}>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No business clients yet"
          description="Onboard your first business client to give them their own HRMS login."
          action={
            <Button onClick={openCreate} size="sm">
              <Plus size={15} /> Add business client
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={clients} keyField="_id" />
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

      {createdResult?.admin && (
        <TempPasswordNotice
          title="Business client onboarded"
          email={createdResult.admin.email}
          name={createdResult.admin.name}
          tempPassword={createdResult.admin.tempPassword}
          hint="The same email and password also logs them into their HRMS."
          onClose={() => setCreatedResult(null)}
        />
      )}
      {createdResult && !createdResult.admin && (
        <Modal open onClose={() => setCreatedResult(null)} title="Business client onboarded">
          <p className="text-sm text-text-muted">
            <strong className="text-text">{createdResult.client.name}</strong> has been added.
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setCreatedResult(null)}>Done</Button>
          </div>
        </Modal>
      )}

      {viewTarget && <ViewClientModal client={viewTarget} onClose={() => setViewTarget(null)} />}

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
