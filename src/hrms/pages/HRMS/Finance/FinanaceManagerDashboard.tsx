/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "@/api/axiosInstance";
import {
  FileCheck,
  Wallet,
  Receipt,
  Plane,
  Clock,
  ArrowRight,
  FileWarning,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { DonutChart, type DonutSlice } from "@/components/ui/donut-chart";
import { MultiTrendChart } from "@/components/ui/multi-trend-chart";
import { CategoryBarChart, type CategoryBarDatum } from "@/components/ui/category-bar-chart";

/* ================= TYPES ================= */

type PayrollStatus = "Draft" | "Processed" | "Paid" | "Rejected";
type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

interface PayrollRow {
  status: PayrollStatus;
  gross?: number;
  deduction?: number;
  net?: number;
}

interface ExpenseRow {
  amount: number;
  status: ClaimStatus;
  expenseType: string;
  date: string;
  createdAt: string;
}

interface TravelRow {
  budget: number;
  payable?: number;
  status: ClaimStatus;
  fromDate: string;
  destination: string;
  createdAt: string;
}

interface MonthBucket {
  ym: string;
  label: string;
}

/* ================= HELPERS ================= */

const formatINR = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const formatINRCompact = (n: number) =>
  `₹${new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0)}`;

const monthKey = (dateStr?: string) => (dateStr ? dateStr.slice(0, 7) : "");

const formatMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

function last6Months(currentYm: string): MonthBucket[] {
  const [y, m] = currentYm.split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(y, m - 1 - (5 - i), 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { ym, label: formatMonthLabel(ym) };
  });
}

/** Groups raw amounts by their category key, keeps the top N, folds the rest into "Other". */
function topCategories(rows: { key?: string; value: number }[], limit = 6): CategoryBarDatum[] {
  const totals = new Map<string, number>();
  rows.forEach(({ key, value }) => {
    const name = key?.trim() || "Uncategorized";
    totals.set(name, (totals.get(name) || 0) + value);
  });
  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, limit).map(([label, value]) => ({ label, value: Math.round(value) }));
  const rest = sorted.slice(limit).reduce((s, [, v]) => s + v, 0);
  if (rest > 0) top.push({ label: "Other", value: Math.round(rest) });
  return top;
}

/* ================= TONE HELPERS ================= */

const toneClasses: Record<string, string> = {
  primary: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]",
  good: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  warning: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  critical: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
  violet: "bg-[color-mix(in_oklab,#7C3AED_14%,transparent)] text-[#7C3AED]",
};

/* ================= DASHBOARD ================= */

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const months = useMemo(() => last6Months(new Date().toISOString().slice(0, 7)), []);

  const [payrollByMonth, setPayrollByMonth] = useState<Record<string, PayrollRow[]>>({});
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [travels, setTravels] = useState<TravelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      const [payrollResults, expenseRes, travelRes] = await Promise.all([
        Promise.all(
          months.map((m) =>
            axios
              .get(`/payroll`, { params: { month: m.ym } })
              .then((res) => [m.ym, res.data || []] as const)
              .catch(() => [m.ym, []] as const)
          )
        ),
        axios.get(`/expenses/all`),
        axios.get(`/travel-requests`),
      ]);

      const payrollMap: Record<string, PayrollRow[]> = {};
      payrollResults.forEach(([ym, rows]) => {
        payrollMap[ym] = rows;
      });

      setPayrollByMonth(payrollMap);
      setExpenses(expenseRes.data || []);
      setTravels(travelRes.data || []);
    } catch (err) {
      console.error("Finance Dashboard Error:", err);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  /* ================= REAL, DERIVED DATA ================= */

  const payrollTrend = useMemo(
    () =>
      months.map((m) => {
        const rows = payrollByMonth[m.ym] || [];
        return {
          ...m,
          rows,
          gross: rows.reduce((s, r) => s + (r.gross || 0), 0),
          net: rows.reduce((s, r) => s + (r.net || 0), 0),
        };
      }),
    [months, payrollByMonth]
  );
  const currentMonthPayroll = payrollTrend[payrollTrend.length - 1];

  const expensesByMonth = useMemo(
    () =>
      months.map((m) => {
        const rows = expenses.filter((e) => monthKey(e.date) === m.ym);
        return { ...m, count: rows.length, total: rows.reduce((s, e) => s + (e.amount || 0), 0) };
      }),
    [months, expenses]
  );
  const currentMonthExpenses = expensesByMonth[expensesByMonth.length - 1];

  const travelByMonth = useMemo(
    () =>
      months.map((m) => {
        const rows = travels.filter((t) => monthKey(t.fromDate) === m.ym);
        return {
          ...m,
          count: rows.length,
          total: rows.reduce((s, t) => s + (t.payable ?? t.budget ?? 0), 0),
        };
      }),
    [months, travels]
  );
  const currentMonthTravel = travelByMonth[travelByMonth.length - 1];

  const submissionSparkline = useMemo(
    () =>
      months.map(
        (m) =>
          expenses.filter((e) => monthKey(e.createdAt) === m.ym).length +
          travels.filter((t) => monthKey(t.createdAt) === m.ym).length
      ),
    [months, expenses, travels]
  );

  const pendingExpensesCount = expenses.filter((e) => e.status === "PENDING").length;
  const pendingTravelCount = travels.filter((t) => t.status === "PENDING").length;
  const pendingPayrollCount = currentMonthPayroll?.rows.filter((r) => r.status === "Processed").length || 0;
  const pendingApprovalsTotal = pendingExpensesCount + pendingTravelCount + pendingPayrollCount;

  const trendChartData = useMemo(
    () =>
      months.map((m, i) => ({
        label: m.label,
        payroll: Math.round(payrollTrend[i]?.net || 0),
        expenses: Math.round(expensesByMonth[i]?.total || 0),
        travel: Math.round(travelByMonth[i]?.total || 0),
      })),
    [months, payrollTrend, expensesByMonth, travelByMonth]
  );

  const payoutMixData: DonutSlice[] = useMemo(
    () =>
      [
        { label: "Payroll", value: Math.round(currentMonthPayroll?.net || 0), color: "var(--cat-1)" },
        { label: "Expenses", value: Math.round(currentMonthExpenses?.total || 0), color: "var(--cat-2)" },
        { label: "Travel", value: Math.round(currentMonthTravel?.total || 0), color: "var(--cat-3)" },
      ].filter((d) => d.value > 0),
    [currentMonthPayroll, currentMonthExpenses, currentMonthTravel]
  );

  const payrollStatusData: DonutSlice[] = useMemo(() => {
    const rows = currentMonthPayroll?.rows || [];
    return [
      { label: "Paid", value: rows.filter((r) => r.status === "Paid").length, color: "var(--status-good)" },
      { label: "Processed", value: rows.filter((r) => r.status === "Processed").length, color: "var(--status-warning)" },
      { label: "Draft", value: rows.filter((r) => r.status === "Draft").length, color: "var(--cat-2)" },
      { label: "Rejected", value: rows.filter((r) => r.status === "Rejected").length, color: "var(--status-critical)" },
    ].filter((d) => d.value > 0);
  }, [currentMonthPayroll]);

  const expenseStatusData: DonutSlice[] = useMemo(
    () =>
      [
        { label: "Paid", value: expenses.filter((e) => e.status === "PAID").length, color: "var(--status-good)" },
        { label: "Approved", value: expenses.filter((e) => e.status === "APPROVED").length, color: "var(--cat-2)" },
        { label: "Pending", value: expenses.filter((e) => e.status === "PENDING").length, color: "var(--status-warning)" },
        { label: "Rejected", value: expenses.filter((e) => e.status === "REJECTED").length, color: "var(--status-critical)" },
      ].filter((d) => d.value > 0),
    [expenses]
  );

  const travelStatusData: DonutSlice[] = useMemo(
    () =>
      [
        { label: "Paid", value: travels.filter((t) => t.status === "PAID").length, color: "var(--status-good)" },
        { label: "Approved", value: travels.filter((t) => t.status === "APPROVED").length, color: "var(--cat-2)" },
        { label: "Pending", value: travels.filter((t) => t.status === "PENDING").length, color: "var(--status-warning)" },
        { label: "Rejected", value: travels.filter((t) => t.status === "REJECTED").length, color: "var(--status-critical)" },
      ].filter((d) => d.value > 0),
    [travels]
  );

  const expenseCategoryData = useMemo(
    () => topCategories(expenses.map((e) => ({ key: e.expenseType, value: e.amount || 0 }))),
    [expenses]
  );

  const travelDestinationData = useMemo(
    () => topCategories(travels.map((t) => ({ key: t.destination, value: t.payable ?? t.budget ?? 0 }))),
    [travels]
  );

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <FileWarning className="h-8 w-8 text-[var(--status-critical)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const quickActions: {
    icon: React.ElementType;
    text: string;
    subtitle: string;
    tone: "primary" | "good" | "warning" | "critical" | "violet";
    onClick: () => void;
  }[] = [
    {
      icon: FileCheck,
      text: "Review Payroll",
      subtitle: "Verify and process payroll runs",
      tone: "primary",
      onClick: () => navigate("/hrms/finance/payroll/review"),
    },
    {
      icon: Receipt,
      text: "Expense Claims",
      subtitle: "Review and settle employee expenses",
      tone: "good",
      onClick: () => navigate("/hrms/finance/expenses"),
    },
    {
      icon: Plane,
      text: "Travel Requests",
      subtitle: "Approve and track travel advances",
      tone: "violet",
      onClick: () => navigate("/hrms/finance/travel/advances"),
    },
    {
      icon: FileCheck,
      text: "Statutory Reports",
      subtitle: "Generate compliance & tax reports",
      tone: "warning",
      onClick: () => navigate("/hrms/finance/statutory/reports"),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {firstName ? `${greeting}, ${firstName}` : "Finance Dashboard"} 👋
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Payroll, expenses & travel overview · {currentMonthPayroll?.label}
        </p>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Net payroll payout"
          value={formatINR(currentMonthPayroll?.net || 0)}
          icon={Wallet}
          tone="violet"
          size="compact"
          sublabel={`${currentMonthPayroll?.rows.length || 0} employees this month`}
          sparklineData={payrollTrend.map((t) => t.net)}
        />
        <StatCard
          label="Expense claims"
          value={formatINR(currentMonthExpenses?.total || 0)}
          icon={Receipt}
          tone="primary"
          size="compact"
          sublabel={`${currentMonthExpenses?.count || 0} claims this month`}
          sparklineData={expensesByMonth.map((m) => m.total)}
        />
        <StatCard
          label="Travel spend"
          value={formatINR(currentMonthTravel?.total || 0)}
          icon={Plane}
          tone="good"
          size="compact"
          sublabel={`${currentMonthTravel?.count || 0} trips this month`}
          sparklineData={travelByMonth.map((m) => m.total)}
        />
        <StatCard
          label="Pending approvals"
          value={pendingApprovalsTotal}
          icon={Clock}
          tone="warning"
          size="compact"
          sublabel="Expenses, travel & payroll awaiting you"
          sparklineData={submissionSparkline}
        />
      </div>

      {/* ================= TREND + PAYOUT MIX ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <DashboardPanel
          title="Financial trend"
          subtitle="Payroll, expenses & travel — last 6 months"
          className="lg:col-span-3"
        >
          <MultiTrendChart
            data={trendChartData}
            series={[
              { key: "payroll", label: "Payroll", color: "var(--cat-1)" },
              { key: "expenses", label: "Expenses", color: "var(--cat-2)" },
              { key: "travel", label: "Travel", color: "var(--cat-3)" },
            ]}
            formatValue={formatINRCompact}
          />
        </DashboardPanel>

        <DashboardPanel
          title="This month's payout mix"
          subtitle={`Where money moved · ${currentMonthPayroll?.label}`}
          className="lg:col-span-2"
        >
          {payoutMixData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No spend recorded yet this month
            </p>
          ) : (
            <DonutChart centerLabel="Total moved" data={payoutMixData} formatValue={formatINRCompact} unit="" />
          )}
        </DashboardPanel>
      </div>

      {/* ================= STATUS BREAKDOWNS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DashboardPanel title="Payroll status" subtitle={`${currentMonthPayroll?.label || ""} cycle breakdown`}>
          {payrollStatusData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No payroll records yet
            </p>
          ) : (
            <DonutChart centerLabel="Payrolls" data={payrollStatusData} unit="employees" />
          )}
        </DashboardPanel>

        <DashboardPanel title="Expense claims" subtitle="Reimbursement status, all-time">
          {expenseStatusData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No expense claims yet
            </p>
          ) : (
            <DonutChart centerLabel="Claims" data={expenseStatusData} unit="claims" />
          )}
        </DashboardPanel>

        <DashboardPanel title="Travel requests" subtitle="Advance approval status, all-time">
          {travelStatusData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No travel requests yet
            </p>
          ) : (
            <DonutChart centerLabel="Requests" data={travelStatusData} unit="requests" />
          )}
        </DashboardPanel>
      </div>

      {/* ================= CATEGORY BREAKDOWNS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardPanel title="Expense by category" subtitle="Top spending categories, all-time">
          {expenseCategoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No expense claims yet
            </p>
          ) : (
            <CategoryBarChart data={expenseCategoryData} color="var(--primary)" formatValue={formatINRCompact} />
          )}
        </DashboardPanel>

        <DashboardPanel title="Top travel destinations" subtitle="By approved spend, all-time">
          {travelDestinationData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No travel requests yet
            </p>
          ) : (
            <CategoryBarChart data={travelDestinationData} color="var(--cat-3)" formatValue={formatINRCompact} />
          )}
        </DashboardPanel>
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <DashboardPanel title="Quick Actions" subtitle="Jump to common finance workflows">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] p-4 text-left transition-colors hover:bg-[var(--muted)]"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[action.tone]}`}>
                <action.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[var(--foreground)]">
                  {action.text}
                </span>
                <span className="block truncate text-xs text-[var(--muted-foreground)]">
                  {action.subtitle}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
            </button>
          ))}
        </div>
      </DashboardPanel>
    </div>
  );
}
