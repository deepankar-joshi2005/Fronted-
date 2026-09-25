import { useEffect, useState } from "react";
import { Plus, Users, Pencil, Ban, Power } from "lucide-react";
import * as businessClientApi from "../../api/businessClient.api.js";
import Table from "../../components/ui/Table.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { sanitizePan, sanitizePhone, validatePan, validatePhone, validateEmail } from "../../utils/validators.js";

const SANITIZERS = {
  phone: sanitizePhone,
  pan: sanitizePan,
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  designation: "",
  dateOfJoining: "",
  costCenter: "",
  pan: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankName: "",
  accountHolderName: "",
};

const SOURCE_LABELS: Record<string, { label: string; variant: string }> = {
  self_registered: { label: "Self-registered", variant: "brand" },
  manual: { label: "Manual", variant: "neutral" },
  excel_import: { label: "Excel import", variant: "neutral" },
};

function EmployeeFormModal({ open, onClose, editingEmployee, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const VALIDATORS = {
    phone: (v) => validatePhone(v, false),
    email: (v) => validateEmail(v, false),
    pan: (v) => validatePan(v, false),
  };

  useEffect(() => {
    if (!open) return;
    setError("");
    setFieldErrors({});
    if (editingEmployee) {
      setForm({
        name: editingEmployee.name || "",
        phone: editingEmployee.phone || "",
        email: editingEmployee.email || "",
        designation: editingEmployee.designation || "",
        dateOfJoining: editingEmployee.dateOfJoining ? editingEmployee.dateOfJoining.slice(0, 10) : "",
        costCenter: editingEmployee.costCenter || "",
        pan: editingEmployee.pan || "",
        bankAccountNumber: editingEmployee.bankAccountNumber || "",
        bankIfsc: editingEmployee.bankIfsc || "",
        bankName: editingEmployee.bankName || "",
        accountHolderName: editingEmployee.accountHolderName || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editingEmployee]);

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
    if (!form.name) {
      setError("Name is required");
      return;
    }
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
      if (editingEmployee) {
        await businessClientApi.updateMyEmployee(editingEmployee._id, form);
      } else {
        await businessClientApi.createMyEmployee(form);
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save this employee");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingEmployee ? "Edit Employee" : "Add Employee"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="employee-form" type="submit" loading={submitting}>
            {editingEmployee ? "Save changes" : "Add Employee"}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <Input label="Full Name" required value={form.name} onChange={update("name")} />
        <div className="grid grid-cols-2 gap-4">
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
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update("email")}
            onBlur={handleBlur("email")}
            error={fieldErrors.email}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Designation" value={form.designation} onChange={update("designation")} />
          <Input label="Date of Joining" type="date" value={form.dateOfJoining} onChange={update("dateOfJoining")} />
        </div>
        <Input label="Cost Center" value={form.costCenter} onChange={update("costCenter")} />
        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Bank &amp; ID (for payroll)</p>
          <div className="flex flex-col gap-4">
            <Input
              label="PAN"
              value={form.pan}
              onChange={update("pan")}
              onBlur={handleBlur("pan")}
              error={fieldErrors.pan}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Account Holder Name" value={form.accountHolderName} onChange={update("accountHolderName")} />
              <Input label="Bank Name" value={form.bankName} onChange={update("bankName")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bank Account Number" value={form.bankAccountNumber} onChange={update("bankAccountNumber")} />
              <Input label="Bank IFSC Code" value={form.bankIfsc} onChange={update("bankIfsc")} />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await businessClientApi.listMyEmployees();
      setEmployees(data.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleActive(employee) {
    await businessClientApi.updateMyEmployee(employee._id, { isActive: !employee.isActive });
    load();
  }

  const columns = [
    {
      key: "name",
      label: "Employee",
      render: (row) => (
        <div>
          <p className="font-medium text-heading">{row.name}</p>
          <p className="text-xs text-text-muted">{row.employeeCode}</p>
        </div>
      ),
    },
    {
      key: "designation",
      label: "Designation",
      render: (row) => row.designation || "—",
    },
    {
      key: "dateOfJoining",
      label: "Date of Joining",
      render: (row) => (row.dateOfJoining ? new Date(row.dateOfJoining).toLocaleDateString("en-IN") : "—"),
    },
    {
      key: "contact",
      label: "Contact",
      render: (row) => (
        <div>
          <p className="text-text">{row.phone || "—"}</p>
          <p className="text-xs text-text-muted">{row.email || ""}</p>
        </div>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (row) => {
        const s = SOURCE_LABELS[row.source] || SOURCE_LABELS.manual;
        return <Badge variant={s.variant as any}>{s.label}</Badge>;
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => <Badge variant={row.isActive ? "success" : "danger"}>{row.isActive ? "Active" : "Inactive"}</Badge>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="Edit"
            onClick={() => {
              setEditingEmployee(row);
              setFormOpen(true);
            }}
          >
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="sm" title={row.isActive ? "Deactivate" : "Activate"} onClick={() => handleToggleActive(row)}>
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
          <h1 className="text-2xl font-bold text-heading">Employees</h1>
          <p className="mt-1 text-sm text-text-muted">
            Employees who submit their details through your onboarding link show up here automatically.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEmployee(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Add employee
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees yet"
          description="Share your onboarding link (see Dashboard) or add an employee manually."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingEmployee(null);
                setFormOpen(true);
              }}
            >
              <Plus size={15} /> Add employee
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={employees} keyField="_id" />
      )}

      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingEmployee={editingEmployee}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
    </div>
  );
}
