import { useEffect, useState } from "react";
import { Plus, Users as UsersIcon, KeyRound, Copy, Check } from "lucide-react";
import * as staffApi from "../../api/staff.api.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Table from "../../components/ui/Table.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

const INITIAL_FORM = { name: "", email: "", phone: "", designation: "", icaiMembershipNo: "", password: "" };

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
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await staffApi.updateStaff(staff.id, form);
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
          <Input label="Email" type="email" required value={form.email} onChange={update("email")} />
          <Input label="Phone" value={form.phone} onChange={update("phone")} />
        </div>
        <Input
          label="ICAI membership no."
          value={form.icaiMembershipNo}
          onChange={update("icaiMembershipNo")}
          placeholder="Optional — e.g. 123456"
          maxLength={7}
        />
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

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [seats, setSeats] = useState({ used: 0, limit: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdResult, setCreatedResult] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetTempPassword, setResetTempPassword] = useState(null);

  async function load(searchTerm = search) {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      const { data } = await staffApi.listStaff(params);
      setStaff(data.data);
      setSeats(data.seats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const { data } = await staffApi.createStaff(payload);
      setModalOpen(false);
      setForm(INITIAL_FORM);
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
          <Button variant="ghost" size="sm" title="Edit" onClick={() => setEditTarget(row)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" title="Reset password" onClick={() => setResetTarget(row)}>
            <KeyRound size={14} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleToggleActive(row)}>
            {row.isActive ? "Disable" : "Enable"}
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

      <Card className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-text">
          <span className="font-semibold text-heading">{seats.used}</span> of{" "}
          <span className="font-semibold text-heading">{seats.limit ?? "unlimited"}</span> seats used
          {seatLimitReached && (
            <span className="ml-2 text-danger">— upgrade your plan to add more staff</span>
          )}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="max-w-sm"
        >
          <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : staff.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No staff yet"
          description="Add your team members so they can work on CRM, Compliance, and Loan Calculator."
          action={
            <Button onClick={() => setModalOpen(true)} size="sm">
              <Plus size={15} /> Add staff
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={staff} keyField="id" />
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
            <Input label="Email" type="email" required value={form.email} onChange={update("email")} />
            <Input label="Phone" value={form.phone} onChange={update("phone")} />
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
