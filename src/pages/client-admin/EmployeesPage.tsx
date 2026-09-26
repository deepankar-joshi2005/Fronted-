import { useEffect, useState } from "react";
import { Users, Pencil, Ban, Power, Download, Eye } from "lucide-react";
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

const SOURCE_LABELS: Record<string, { label: string; variant: string }> = {
  self_registered: { label: "Self-registered", variant: "brand" },
  manual: { label: "Manual", variant: "neutral" },
  excel_import: { label: "Excel import", variant: "neutral" },
};

function escapeCsvValue(value: unknown) {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function exportEmployeeIdsToCsv(employees: any[]) {
  const rows = [["Employee Name", "Employee ID"], ...employees.map((e) => [e.name || "", e.employeeCode || ""])];
  const csv = rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "employee-ids.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function EmployeeFormModal({ open, onClose, employee, onSaved }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const VALIDATORS = {
    phone: (v) => validatePhone(v, false),
    email: (v) => validateEmail(v, false),
    pan: (v) => validatePan(v, false),
  };

  useEffect(() => {
    if (!open || !employee) return;
    setError("");
    setFieldErrors({});
    setForm({
      name: employee.name || "",
      phone: employee.phone || "",
      email: employee.email || "",
      designation: employee.designation || "",
      dateOfJoining: employee.dateOfJoining ? employee.dateOfJoining.slice(0, 10) : "",
      costCenter: employee.costCenter || "",
      pan: employee.pan || "",
      bankAccountNumber: employee.bankAccountNumber || "",
      bankIfsc: employee.bankIfsc || "",
      bankName: employee.bankName || "",
      accountHolderName: employee.accountHolderName || "",
    });
  }, [open, employee]);

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
      await businessClientApi.updateMyEmployee(employee._id, form);
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
      title="Edit Employee"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="employee-form" type="submit" loading={submitting}>
            Save changes
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

function ViewField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="text-sm text-heading">{value || "—"}</p>
    </div>
  );
}

function EmployeeViewModal({ open, onClose, employee }) {
  if (!employee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Employee Details"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <ViewField label="Employee ID" value={employee.employeeCode} />
        <ViewField label="Full Name" value={employee.name} />
        <div className="grid grid-cols-2 gap-4">
          <ViewField label="Phone" value={employee.phone} />
          <ViewField label="Email" value={employee.email} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ViewField label="Designation" value={employee.designation} />
          <ViewField
            label="Date of Joining"
            value={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString("en-IN") : ""}
          />
        </div>
        <ViewField label="Cost Center" value={employee.costCenter} />
        <div className="border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Bank &amp; ID (for payroll)</p>
          <div className="flex flex-col gap-4">
            <ViewField label="PAN" value={employee.pan} />
            <div className="grid grid-cols-2 gap-4">
              <ViewField label="Account Holder Name" value={employee.accountHolderName} />
              <ViewField label="Bank Name" value={employee.bankName} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ViewField label="Bank Account Number" value={employee.bankAccountNumber} />
              <ViewField label="Bank IFSC Code" value={employee.bankIfsc} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);

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
            title="View"
            onClick={() => {
              setViewingEmployee(row);
              setViewOpen(true);
            }}
          >
            <Eye size={14} />
          </Button>
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
        <Button variant="secondary" disabled={employees.length === 0} onClick={() => exportEmployeeIdsToCsv(employees)}>
          <Download size={16} /> Export Employee IDs
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
          description="Employees who submit their details through your onboarding link (see Dashboard) will show up here."
        />
      ) : (
        <Table columns={columns} data={employees} keyField="_id" />
      )}

      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        employee={editingEmployee}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />

      <EmployeeViewModal open={viewOpen} onClose={() => setViewOpen(false)} employee={viewingEmployee} />
    </div>
  );
}
