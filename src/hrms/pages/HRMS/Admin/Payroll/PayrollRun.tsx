/** @format */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  FileText,
  PlayCircle,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

type RunStatus = "Draft" | "Processing" | "Completed" | "Cancelled";

interface PayrollRunRow {
  _id: string;
  month: string; // YYYY-MM
  title: string;
  frequency: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate?: string;
  status: RunStatus;
  employees: number;
  gross: number;
  deduction: number;
  net: number;
  isLivePreview?: boolean;
  generatedBy?: "Company" | "CA";
}

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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const monthYearLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const TABS: { key: "All" | RunStatus; label: string; icon: React.ElementType }[] = [
  { key: "All", label: "All", icon: LayoutGrid },
  { key: "Draft", label: "Draft", icon: FileText },
  { key: "Processing", label: "Processing", icon: PlayCircle },
  { key: "Completed", label: "Completed", icon: CheckCircle2 },
  { key: "Cancelled", label: "Cancelled", icon: XCircle },
];

const PayrollRun = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [runs, setRuns] = useState<PayrollRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [generatingMonth, setGeneratingMonth] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState(new Date(`${currentMonth}-01`).getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | RunStatus>("All");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const fetchRuns = async () => {
    try {
      const res = await axios.get(`${API_BASE}/payroll/runs`, { headers });
      setRuns(res.data || []);
    } catch (err) {
      console.error(err);
      toast({ type: "error", title: "Failed to Load", message: "Could not fetch payroll runs." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRun = useMemo(() => runs.find((r) => r.month === currentMonth), [runs, currentMonth]);
  const canRunCurrentMonth = !currentRun || currentRun.status === "Draft" || currentRun.status === "Cancelled";

  const runCurrentMonth = async () => {
    setRunning(true);
    try {
      await axios.post(`${API_BASE}/payroll/runs/${currentMonth}/run`, {}, { headers });
      toast({
        type: "success",
        title: "Payroll Processed",
        message: `Payroll run started for ${monthYearLabel(currentMonth)}.`,
      });
      fetchRuns();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Run Failed",
        message: error?.response?.data?.message || "Please try again.",
      });
    } finally {
      setRunning(false);
    }
  };

  const generatePayslips = async (row: PayrollRunRow) => {
    setGeneratingMonth(row.month);
    try {
      const res = await axios.post(
        `${API_BASE}/payslips/generate-from-payroll`,
        { month: row.month },
        { headers }
      );
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
      setGeneratingMonth(null);
    }
  };

  const counts = useMemo(() => {
    const base: Record<"All" | RunStatus, number> = {
      All: runs.length,
      Draft: 0,
      Processing: 0,
      Completed: 0,
      Cancelled: 0,
    };
    runs.forEach((r) => {
      base[r.status] += 1;
    });
    return base;
  }, [runs]);

  const filteredRuns = useMemo(() => {
    return runs
      .filter((r) => (statusTab === "All" ? true : r.status === statusTab))
      .filter((r) => r.title.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => (a.month < b.month ? 1 : -1));
  }, [runs, statusTab, search]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, search, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / rowsPerPage));
  const pagedRuns = filteredRuns.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const monthsWithRuns = useMemo(() => new Set(runs.map((r) => r.month)), [runs]);

  const stepMonth = (delta: number) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(next);
    setSelectedYear(d.getFullYear());
  };

  const goToDetail = (row: PayrollRunRow) => {
    navigate(`${location.pathname.replace(/\/$/, "")}/${row.month}`);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Payroll Runs
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Process and manage payroll runs for each pay period.
          </p>
        </div>

        {canRunCurrentMonth ? (
          <button
            onClick={runCurrentMonth}
            disabled={running || !currentRun}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            {running ? "Running..." : "Run Payroll"}
          </button>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium",
              statusTone[currentRun!.status].bg,
              statusTone[currentRun!.status].text
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {currentRun!.status}
          </span>
        )}
      </div>

      {/* MONTH / YEAR NAVIGATOR */}
      <div className="card-premium shadow-premium-sm p-4 sm:p-5">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => stepMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-lg font-bold text-[var(--foreground)]">{monthYearLabel(selectedMonth)}</span>
          <button
            onClick={() => stepMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="grid flex-1 grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
            {MONTH_NAMES.map((name, idx) => {
              const monthValue = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
              const isSelected = monthValue === selectedMonth;
              const hasRun = monthsWithRuns.has(monthValue);
              return (
                <button
                  key={name}
                  onClick={() => setSelectedMonth(monthValue)}
                  className={cn(
                    "relative rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-[var(--status-good)] text-white shadow-premium-sm"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                  )}
                >
                  {name}
                  {hasRun && (
                    <span
                      className={cn(
                        "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                        isSelected ? "bg-white" : "bg-[var(--status-good)]"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SEARCH + STATUS TABS */}
      <div className="card-premium shadow-premium-sm p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-[var(--border)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-[var(--status-good)] text-[var(--status-good)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    active ? "bg-[var(--status-good)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                {["#", "Title", "Frequency", "Pay Period", "Pay Date", "Employees", "Gross Pay", "Net Pay", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                    >
                      {h}
                    </th>
                  )
                )}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {pagedRuns.map((row, i) => {
                const tone = statusTone[row.status];
                const canGeneratePayslips = row.status === "Completed";
                const isGenerating = generatingMonth === row.month;

                return (
                  <tr key={row._id} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {(page - 1) * rowsPerPage + i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{row.title}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                        {row.frequency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      <div className="flex items-center gap-1.5 text-xs">
                        <CalendarDays className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        {row.payPeriodStart}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <CalendarDays className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        {row.payPeriodEnd}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      {row.payDate ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <CalendarDays className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                          {row.payDate}
                        </div>
                      ) : (
                        <span className="text-xs italic text-[var(--muted-foreground)]">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">{row.employees}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--status-good)]">{currency(row.gross)}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--primary)]">{currency(row.net)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            tone.bg,
                            tone.text
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {row.status}
                        </span>
                        {row.isLivePreview && (
                          <span
                            title="Live estimate from attendance recorded so far this month — updates until Run Payroll is clicked"
                            className="rounded-full bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]"
                          >
                            live estimate
                          </span>
                        )}
                        {row.generatedBy === "CA" && (
                          <span
                            title="Run by the CA firm on this company's behalf"
                            className="rounded-full bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary)]"
                          >
                            Generated by CA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="View"
                          onClick={() => goToDetail(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          title={canGeneratePayslips ? "Generate Payslips" : "Available once payroll is Completed"}
                          disabled={!canGeneratePayslips || isGenerating}
                          onClick={() => generatePayslips(row)}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                            canGeneratePayslips
                              ? "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--status-good)]"
                              : "cursor-not-allowed text-[var(--muted-foreground)]/40"
                          )}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pagedRuns.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                    No payroll runs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            Showing {filteredRuns.length === 0 ? 0 : (page - 1) * rowsPerPage + 1} to{" "}
            {Math.min(page * rowsPerPage, filteredRuns.length)} of {filteredRuns.length} results
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              Rows per page:
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--foreground)] disabled:opacity-40"
              >
                « Previous
              </button>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--status-good)] text-xs font-semibold text-white">
                {page}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--foreground)] disabled:opacity-40"
              >
                Next »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollRun;
