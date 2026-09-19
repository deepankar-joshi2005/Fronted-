/** @format */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Download,
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Clock,
  Pencil,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
} from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { DonutChart, type DonutSlice } from "@/components/ui/donut-chart";
import { TrendChart } from "@/components/ui/trend-chart";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

type RunStatus = "Draft" | "Processing" | "Completed" | "Cancelled";

interface RunMeta {
  _id: string;
  month: string;
  title: string;
  frequency: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate?: string;
  status: RunStatus;
  generatedBy?: "Company" | "CA";
}

interface EntrySummary {
  employees: number;
  gross: number;
  deduction: number;
  net: number;
}

interface EntryRow {
  payrollId: string;
  employeeId: string;
  name: string;
  employeeCode?: string;
  status: string;
  basic: number;
  hra: number;
  otherAllowance: number;
  gross: number;
  deduction: number;
  net: number;
  payDays: number;
  lopDays: number;
  fullDays: number;
  lateFullDays: number;
  halfDays: number;
  lateHalfDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  perDayRate: number;
  overtimeHours: number;
  overtimeAmount: number;
  encashmentBonus: number;
  fixedDeductionAmount: number;
  lopDeductionAmount: number;
}

interface DetailResponse {
  run: RunMeta;
  summary: EntrySummary;
  entries: EntryRow[];
  isLivePreview?: boolean;
}

interface TrendPoint {
  month: string;
  gross: number;
  net: number;
  deduction: number;
  employees: number;
}

const sumField = (rows: Record<string, any>[], key: string) =>
  rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

const shortMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

const statusTone: Record<RunStatus, { bg: string; text: string }> = {
  Draft: { bg: "bg-[var(--muted)]", text: "text-[var(--muted-foreground)]" },
  Processing: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]",
    text: "text-[var(--status-warning)]",
  },
  Completed: {
    bg: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)]",
    text: "text-[var(--status-good)]",
  },
  Cancelled: {
    bg: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)]",
    text: "text-[var(--status-critical)]",
  },
};

const AVATAR_COLORS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const monthYearLabel = (month?: string) => {
  if (!month) return "";
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const hashCode = (s: string) => s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
const avatarColor = (name: string) => AVATAR_COLORS[hashCode(name) % AVATAR_COLORS.length];

function Metric({
  label,
  value,
  tone = "default",
  bold = false,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "critical" | "primary";
  bold?: boolean;
}) {
  const toneClass = {
    default: "text-[var(--foreground)]",
    good: "text-[var(--status-good)]",
    critical: "text-[var(--status-critical)]",
    primary: "text-[var(--primary)]",
  }[tone];
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className={cn("text-sm", bold ? "font-bold" : "font-medium", toneClass)}>{value}</p>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1 text-sm",
        bold && "mt-2 border-t border-[var(--border)] pt-2 font-bold text-[var(--foreground)]"
      )}
    >
      <span className={cn(!bold && "text-[var(--muted-foreground)]")}>{label}</span>
      <span className={cn(!bold && "font-medium text-[var(--foreground)]")}>{value}</span>
    </div>
  );
}

const chipTone: Record<string, { bg: string; text: string }> = {
  muted: { bg: "bg-[var(--muted)]", text: "text-[var(--foreground)]" },
  good: { bg: "bg-[color-mix(in_oklab,var(--status-good)_12%,transparent)]", text: "text-[var(--status-good)]" },
  critical: {
    bg: "bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)]",
    text: "text-[var(--status-critical)]",
  },
  warning: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)]",
    text: "text-[var(--status-warning)]",
  },
  primary: { bg: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]", text: "text-[var(--primary)]" },
};

function Chip({ label, value, tone }: { label: string; value: string | number; tone: keyof typeof chipTone }) {
  const t = chipTone[tone];
  return (
    <div className={cn("rounded-lg py-2 text-center", t.bg)}>
      <p className={cn("text-sm font-bold", t.text)}>{value}</p>
      <p className="text-[10px] text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}

const PayrollRunDetail = () => {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ payPeriodStart: "", payPeriodEnd: "", payDate: "" });
  const [savingSchedule, setSavingSchedule] = useState(false);

  const backPath = location.pathname.replace(/\/[^/]+$/, "");

  const fetchDetail = async () => {
    if (!month) return;
    try {
      const res = await axios.get(`${API_BASE}/payroll/runs/${month}`, { headers });
      setData(res.data);
      setNotFound(false);
    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const daysInMonth = useMemo(() => {
    if (!month) return 30;
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }, [month]);

  /* ================= 6-MONTH TREND (ending at this run's month) ================= */
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;

    const loadTrend = async () => {
      const [y, m] = data.run.month.split("-").map(Number);
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(y, m - 1 - (5 - i), 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      });

      const points = await Promise.all(
        months.map(async (mo): Promise<TrendPoint> => {
          if (mo === data.run.month) {
            return {
              month: mo,
              gross: data.summary.gross,
              net: data.summary.net,
              deduction: data.summary.deduction,
              employees: data.summary.employees,
            };
          }
          try {
            const res = await axios.get(`${API_BASE}/payroll?month=${mo}`, { headers });
            const rows = res.data || [];
            return {
              month: mo,
              gross: sumField(rows, "gross"),
              net: sumField(rows, "net"),
              deduction: sumField(rows, "deduction"),
              employees: rows.length,
            };
          } catch {
            return { month: mo, gross: 0, net: 0, deduction: 0, employees: 0 };
          }
        })
      );

      if (!cancelled) setTrend(points);
    };

    loadTrend();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.run.month, data?.summary.gross]);

  const trendChartData = useMemo(() => trend.map((t) => ({ label: shortMonthLabel(t.month), value: t.gross })), [trend]);

  const employeeTrendSparkline = useMemo(() => trend.map((t) => t.employees), [trend]);
  const grossTrendSparkline = useMemo(() => trend.map((t) => t.gross), [trend]);
  const deductionTrendSparkline = useMemo(() => trend.map((t) => t.deduction), [trend]);
  const netTrendSparkline = useMemo(() => trend.map((t) => t.net), [trend]);

  const breakdownData: DonutSlice[] = useMemo(() => {
    if (!data) return [];
    const overtime = sumField(data.entries, "overtimeAmount");
    const encashment = sumField(data.entries, "encashmentBonus");
    const base = Math.max(data.summary.gross - overtime - encashment, 0);
    const fixedDeduction = sumField(data.entries, "fixedDeductionAmount");
    const lopDeduction = sumField(data.entries, "lopDeductionAmount");
    const otherDeduction = Math.max(data.summary.deduction - fixedDeduction - lopDeduction, 0);

    const slices: DonutSlice[] = [{ label: "Base Salary", value: Math.round(base), color: "var(--cat-1)" }];
    if (overtime > 0) slices.push({ label: "Overtime", value: Math.round(overtime), color: "var(--cat-3)" });
    if (encashment > 0)
      slices.push({ label: "Leave Encashment", value: Math.round(encashment), color: "var(--cat-2)" });
    if (fixedDeduction > 0)
      slices.push({ label: "Fixed Deductions", value: Math.round(fixedDeduction), color: "var(--status-critical)" });
    if (lopDeduction > 0)
      slices.push({ label: "Loss of Pay", value: Math.round(lopDeduction), color: "var(--cat-5)" });
    if (otherDeduction > 0)
      slices.push({ label: "Other Deductions", value: Math.round(otherDeduction), color: "var(--cat-other)" });
    return slices;
  }, [data]);

  const canGenerate = data?.run.status === "Completed";

  const generatePayslips = async () => {
    if (!month) return;
    setGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/payslips/generate-from-payroll`, { month }, { headers });
      toast({
        type: "success",
        title: "Payslips Generated",
        message: res.data?.message || "Payslips generated successfully.",
      });
    } catch (error: any) {
      toast({
        type: "error",
        title: "Generation Failed",
        message: error?.response?.data?.message || "Failed to generate payslips.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const openScheduleModal = () => {
    if (!data) return;
    setScheduleForm({
      payPeriodStart: data.run.payPeriodStart,
      payPeriodEnd: data.run.payPeriodEnd,
      payDate: data.run.payDate || "",
    });
    setScheduleModalOpen(true);
  };

  const saveSchedule = async () => {
    if (!month) return;
    setSavingSchedule(true);
    try {
      await axios.patch(`${API_BASE}/payroll/runs/${month}/schedule`, scheduleForm, { headers });
      toast({ type: "success", title: "Schedule Updated", message: "Pay period and pay date updated." });
      setScheduleModalOpen(false);
      fetchDetail();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Update Failed",
        message: error?.response?.data?.message || "Please try again.",
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">Payroll run not found for this month.</p>
        <button
          onClick={() => navigate(backPath)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  const { run, summary, entries, isLivePreview } = data;
  const tone = statusTone[run.status];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {monthYearLabel(run.month)} Payroll
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Payroll entries, earnings, and deductions for this run.
          </p>
          {isLivePreview && (
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
              Live estimate from attendance recorded 1–{new Date().getDate()} this month — updates until Run Payroll
              is clicked
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            title={canGenerate ? "Generate Payslips" : "Available once payroll is Completed"}
            onClick={generatePayslips}
            disabled={!canGenerate || generating}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Generate Payslips
          </button>
          <button
            onClick={() => navigate(backPath)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Employees"
          value={summary.employees}
          icon={Users}
          tone="primary"
          sublabel="In this run"
          sparklineData={employeeTrendSparkline}
        />
        <StatCard
          label="Gross Pay"
          value={currency(summary.gross)}
          icon={TrendingUp}
          tone="good"
          sublabel="Before deductions"
          sparklineData={grossTrendSparkline}
        />
        <StatCard
          label="Total Deductions"
          value={currency(summary.deduction)}
          icon={TrendingDown}
          tone="critical"
          sublabel="Withheld amount"
          sparklineData={deductionTrendSparkline}
        />
        <StatCard
          label="Net Pay"
          value={currency(summary.net)}
          icon={Wallet}
          tone="violet"
          sublabel="Take-home amount"
          sparklineData={netTrendSparkline}
        />
      </div>

      {/* TREND + BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <DashboardPanel
          title="Payroll Trend"
          subtitle="Gross payroll over the last 6 months"
          className="lg:col-span-3"
        >
          <TrendChart data={trendChartData} color="var(--primary)" unit="gross pay" />
        </DashboardPanel>

        <DashboardPanel title="Payroll Breakdown" subtitle="This run's overview" className="lg:col-span-2">
          {breakdownData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No payroll data for this run yet
            </p>
          ) : (
            <DonutChart centerLabel="Total Gross" data={breakdownData} />
          )}
        </DashboardPanel>
      </div>

      {/* INFO BAR */}
      <div className="card-premium shadow-premium-sm flex flex-col gap-4 border-l-4 border-l-[var(--status-good)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Pay Period</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-[var(--foreground)]">
              <CalendarDays className="h-4 w-4 text-[var(--muted-foreground)]" />
              {run.payPeriodStart} <span className="text-[var(--muted-foreground)]">→</span> {run.payPeriodEnd}
              <button
                title="Edit"
                onClick={openScheduleModal}
                className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Pay Date</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-[var(--foreground)]">
              <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
              {run.payDate || <span className="italic text-[var(--muted-foreground)]">Not set</span>}
              <button
                title="Edit"
                onClick={openScheduleModal}
                className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
            {run.frequency}
          </span>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", tone.bg, tone.text)}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {run.status}
          </span>
          {run.generatedBy === "CA" && (
            <span
              title="Run by the CA firm on this company's behalf"
              className="rounded-full bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] px-3 py-1 text-xs font-medium text-[var(--primary)]"
            >
              Generated by CA
            </span>
          )}
        </div>
      </div>

      {/* PAYROLL CALCULATION REFERENCE */}
      <div className="rounded-xl border border-[color-mix(in_oklab,var(--status-good)_25%,transparent)] bg-[color-mix(in_oklab,var(--status-good)_6%,transparent)] p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--status-good)]">
          <FileText className="h-4 w-4" /> Payroll Calculation Reference
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-[var(--card)] p-3">
            <p className="text-xs font-semibold text-[var(--foreground)]">Gross Pay</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              Total Earnings - LOP Deduction - Unpaid Leave + Overtime
            </p>
          </div>
          <div className="rounded-lg bg-[var(--card)] p-3">
            <p className="text-xs font-semibold text-[var(--foreground)]">Net Pay</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              Gross Pay - Total Component Deductions
            </p>
          </div>
          <div className="rounded-lg bg-[var(--card)] p-3">
            <p className="text-xs font-semibold text-[var(--foreground)]">LOP Deduction</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              (Basic Salary ÷ Working Days) × LOP Days
            </p>
          </div>
        </div>
      </div>

      {/* EMPLOYEE PAYROLL ENTRIES */}
      <div className="card-premium shadow-premium-sm p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Employee Payroll Entries</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{entries.length} employees in this payroll run</p>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {entries.map((e) => {
            const expanded = expandedId === e.payrollId;
            const workingDays = daysInMonth - (e.weeklyOffDays + e.holidayDays);
            const present = e.fullDays + e.lateFullDays + 0.5 * (e.halfDays + e.lateHalfDays);

            return (
              <div key={e.payrollId} className="py-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex min-w-[200px] items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ backgroundColor: avatarColor(e.name) }}
                    >
                      {initials(e.name)}
                    </span>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{e.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Basic: {currency(e.basic)}</p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
                    <Metric label="Working Days" value={workingDays} />
                    <Metric label="Present" value={present.toFixed(2)} tone="good" />
                    <Metric label="LOP" value={e.lopDays.toFixed(2)} tone="critical" />
                    <Metric label="Gross Pay" value={currency(e.gross)} tone="good" bold />
                    <Metric label="Deductions" value={currency(e.deduction)} tone="critical" bold />
                    <Metric label="Net Pay" value={currency(e.net)} tone="primary" bold />

                    <button
                      onClick={() => setExpandedId(expanded ? null : e.payrollId)}
                      className="flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
                    >
                      {expanded ? "Less" : "Details"}
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border-l-4 border-l-[var(--status-good)] bg-[var(--muted)] p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--status-good)]">Earnings</p>
                      <Row label="Basic Salary" value={currency(e.basic)} />
                      <Row label="Component Earnings" value={currency(e.hra + e.otherAllowance)} />
                      {e.overtimeAmount > 0 && <Row label="Overtime" value={currency(e.overtimeAmount)} />}
                      {e.encashmentBonus > 0 && <Row label="Leave Encashment" value={currency(e.encashmentBonus)} />}
                      <Row label="Gross Pay" value={currency(e.gross)} bold />
                    </div>

                    <div className="rounded-lg border-l-4 border-l-[var(--status-critical)] bg-[var(--muted)] p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--status-critical)]">
                        Deductions
                      </p>
                      <Row label={`LOP Deduction (${e.lopDays.toFixed(2)} days)`} value={currency(e.lopDeductionAmount)} />
                      <Row label="Component Deductions" value={currency(e.fixedDeductionAmount)} />
                      <Row label="Net Pay" value={currency(e.net)} bold />
                    </div>

                    <div className="lg:col-span-2">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                        Attendance Summary
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        <Chip label="Working Days" value={workingDays} tone="muted" />
                        <Chip label="Present Days" value={present.toFixed(2)} tone="good" />
                        <Chip label="LOP Days" value={e.lopDays.toFixed(2)} tone="critical" />
                        <Chip label="Unpaid Leave" value={e.unpaidLeaveDays} tone="warning" />
                        <Chip label="OT Hours" value={e.overtimeHours} tone="primary" />
                        <Chip label="OT Amount" value={currency(e.overtimeAmount)} tone="primary" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {entries.length === 0 && (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No employee payroll entries for this run yet.
            </p>
          )}
        </div>
      </div>

      {/* SCHEDULE EDIT MODAL */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-premium-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Pay Period &amp; Pay Date</h2>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Pay Period Start</label>
                <input
                  type="date"
                  value={scheduleForm.payPeriodStart}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, payPeriodStart: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Pay Period End</label>
                <input
                  type="date"
                  value={scheduleForm.payPeriodEnd}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, payPeriodEnd: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)]">Pay Date</label>
                <input
                  type="date"
                  value={scheduleForm.payDate}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, payDate: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                disabled={savingSchedule}
                className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {savingSchedule ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollRunDetail;
