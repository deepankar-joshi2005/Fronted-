import { useEffect, useState } from "react";
import { Plus, Users as UsersIcon, KeyRound, Copy, Check, Eye, Trash2 } from "lucide-react";
import * as staffApi from "../../api/staff.api.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Switch from "../../components/ui/Switch.jsx";
import DateRangeFilter from "../../components/ui/DateRangeFilter.jsx";
import useDebouncedValue from "../../hooks/useDebouncedValue.js";
import useResettablePage from "../../hooks/useResettablePage.js";
import { sanitizePhone, validatePhone, validateEmail } from "../../utils/validators.js";
import { STAFF_MODULES, DEFAULT_MODULE_PERMISSIONS } from "../../config/modulePermissions.js";

const PAGE_SIZE = 15;

function clonePermissions(source) {
  const base = source || DEFAULT_MODULE_PERMISSIONS;
  return STAFF_MODULES.reduce((acc, m) => {
    acc[m.key] = { ...DEFAULT_MODULE_PERMISSIONS[m.key], ...base[m.key] };
    return acc;
  }, {});
}

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  icaiMembershipNo: "",
  password: "",
  permissions: clonePermissions(),
};

const SANITIZERS = {
  phone: sanitizePhone,
};

function ModulePermissionFields({ permissions, onChange }) {
  function updateModule(moduleKey, patch) {
    onChange({ ...permissions, [moduleKey]: { ...permissions[moduleKey], ...patch } });
  }

  return (
    <div>
      <p className="text-sm font-medium text-text">Module permissions</p>
      <p className="mt-0.5 text-xs text-text-muted">
        Only enabled modules show up in this staff member's sidebar. Add/edit/delete control what they can do inside
        each one.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {STAFF_MODULES.map(({ key, label }) => {
          const mod = permissions[key] || DEFAULT_MODULE_PERMISSIONS[key];
          return (
            <div key={key} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text">{label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{mod.enabled ? "Shown" : "Hidden"}</span>
                  <Switch checked={!!mod.enabled} onChange={(checked) => updateModule(key, { enabled: checked })} />
                </div>
              </div>
              {mod.enabled && (
                <div className="mt-3 flex flex-wrap gap-4">
                  {["add", "edit", "delete"].map((action) => (
                    <label key={action} className="flex items-center gap-2 text-sm text-text">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={!!mod[action]}
                        onChange={(e) => updateModule(key, { [action]: e.target.checked })}
                      />
                      {action === "add" ? "Add" : action === "edit" ? "Edit" : "Delete"}
                    </label>
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

function TempPasswordModal({ title, email, name, tempPassword, onClose }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <p className="text-sm text-text-muted">
        Share these temporary credentials with <strong className="text-text">{name}</strong> securely. They'll be
        asked to set a new password on first login.
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

function EditStaffModal({ staff, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: staff.name || "",
    email: staff.email || "",
    phone: staff.phone || "",
    designation: staff.designation || "",
    icaiMembershipNo: staff.icaiMembershipNo || "",
  });
  const [permissions, setPermissions] = useState(clonePermissions(staff.permissions));
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const VALIDATORS = {
    email: (v) => validateEmail(v, true),
    phone: (v) => validatePhone(v, false),
  };

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
    setSubmitting(true);
    try {
      await staffApi.updateStaff(staff.id, { ...form, permissions });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update staff member");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${staff.name}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="edit-staff-form" type="submit" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-staff-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" required value={form.name} onChange={update("name")} />
          <Input label="Designation" value={form.designation} onChange={update("designation")} placeholder="e.g. Accountant" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            onBlur={handleBlur("email")}
            error={fieldErrors.email}
          />
          <Input
            label="Phone"
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
          label="ICAI membership no."
          value={form.icaiMembershipNo}
          onChange={update("icaiMembershipNo")}
          placeholder="Optional — e.g. 123456"
          maxLength={7}
        />
        <ModulePermissionFields permissions={permissions} onChange={setPermissions} />
      </form>
    </Modal>
  );
}

function ResetStaffPasswordModal({ staff, onClose, onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await staffApi.resetStaffPassword(staff.id, { newPassword });
      onDone(data.data.tempPassword);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reset password — ${staff.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="reset-staff-password-form" type="submit" loading={submitting}>
            Update password
          </Button>
        </>
      }
    >
      <form id="reset-staff-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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

function ViewStaffModal({ staff, onClose }) {
  const permissions = clonePermissions(staff.permissions);

  return (
    <Modal open onClose={onClose} title={staff.name} size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-text-muted">Email</p>
            <p className="text-sm text-text">{staff.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Phone</p>
            <p className="text-sm text-text">{staff.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Designation</p>
            <p className="text-sm text-text">{staff.designation || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">ICAI membership no.</p>
            <p className="text-sm text-text">{staff.icaiMembershipNo || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Status</p>
            <Badge variant={staff.isActive ? "success" : "danger"}>{staff.isActive ? "Active" : "Disabled"}</Badge>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-text">Module permissions</p>
          <div className="mt-2 flex flex-col gap-2">
            {STAFF_MODULES.map(({ key, label }) => {
              const mod = permissions[key];
              return (
                <div key={key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <p className="text-sm text-text">{label}</p>
                  {mod.enabled ? (
                    <div className="flex gap-1.5">
                      {mod.add && <Badge variant="neutral">Add</Badge>}
                      {mod.edit && <Badge variant="neutral">Edit</Badge>}
                      {mod.delete && <Badge variant="neutral">Delete</Badge>}
                      {!mod.add && !mod.edit && !mod.delete && <Badge variant="neutral">View only</Badge>}
                    </div>
                  ) : (
                    <Badge variant="danger">Hidden</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DeleteStaffModal({ staff, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await staffApi.deleteStaff(staff.id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete this staff member");
      setDeleting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete staff member"
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
      {error && (
        <div className="mb-3 rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      <p className="text-sm text-text-muted">
        Delete <strong className="text-text">{staff.name}</strong>? Their account will be removed and they will no
        longer be able to log in. This cannot be undone.
      </p>
    </Modal>
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [seats, setSeats] = useState({ used: 0, limit: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [dateRange, setDateRange] = useState({ preset: "all", startDate: "", endDate: "" });
  const [page, setPage] = useResettablePage(`${debouncedSearch}|${dateRange.startDate}|${dateRange.endDate}`);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdResult, setCreatedResult] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetTempPassword, setResetTempPassword] = useState(null);

  const VALIDATORS = {
    email: (v) => validateEmail(v, true),
    phone: (v) => validatePhone(v, false),
  };

  async function load() {
    setLoading(true);
    try {
      const params: any = { page, limit: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const { data } = await staffApi.listStaff(params);
      setStaff(data.data);
      setMeta(data.meta || { total: data.data.length, totalPages: 1 });
      setSeats(data.seats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, dateRange.startDate, dateRange.endDate]);

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

  async function handleCreate(e) {
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
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const { data } = await staffApi.createStaff(payload);
      setModalOpen(false);
      setForm({ ...INITIAL_FORM, permissions: clonePermissions() });
      setFieldErrors({});
      setCreatedResult(data.data);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create staff account");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(member) {
    await staffApi.updateStaff(member.id, { isActive: !member.isActive });
    load();
  }

  const seatLimitReached = seats.limit !== null && seats.used >= seats.limit;

  const columns = [
    {
      key: "name",
      label: "Staff",
      render: (row) => (
        <div>
          <p className="font-medium text-heading">{row.name}</p>
          <p className="text-xs text-text-muted">{row.email}</p>
        </div>
      ),
    },
    { key: "designation", label: "Designation", render: (row) => row.designation || "—" },
    { key: "phone", label: "Phone", render: (row) => row.phone || "—" },
    {
      key: "isActive",
      label: "Status",
      render: (row) => <Badge variant={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Disabled"}</Badge>,
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
            Edit
          </Button>
          <Button variant="ghost" size="sm" title="Reset password" onClick={() => setResetTarget(row)}>
            <KeyRound size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(row)}>
            {row.isActive ? "Disable" : "Enable"}
          </Button>
          <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleteTarget(row)}>
            <Trash2 size={14} className="text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-heading">Staff</h1>
          <p className="mt-1 text-sm text-text-muted">Manage your firm's team accounts.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={seatLimitReached}>
          <Plus size={16} /> Add staff
        </Button>
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <p className="text-sm text-text">
          <span className="font-semibold text-heading">{seats.used}</span> of{" "}
          <span className="font-semibold text-heading">{seats.limit ?? "unlimited"}</span> seats used
          {seatLimitReached && (
            <span className="ml-2 text-danger">— upgrade your plan to add more staff</span>
          )}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-sm">
            <Input label="Search" placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <DateRangeFilter
            preset={dateRange.preset}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : staff.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No staff found"
          description="Try adjusting your search or date range, or add your first team member."
          action={
            <Button onClick={() => setModalOpen(true)} size="sm">
              <Plus size={15} /> Add staff
            </Button>
          }
        />
      ) : (
        <Table
          columns={columns}
          data={staff}
          keyField="id"
          pagination={{ page, totalPages: meta.totalPages, total: meta.total, limit: PAGE_SIZE, onChange: setPage }}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add a staff member"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button form="create-staff-form" type="submit" loading={submitting}>
              Create account
            </Button>
          </>
        }
      >
        <form id="create-staff-form" onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" required value={form.name} onChange={update("name")} />
            <Input
              label="Designation"
              value={form.designation}
              onChange={update("designation")}
              placeholder="e.g. Article Assistant"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              onBlur={handleBlur("email")}
              error={fieldErrors.email}
            />
            <Input
              label="Phone"
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
            label="ICAI membership no."
            value={form.icaiMembershipNo}
            onChange={update("icaiMembershipNo")}
            placeholder="Optional — e.g. 123456"
            maxLength={7}
          />
          <Input
            label="Password"
            type="text"
            minLength={8}
            value={form.password}
            onChange={update("password")}
            placeholder="Leave blank to auto-generate and email a temporary password"
          />
          <ModulePermissionFields
            permissions={form.permissions}
            onChange={(permissions) => setForm((f) => ({ ...f, permissions }))}
          />
        </form>
      </Modal>

      {createdResult && (
        <TempPasswordModal
          title="Staff account created"
          email={createdResult.staff.email}
          name={createdResult.staff.name}
          tempPassword={createdResult.tempPassword}
          onClose={() => setCreatedResult(null)}
        />
      )}

      {editTarget && (
        <EditStaffModal
          staff={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            load();
          }}
        />
      )}

      {viewTarget && <ViewStaffModal staff={viewTarget} onClose={() => setViewTarget(null)} />}

      {deleteTarget && (
        <DeleteStaffModal
          staff={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            load();
          }}
        />
      )}

      {resetTarget && (
        <ResetStaffPasswordModal
          staff={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={(tempPassword) => {
            setResetTempPassword({ name: resetTarget.name, email: resetTarget.email, tempPassword });
            setResetTarget(null);
          }}
        />
      )}

      {resetTempPassword?.tempPassword && (
        <TempPasswordModal
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
            <strong className="text-text">{resetTempPassword.name}</strong>'s password has been updated.
          </p>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setResetTempPassword(null)}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
