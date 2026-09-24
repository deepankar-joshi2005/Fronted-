import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Eye, Play, ClipboardList, Users, Wallet, FileClock, TrendingUp, CalendarClock, IdCard, Banknote } from "lucide-react";
import * as businessClientApi from "../../../api/businessClient.api.js";
import * as payrollApi from "../../../api/clientPayroll.api";
import { useAuth } from "../../../hooks/useAuth";
import ClientIdentityCard from "../../../components/payroll/ClientIdentityCard.jsx";
import Button from "../../../components/ui/Button.jsx";
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

const STATUS_VARIANT: Record<string, string> = { Draft: "neutral", Generated: "warning", Completed: "success" };
const STATUS_BORDER: Record<string, string> = { Draft: "border-l-border", Generated: "border-l-warning", Completed: "border-l-success" };

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

// ── Main page ────────────────────────────────────────────────────────────────

export default function ClientPayrollPage() {
  const { clientId } = useParams();
  const { basePath } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [deductionComponents, setDeductionComponents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyMonth, setBusyMonth] = useState<string | null>(null);
  const [confirmRunMonth, setConfirmRunMonth] = useState<string | null>(null);

  async function loadAll() {
    if (!clientId) return;
    setLoading(true);
    try {
      const [clientRes, runsRes, settingsRes] = await Promise.all([
        businessClientApi.getBusinessClient(clientId),
        payrollApi.listClientPayrollRuns(clientId),
        payrollApi.getPayrollSettings(clientId),
      ]);
      setClient(clientRes.data.data);
      setRuns(runsRes.data.data);
      setDeductionComponents(settingsRes.data.data?.deductionComponents || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleRun(month: string) {
    setBusyMonth(month);
    try {
      await payrollApi.runClientPayroll(clientId!, month);
      await loadAll();
    } finally {
      setBusyMonth(null);
    }
  }

  async function handleExport(month: string) {
    const { data } = await payrollApi.exportClientPayrollRun(clientId!, month);
    downloadBlob(data, `${client?.name || "client"}_Payroll_${month}.xlsx`);
  }

  const runColumns = [
    { key: "month", label: "Month", render: (r: any) => <span className="font-medium text-text">{monthLabel(r.month)}</span> },
    { key: "status", label: "Status", render: (r: any) => <Badge variant={STATUS_VARIANT[r.status] as any}>{r.status}</Badge> },
    {
      key: "structureSaved",
      label: "Structure",
      align: "center" as const,
      render: (r: any) => (r.structureSaved ? <Badge variant="success">Saved</Badge> : <Badge variant="warning">Not saved</Badge>),
    },
    { key: "employeeCount", label: "Employees", align: "center" as const },
    ...deductionComponents.map((c) => ({
      key: `ded:${c}`,
      label: c,
      align: "center" as const,
      render: (r: any) => (r.deductionTotals?.[c] ? `₹${r.deductionTotals[c]}` : "—"),
    })),
    { key: "totalNet", label: "Total Net", align: "center" as const, render: (r: any) => (r.totalNet ? `₹${r.totalNet}` : "—") },
    {
      key: "actions",
      label: "",
      render: (r: any) => (
        <div className="flex flex-nowrap items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="View"
            onClick={() => navigate(`${basePath}/clients/${clientId}/payroll/${r.month}`)}
          >
            <Eye size={14} />
          </Button>
          {r.status === "Generated" && (
            <Button variant="ghost" size="sm" title="Run payroll" onClick={() => setConfirmRunMonth(r.month)} loading={busyMonth === r.month}>
              <Play size={14} />
            </Button>
          )}
          {r.status !== "Draft" && (
            <Button variant="ghost" size="sm" title="Export" onClick={() => handleExport(r.month)}>
              <Download size={14} />
            </Button>
          )}
          {r.status !== "Draft" && (
            <Button
              variant="ghost"
              size="sm"
              title="Payment File"
              onClick={() => navigate(`${basePath}/clients/${clientId}/payroll/${r.month}/payment-file`)}
            >
              <Banknote size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  const thisMonth = currentMonth();
  const thisMonthRun = runs.find((r) => r.month === thisMonth);
  const latestCompletedRun = runs.find((r) => r.status === "Completed");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link to={`${basePath}/clients`} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Wallet size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-heading">{client?.name} — Payroll</h1>
              <p className="mt-1 text-sm text-text-muted">Excel-based payroll — this client doesn't use HRMS.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(`${basePath}/clients/${clientId}/employee-details`)}>
            <IdCard size={15} /> Employee Details
          </Button>
          <Button variant="brand" size="sm" onClick={() => navigate(`${basePath}/clients/${clientId}/salary-structure`)}>
            <ClipboardList size={15} /> Salary Structure
          </Button>
        </div>
      </div>

      <ClientIdentityCard client={client} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Employees this month"
          value={thisMonthRun?.employeeCount ?? 0}
          sub={monthLabel(thisMonth)}
          accentBg="bg-brand-soft"
          accentText="text-brand"
        />
        <StatCard icon={FileClock} label="Payroll Runs" value={runs.length} sub="Total months on record" accentBg="bg-surface-2" accentText="text-text" />
        <StatCard
          icon={CalendarClock}
          label="This Month"
          value={thisMonthRun ? thisMonthRun.status : "Not started"}
          sub={monthLabel(thisMonth)}
          accentBg={thisMonthRun?.status === "Completed" ? "bg-success-bg" : "bg-warning-bg"}
          accentText={thisMonthRun?.status === "Completed" ? "text-success" : "text-warning"}
        />
        <StatCard
          icon={TrendingUp}
          label="Latest Net Pay"
          value={latestCompletedRun ? `₹${latestCompletedRun.totalNet}` : "—"}
          sub={latestCompletedRun ? monthLabel(latestCompletedRun.month) : "No completed run yet"}
          accentBg="bg-success-bg"
          accentText="text-success"
        />
      </div>

      <Card className={`flex flex-col gap-4 border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between ${STATUS_BORDER[thisMonthRun?.status || "Draft"]}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{monthLabel(thisMonth)}</p>
          <p className="mt-1 text-sm text-text">
            {thisMonthRun
              ? `${thisMonthRun.employeeCount} employee${thisMonthRun.employeeCount === 1 ? "" : "s"} in this month's run.`
              : "No salary structure yet for this month."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {thisMonthRun && <Badge variant={STATUS_VARIANT[thisMonthRun.status] as any}>{thisMonthRun.status}</Badge>}
          {thisMonthRun ? (
            <Button variant="secondary" size="sm" onClick={() => navigate(`${basePath}/clients/${clientId}/payroll/${thisMonth}`)}>
              <Eye size={14} /> View
            </Button>
          ) : (
            <Button variant="brand" size="sm" onClick={() => navigate(`${basePath}/clients/${clientId}/salary-structure`)}>
              <ClipboardList size={14} /> Set up Salary Structure
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileClock size={16} className="text-text-muted" />
          <h2 className="text-lg font-semibold text-heading">Payroll runs</h2>
        </div>
        {runs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No salary structure yet"
            description="Set up this client's Salary Structure for a month to get started."
            action={
              <Button variant="brand" size="sm" onClick={() => navigate(`${basePath}/clients/${clientId}/salary-structure`)}>
                <ClipboardList size={14} /> Salary Structure
              </Button>
            }
          />
        ) : (
          <Table columns={runColumns} data={runs} keyField="_id" />
        )}
      </Card>

      <Modal
        open={!!confirmRunMonth}
        onClose={() => setConfirmRunMonth(null)}
        title="Confirm payroll run"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRunMonth(null)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              onClick={async () => {
                const month = confirmRunMonth!;
                setConfirmRunMonth(null);
                await handleRun(month);
              }}
              loading={busyMonth === confirmRunMonth}
            >
              Confirm & run payroll
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          Have you reviewed {confirmRunMonth ? monthLabel(confirmRunMonth) : "this month's"} payroll carefully — salary
          structure, pay days and net amounts for every employee? Running payroll finalizes it and it can no longer be
          regenerated.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => {
            navigate(`${basePath}/clients/${clientId}/payroll/${confirmRunMonth}`);
            setConfirmRunMonth(null);
          }}
        >
          <Eye size={14} /> View payroll first
        </Button>
      </Modal>
    </div>
  );
}
