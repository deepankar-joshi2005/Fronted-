import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Upload,
  Settings2,
  Pencil,
  Users,
  ClipboardCheck,
  TrendingUp,
  PercentCircle,
  MapPin,
  CheckCircle2,
  Circle,
  Eye,
} from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import * as payrollApi from "../../../api/clientPayroll.api";
import { useAuth } from "../../../hooks/useAuth";
import ClientIdentityCard from "../../../components/payroll/ClientIdentityCard.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Card from "../../../components/ui/Card.jsx";
import Table from "../../../components/ui/Table.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function downloadBlob(data: BlobPart, filename: string) {
  const url = URL.createObjectURL(new Blob([data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function StatCard({ icon: Icon, label, value, sub, accentBg, accentText }: any) {
  return (
    <Card className="p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-bold text-heading">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-text-muted">{sub}</p>}
    </Card>
  );
}

// ── Salary components list (which columns exist at all) ────────────────────

function ComponentsModal({ open, onClose, settings, onSaved, businessClientId }: any) {
  const [earnings, setEarnings] = useState("");
  const [deductions, setDeductions] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setEarnings((settings?.earningComponents || []).join(", "));
    setDeductions((settings?.deductionComponents || []).join(", "));
    setError("");
  }, [open, settings]);

  async function handleSave() {
    const earningComponents = earnings.split(",").map((s) => s.trim()).filter(Boolean);
    const deductionComponents = deductions.split(",").map((s) => s.trim()).filter(Boolean);
    if (earningComponents.length === 0) {
      setError("At least one earning component is required");
      return;
    }
    if (!earningComponents.includes("Basic Salary")) earningComponents.unshift("Basic Salary");
    setSaving(true);
    setError("");
    try {
      const { data } = await payrollApi.updatePayrollSettings(businessClientId, { earningComponents, deductionComponents });
      onSaved(data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save components");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Salary components for this client"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <p className="text-sm text-text-muted">
          These are the columns that appear on the salary structure below. "Basic Salary" always stays first — its value comes
          straight from the Excel import, everything else is a % of it. Comma-separated.
        </p>
        <Input label="Earning components" value={earnings} onChange={(e: any) => setEarnings(e.target.value)} placeholder="Basic Salary, HRA, DA" />
        <Input
          label="Deduction components"
          value={deductions}
          onChange={(e: any) => setDeductions(e.target.value)}
          placeholder="PF, Professional Tax, TDS"
        />
      </div>
    </Modal>
  );
}

// ── Structure Settings: % of Basic Salary per component + Employee ID format ─

function StructureSettingsModal({ open, onClose, settings, firmSettings, businessClientId, month, onSaved }: any) {
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [prefix, setPrefix] = useState("EMP-");
  const [padding, setPadding] = useState("4");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const requiredComponents = [
    ...(settings?.earningComponents || []).filter((c: string) => c !== "Basic Salary"),
    ...(settings?.deductionComponents || []),
  ];

  useEffect(() => {
    if (!open) return;
    const current = settings?.componentPercentages || {};
    const defaults = firmSettings?.defaultComponentPercentages || {};
    const next: Record<string, string> = {};
    requiredComponents.forEach((c: string) => {
      if (current[c] !== undefined && current[c] !== null) next[c] = String(current[c]);
      else if (defaults[c] !== undefined && defaults[c] !== null) next[c] = String(defaults[c]);
      else next[c] = "";
    });
    setPercentages(next);
    setPrefix(firmSettings?.employeeIdPrefix || "EMP-");
    setPadding(String(firmSettings?.employeeIdPadding || 4));
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings, firmSettings]);

  async function handleSave() {
    const missing = requiredComponents.filter((c: string) => percentages[c] === undefined || percentages[c] === "");
    if (missing.length > 0) {
      setError(`Set a percentage for: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const percentagesPayload: Record<string, number> = {};
      requiredComponents.forEach((c: string) => (percentagesPayload[c] = Number(percentages[c]) || 0));
      await Promise.all([
        payrollApi.updateComponentPercentages(businessClientId, { percentages: percentagesPayload, month }),
        payrollApi.updateFirmPayrollSettings({ employeeIdPrefix: prefix || "EMP-", employeeIdPadding: Number(padding) || 4 }),
      ]);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save Structure Settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Structure Setting"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <p className="text-sm text-text-muted">
          Each component below is calculated as a % of <strong className="text-text">Basic Salary</strong> — e.g. Basic ₹100 with
          HRA at 10% gives ₹10 HRA. All fields are required to save, but you can always come back and edit or clear them.
        </p>

        {requiredComponents.length === 0 ? (
          <p className="text-sm text-text-muted">No components configured yet — add some via "Salary components" first.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {requiredComponents.map((c: string) => (
              <Input
                key={c}
                label={c}
                type="number"
                min={0}
                max={100}
                value={percentages[c] ?? ""}
                onChange={(e: any) => setPercentages((p) => ({ ...p, [c]: e.target.value }))}
                placeholder="%"
              />
            ))}
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="mb-1 text-sm font-semibold text-heading">Employee ID format</p>
          <p className="mb-3 text-xs text-text-muted">Applies to every client in your firm — not just this one.</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prefix" value={prefix} onChange={(e: any) => setPrefix(e.target.value)} placeholder="EMP-" />
            <Input
              label="Number of digits"
              type="number"
              min={1}
              max={8}
              value={padding}
              onChange={(e: any) => setPadding(e.target.value)}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Example: {prefix || "EMP-"}
            {String(1).padStart(Number(padding) || 4, "0")}
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ── Manual edit of one employee's structure for the selected month ─────────

function EmployeeStructureModal({ open, onClose, row, settings, businessClientId, month, onSaved }: any) {
  const [basicSalary, setBasicSalary] = useState("");
  const [payDays, setPayDays] = useState("");
  const [totalWorkingDays, setTotalWorkingDays] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !row) return;
    const earnings = row.earnings || {};
    const deductions = row.deductions || {};
    setBasicSalary(String(earnings["Basic Salary"] ?? ""));
    setPayDays(String(row.payDays ?? ""));
    setTotalWorkingDays(String(row.totalWorkingDays ?? ""));
    setCostCenter(row.costCenter || "");
    const next: Record<string, string> = {};
    (settings?.earningComponents || []).forEach((c: string) => {
      if (c === "Basic Salary") return;
      next[`e:${c}`] = earnings[c] ?? "";
    });
    (settings?.deductionComponents || []).forEach((c: string) => (next[`d:${c}`] = deductions[c] ?? ""));
    setValues(next);
    setError("");
  }, [open, row, settings]);

  async function handleSave() {
    const earnings: Record<string, number> = { "Basic Salary": Number(basicSalary) || 0 };
    for (const c of settings?.earningComponents || []) {
      if (c === "Basic Salary") continue;
      earnings[c] = Number(values[`e:${c}`]) || 0;
    }
    const deductions: Record<string, number> = {};
    for (const c of settings?.deductionComponents || []) deductions[c] = Number(values[`d:${c}`]) || 0;

    setSaving(true);
    setError("");
    try {
      await payrollApi.updateEmployeeStructure(businessClientId, month, row.employee._id, {
        earnings,
        deductions,
        payDays: Number(payDays) || 0,
        totalWorkingDays: Number(totalWorkingDays) || 0,
        costCenter,
      });
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save salary structure");
    } finally {
      setSaving(false);
    }
  }

  if (!row) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Salary structure — ${row.employee?.name} · ${monthLabel(month)}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input label="Basic Salary" type="number" value={basicSalary} onChange={(e: any) => setBasicSalary(e.target.value)} />
          <Input label="Pay Days" type="number" value={payDays} onChange={(e: any) => setPayDays(e.target.value)} />
          <Input
            label="Total Working Days"
            type="number"
            value={totalWorkingDays}
            onChange={(e: any) => setTotalWorkingDays(e.target.value)}
          />
          <Input label="Cost Center" value={costCenter} onChange={(e: any) => setCostCenter(e.target.value)} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Earnings</p>
          <div className="grid grid-cols-2 gap-3">
            {(settings?.earningComponents || [])
              .filter((c: string) => c !== "Basic Salary")
              .map((c: string) => (
                <Input
                  key={c}
                  label={c}
                  type="number"
                  value={values[`e:${c}`] ?? ""}
                  onChange={(e: any) => setValues((v) => ({ ...v, [`e:${c}`]: e.target.value }))}
                />
              ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Deductions</p>
          <div className="grid grid-cols-2 gap-3">
            {(settings?.deductionComponents || []).map((c: string) => (
              <Input
                key={c}
                label={c}
                type="number"
                value={values[`d:${c}`] ?? ""}
                onChange={(e: any) => setValues((v) => ({ ...v, [`d:${c}`]: e.target.value }))}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Upload Excel: preview then confirm ──────────────────────────────────────

function UploadModal({ open, onClose, businessClientId, month, onImported }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ data: any[]; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setPreview(null);
    setError("");
  }, [open]);

  async function handlePreview() {
    if (!file) {
      setError("Choose an Excel file first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await payrollApi.previewStructureUpload(businessClientId, month, file);
      setPreview({ data: data.data, errors: data.errors || [] });
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not read this file");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview || preview.data.length === 0) return;
    setLoading(true);
    setError("");
    try {
      await payrollApi.confirmStructureUpload(businessClientId, month, { rows: preview.data, sourceFileName: file?.name });
      onImported();
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not import this file");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Upload payroll Excel — ${monthLabel(month)}`}
      size="lg"
      footer={
        preview ? (
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Back
            </Button>
            <Button onClick={handleConfirm} loading={loading} disabled={preview.data.length === 0}>
              Confirm import ({preview.data.length} employee{preview.data.length === 1 ? "" : "s"})
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePreview} loading={loading}>
              Preview
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}

        {!preview ? (
          <div>
            <label className="text-sm font-medium text-text">Excel file (Employee Name, Basic Salary, Pay Days, Total Working Days)</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1.5 block w-full text-sm text-text file:mr-3 file:rounded-xl file:border-0 file:bg-brand-soft file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-brand"
            />
          </div>
        ) : (
          <>
            {preview.errors.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
                <p className="mb-1 font-medium">{preview.errors.length} row(s) skipped:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {preview.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-text-muted">{preview.data.length} employee(s) ready to import for {monthLabel(month)}.</p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Basic Salary</th>
                    <th className="px-3 py-2">Pay Days</th>
                    <th className="px-3 py-2">Total Working Days</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.data.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5">{r.employeeName}</td>
                      <td className="px-3 py-1.5">{r.basicSalary}</td>
                      <td className="px-3 py-1.5">{r.payDays}</td>
                      <td className="px-3 py-1.5">{r.totalWorkingDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ClientSalaryStructurePage() {
  const { clientId } = useParams();
  const { basePath } = useAuth();
  const navigate = useNavigate();

  const [client, setClient] = useState<any>(null);
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [run, setRun] = useState<any>(null);
  const [firmSettings, setFirmSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [componentsOpen, setComponentsOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [costCenterInput, setCostCenterInput] = useState("");
  const [costCenterSaving, setCostCenterSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");

  async function loadClient() {
    if (!clientId) return;
    const { data } = await businessClientApi.getBusinessClient(clientId);
    setClient(data.data);
  }

  async function loadFirmSettings() {
    const { data } = await payrollApi.getFirmPayrollSettings();
    setFirmSettings(data.data);
  }

  async function loadStructure(targetMonth: string) {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data } = await payrollApi.getStructureForMonth(clientId, targetMonth);
      setRows(data.data || []);
      setSettings(data.settings || null);
      setRun(data.run || null);
      setCostCenterInput(data.data?.[0]?.costCenter || "");
      setJustSaved(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
    loadFirmSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    loadStructure(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, month]);

  async function handleDownloadTemplate() {
    const { data } = await payrollApi.downloadPayrollTemplate(clientId!);
    downloadBlob(data, `${client?.name || "client"}_Salary_Structure_Template.xlsx`);
  }

  async function handleApplyCostCenter() {
    setCostCenterSaving(true);
    setError("");
    try {
      await payrollApi.updateCostCenter(clientId!, month, costCenterInput);
      await loadStructure(month);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not apply cost center");
    } finally {
      setCostCenterSaving(false);
    }
  }

  async function handleSaveStructure() {
    setSaving(true);
    setError("");
    try {
      await payrollApi.saveStructureForMonth(clientId!, month);
      setConfirmSaveOpen(false);
      setJustSaved(true);
      await loadStructure(month);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not save salary structure");
      setConfirmSaveOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const totalGross = rows.reduce((sum, r) => sum + (r.gross || 0), 0);
  const percentagesConfigured = settings?.componentPercentages && Object.keys(settings.componentPercentages).length > 0;

  const steps = [
    { label: "Import Excel for this month", done: rows.length > 0 },
    { label: "Set % in Structure Settings (or edit manually)", done: percentagesConfigured },
    { label: "Save salary structure", done: !!run?.structureSaved },
    { label: "Go to Payroll runs to view & run", done: false, link: true },
  ];

  const componentColumns = settings
    ? [
        ...settings.earningComponents
          .filter((c: string) => c !== "Basic Salary")
          .map((c: string) => ({ key: `e:${c}`, label: c, align: "center" as const, render: (row: any) => row.earnings?.[c] ?? "—" })),
        ...settings.deductionComponents.map((c: string) => ({
          key: `d:${c}`,
          label: c,
          align: "center" as const,
          render: (row: any) => row.deductions?.[c] ?? "—",
        })),
      ]
    : [];

  const columns = [
    { key: "code", label: "Employee Code", render: (row: any) => row.employee?.employeeCode || "—" },
    { key: "name", label: "Name", render: (row: any) => row.employee?.name || "—" },
    { key: "costCenter", label: "Cost Center", render: (row: any) => row.costCenter || "—" },
    { key: "basic", label: "Basic Salary", align: "center" as const, render: (row: any) => row.earnings?.["Basic Salary"] ?? 0 },
    { key: "payDays", label: "Pay Days", align: "center" as const, render: (row: any) => row.payDays ?? "—" },
    { key: "totalWorkingDays", label: "Total Working Days", align: "center" as const, render: (row: any) => row.totalWorkingDays ?? "—" },
    ...componentColumns,
    { key: "gross", label: "Gross", align: "center" as const, render: (row: any) => (row.gross ? `₹${row.gross}` : "—") },
    {
      key: "actions",
      label: "",
      align: "center" as const,
      render: (row: any) => (
        <Button variant="ghost" size="sm" title="Edit salary structure" onClick={() => setEditRow(row)}>
          <Pencil size={14} />
        </Button>
      ),
    },
  ];

  if (loading && !client) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link to={`${basePath}/clients/${clientId}/payroll`} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-heading">Salary Structure</h1>
            <p className="mt-1 text-sm text-text-muted">Import each month's Excel, configure once, then review before payroll.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="month" value={month} onChange={(e: any) => setMonth(e.target.value)} />
          <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
            <Download size={15} /> Download template
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload size={15} /> Upload Excel
          </Button>
        </div>
      </div>

      <ClientIdentityCard client={client} />

      {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Employees" value={rows.length} sub={monthLabel(month)} accentBg="bg-brand-soft" accentText="text-brand" />
        <StatCard
          icon={ClipboardCheck}
          label="Structure status"
          value={run?.structureSaved ? "Saved" : rows.length > 0 ? "In progress" : "Not started"}
          sub={monthLabel(month)}
          accentBg={run?.structureSaved ? "bg-success-bg" : "bg-warning-bg"}
          accentText={run?.structureSaved ? "text-success" : "text-warning"}
        />
        <StatCard icon={TrendingUp} label="Total Gross" value={totalGross ? `₹${totalGross}` : "—"} sub="This month, all employees" accentBg="bg-surface-2" accentText="text-text" />
        <StatCard
          icon={PercentCircle}
          label="Components configured"
          value={percentagesConfigured ? "Yes" : "No"}
          sub="Via Structure Setting"
          accentBg={percentagesConfigured ? "bg-success-bg" : "bg-surface-2"}
          accentText={percentagesConfigured ? "text-success" : "text-text-muted"}
        />
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Steps for {monthLabel(month)}</p>
        <div className="flex flex-wrap items-center gap-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm">
              {s.done ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-text-muted" />}
              <span className={s.done ? "text-text" : "text-text-muted"}>{s.label}</span>
              {i < steps.length - 1 && <span className="ml-3 text-text-muted">→</span>}
            </div>
          ))}
        </div>
        {justSaved && (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/30 bg-success-bg px-3.5 py-2.5 text-sm text-success">
            <span>Structure complete for {monthLabel(month)} — ready for payroll.</span>
            <Button size="sm" onClick={() => navigate(`${basePath}/clients/${clientId}/payroll`)}>
              <Eye size={14} /> Go to View Payroll
            </Button>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <MapPin size={15} />
          <span>Cost Center for {monthLabel(month)} (applies to every employee below):</span>
        </div>
        <div className="flex items-center gap-2">
          <Input value={costCenterInput} onChange={(e: any) => setCostCenterInput(e.target.value)} placeholder="e.g. Head Office" />
          <Button variant="secondary" size="sm" onClick={handleApplyCostCenter} loading={costCenterSaving} disabled={rows.length === 0}>
            Apply to all
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={15} /> Structure Setting
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setComponentsOpen(true)}>
            Salary components
          </Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-text-muted" />
          <h2 className="text-lg font-semibold text-heading">Employees & salary structure</h2>
          <Badge variant="neutral">{rows.length}</Badge>
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={Upload}
            title={`No salary structure for ${monthLabel(month)} yet`}
            description="Download the template, have the client fill it in, then upload it here to get started."
          />
        ) : (
          <Table columns={columns} data={rows} keyField="_id" />
        )}
      </Card>

      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={() => setConfirmSaveOpen(true)} disabled={run?.structureSaved}>
            <ClipboardCheck size={15} /> {run?.structureSaved ? `Structure saved for ${monthLabel(month)}` : `Save structure for ${monthLabel(month)}`}
          </Button>
        </div>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        businessClientId={clientId}
        month={month}
        onImported={() => {
          setUploadOpen(false);
          loadStructure(month);
        }}
      />
      <ComponentsModal
        open={componentsOpen}
        onClose={() => setComponentsOpen(false)}
        settings={settings}
        businessClientId={clientId}
        onSaved={(saved: any) => {
          setSettings(saved);
          setComponentsOpen(false);
        }}
      />
      <StructureSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        firmSettings={firmSettings}
        businessClientId={clientId}
        month={month}
        onSaved={() => {
          setSettingsOpen(false);
          loadFirmSettings();
          loadStructure(month);
        }}
      />
      <EmployeeStructureModal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        row={editRow}
        settings={settings}
        businessClientId={clientId}
        month={month}
        onSaved={() => {
          setEditRow(null);
          loadStructure(month);
        }}
      />

      <Modal
        open={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        title="Save salary structure?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStructure} loading={saving}>
              Confirm & save
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          This locks in {monthLabel(month)}'s salary structure for {rows.length} employee{rows.length === 1 ? "" : "s"}. Payroll for
          this month can only be generated and run after this is saved. You can still come back and edit it later, but any
          previously generated payroll for this month will need to be regenerated.
        </p>
      </Modal>
    </div>
  );
}
