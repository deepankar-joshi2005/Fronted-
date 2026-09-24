import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  UploadCloud,
  Play,
  Calculator,
  Download,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Banknote,
} from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import * as payrollApi from "../../../api/clientPayroll.api";
import { useAuth } from "../../../hooks/useAuth";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Modal from "../../../components/ui/Modal.jsx";
import Spinner from "../../../components/ui/Spinner.jsx";

const STATUS_VARIANT: Record<string, string> = { Draft: "neutral", Generated: "warning", Completed: "success" };
const STATUS_BORDER: Record<string, string> = { Draft: "border-l-border", Generated: "border-l-warning", Completed: "border-l-success" };

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const initials = (name: string) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

const AVATAR_COLORS = ["#6366F1", "#0EA5E9", "#F59E0B", "#10B981", "#EC4899"];
const hashCode = (s: string) => s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
const avatarColor = (name: string) => AVATAR_COLORS[hashCode(name || "") % AVATAR_COLORS.length];

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

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${bold ? "mt-2 border-t border-border pt-2 font-bold text-text" : ""}`}>
      <span className={!bold ? "text-text-muted" : ""}>{label}</span>
      <span className={!bold ? "font-medium text-text" : ""}>{value}</span>
    </div>
  );
}

export default function ClientPayrollRunDetailPage() {
  const { clientId, month } = useParams();
  const { basePath } = useAuth();
  const navigate = useNavigate();

  const [client, setClient] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [run, setRun] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRun, setConfirmRun] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!clientId || !month) return;
    setLoading(true);
    try {
      const [clientRes, settingsRes, detailRes] = await Promise.all([
        businessClientApi.getBusinessClient(clientId),
        payrollApi.getPayrollSettings(clientId),
        payrollApi.getClientPayrollRunDetail(clientId, month),
      ]);
      setClient(clientRes.data.data);
      setSettings(settingsRes.data.data);
      setRun(detailRes.data.data.run);
      setEntries(detailRes.data.data.entries);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, month]);

  async function handleRun() {
    setBusy(true);
    try {
      await payrollApi.runClientPayroll(clientId!, month!);
      setConfirmRun(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    const { data } = await payrollApi.exportClientPayrollRun(clientId!, month!);
    downloadBlob(data, `${client?.name || "client"}_Payroll_${month}.xlsx`);
  }

  async function handleDownloadPayslip(employeeId: string, employeeName: string) {
    const { data } = await payrollApi.downloadEmployeePayslip(clientId!, month!, employeeId);
    downloadBlob(data, `${employeeName}_${month}_Payslip.pdf`);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-text-muted">Payroll run not found for this month.</p>
        <Link to={`${basePath}/clients/${clientId}/payroll`}>
          <Button variant="secondary" size="sm">
            <ArrowLeft size={15} /> Back
          </Button>
        </Link>
      </div>
    );
  }

  const generated = run.status !== "Draft";
  const earningComponents: string[] = settings?.earningComponents || [];
  const deductionComponents: string[] = settings?.deductionComponents || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading">{monthLabel(run.month)} Payroll</h1>
          <p className="mt-1 text-sm text-text-muted">
            {client?.name} — payroll entries, earnings and deductions for this run.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {run.status === "Generated" && (
            <Button variant="brand" size="sm" onClick={() => setConfirmRun(true)}>
              <Play size={15} /> Run payroll
            </Button>
          )}
          {generated && (
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={15} /> Export
            </Button>
          )}
          {generated && (
            <Link to={`${basePath}/clients/${clientId}/payroll/${month}/payment-file`}>
              <Button variant="secondary" size="sm">
                <Banknote size={15} /> Payment File
              </Button>
            </Link>
          )}
          <Link to={`${basePath}/clients/${clientId}/payroll`}>
            <Button variant="secondary" size="sm">
              <ArrowLeft size={15} /> Back
            </Button>
          </Link>
        </div>
      </div>

      {error && <div className="rounded-lg border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-sm text-danger">{error}</div>}
      {run.status === "Draft" && !run.structureSaved && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/30 bg-warning-bg px-3.5 py-2.5 text-sm text-warning">
          <span>This month's Salary Structure hasn't been saved yet — save it to generate payroll numbers.</span>
          <Link to={`${basePath}/clients/${clientId}/salary-structure`}>
            <Button size="sm" variant="secondary">
              <ClipboardList size={14} /> Go to Salary Structure
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Employees" value={run.employeeCount || 0} sub="In this run" accentBg="bg-brand-soft" accentText="text-brand" />
        <StatCard
          icon={TrendingUp}
          label="Gross Pay"
          value={generated ? currency(run.totalGross) : "—"}
          sub={generated ? "Before deductions" : "Not generated yet"}
          accentBg="bg-success-bg"
          accentText="text-success"
        />
        <StatCard
          icon={TrendingDown}
          label="Total Deductions"
          value={generated ? currency(run.totalDeduction) : "—"}
          sub={generated ? "Withheld amount" : "Not generated yet"}
          accentBg="bg-danger-bg"
          accentText="text-danger"
        />
        <StatCard
          icon={Wallet}
          label="Net Pay"
          value={generated ? currency(run.totalNet) : "—"}
          sub={generated ? "Take-home amount" : "Not generated yet"}
          accentBg="bg-brand-soft"
          accentText="text-brand"
        />
      </div>

      <Card className={`flex flex-col gap-4 border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between ${STATUS_BORDER[run.status]}`}>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Uploaded</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-text">
              <UploadCloud size={15} className="text-text-muted" />
              {formatDate(run.uploadedAt) || "—"}
              {run.uploadedBy?.name && <span className="text-text-muted">by {run.uploadedBy.name}</span>}
            </div>
          </div>
          {run.generatedAt && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Generated</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-text">
                <Calculator size={15} className="text-text-muted" />
                {formatDate(run.generatedAt)}
              </div>
            </div>
          )}
          {run.runAt && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Run</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-text">
                <Calendar size={15} className="text-text-muted" />
                {formatDate(run.runAt)}
                {run.runBy?.name && <span className="text-text-muted">by {run.runBy.name}</span>}
              </div>
            </div>
          )}
        </div>
        <Badge variant={STATUS_VARIANT[run.status] as any}>{run.status}</Badge>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-heading">Employee Payroll Entries</h2>
          <p className="text-sm text-text-muted">{entries.length} employees in this payroll run</p>
        </div>

        <div className="divide-y divide-border">
          {entries.map((e) => {
            const expanded = expandedId === e._id;
            const name = e.employee?.name || "—";
            const earnings = e.earnings || {};
            const deductions = e.deductions || {};

            return (
              <div key={e._id} className="py-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex min-w-[200px] items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: avatarColor(name) }}
                    >
                      {initials(name)}
                    </span>
                    <div>
                      <p className="font-medium text-text">{name}</p>
                      <p className="text-xs text-text-muted">{e.employee?.employeeCode}</p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">Pay Days</p>
                      <p className="text-sm font-medium text-text">{e.payDays}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">LOP Days</p>
                      <p className="text-sm font-medium text-danger">{e.lopDays}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">Gross Pay</p>
                      <p className="text-sm font-bold text-success">{currency(e.gross)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">Deductions</p>
                      <p className="text-sm font-bold text-danger">{generated ? currency(e.totalDeduction) : "—"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wide text-text-muted">Net Pay</p>
                      <p className="text-sm font-bold text-brand">{generated ? currency(e.net) : "—"}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedId(expanded ? null : e._id)}
                        className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                      >
                        {expanded ? "Less" : "Details"}
                        {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      {run.status === "Completed" && (
                        <button
                          title="Download payslip"
                          onClick={() => handleDownloadPayslip(e.clientEmployeeId, name)}
                          className="rounded-lg p-1.5 text-brand transition-colors hover:bg-brand-soft"
                        >
                          <Download size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-lg border-l-4 border-l-success bg-surface-2 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-success">Earnings</p>
                      {earningComponents.map((c) => (
                        <Row key={c} label={c} value={currency(earnings[c] ?? 0)} />
                      ))}
                      <Row label="Gross Pay" value={currency(e.gross)} bold />
                    </div>

                    <div className="rounded-lg border-l-4 border-l-danger bg-surface-2 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-danger">Deductions</p>
                      {deductionComponents.map((c) => (
                        <Row key={c} label={c} value={currency(deductions[c] ?? 0)} />
                      ))}
                      <Row label="Total Deductions" value={generated ? currency(e.totalDeduction) : "—"} bold />
                      <Row label="Net Pay" value={generated ? currency(e.net) : "—"} bold />
                    </div>

                    <div className="rounded-lg border-l-4 border-l-brand bg-surface-2 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-brand">Employer Contribution</p>
                      <Row label="Employer PF" value={currency(e.employerPf ?? 0)} />
                      <Row label="Employer ESI" value={currency(e.employerEsi ?? 0)} />
                      <p className="mt-2 text-xs text-text-muted">Employer's own cost — not deducted from the employee.</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {entries.length === 0 && <p className="py-8 text-center text-sm text-text-muted">No employee payroll entries for this run yet.</p>}
        </div>
      </Card>

      <Modal
        open={confirmRun}
        onClose={() => setConfirmRun(false)}
        title="Confirm payroll run"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRun(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleRun} loading={busy}>
              Confirm & run payroll
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          Have you reviewed {monthLabel(run.month)}'s payroll carefully — salary structure, pay days and net amounts
          for every employee above? Running payroll finalizes it and it can no longer be regenerated.
        </p>
      </Modal>
    </div>
  );
}
