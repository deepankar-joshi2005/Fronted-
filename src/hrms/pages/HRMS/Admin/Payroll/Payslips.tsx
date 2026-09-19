/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Eye,
  Download,
  Loader2,
  Search,
  Filter,
  LayoutGrid,
  FileText,
  CheckCircle2,
  X,
  CalendarDays,
  Clock,
} from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

type PayslipStatus = "Generated" | "Sent" | "Viewed" | "Downloaded";

interface PayslipRow {
  _id: string;
  user: { _id: string; name: string; email: string; employeeId?: string };
  month: string;
  payDate?: string;
  netSalary: number;
  status: PayslipStatus;
  createdAt: string;
}

interface PayslipBreakdown {
  daysInMonth: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  holidayDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  lopDays: number;
  effectivePaidDays: number;
  overtimeHours: number;

  basic: number;
  componentEarnings: number;
  totalEarnings: number;
  lopDeductionAmount: number;
  unpaidLeaveDeductionAmount: number;
  overtimeAmount: number;
  encashmentBonus: number;
  grossPay: number;

  hra: number;
  otherAllowance: number;

  professionalTax: number;
  pf: number;
  tds: number;
  advance: number;
  others: number;
  totalComponentDeductions: number;

  netPay: number;
}

interface PayslipDetail {
  _id: string;
  user: { _id: string; name: string; employeeId?: string };
  month: string;
  payDate?: string;
  netSalary: number;
  status: PayslipStatus;
}

interface DetailResponse {
  payslip: PayslipDetail;
  breakdown: PayslipBreakdown;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AVATAR_COLORS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const currency2 = (n: number) =>
  `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const monthYearLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const monthBoundsLabel = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return `${iso(start)} → ${iso(end)}`;
};

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

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

const statusTone: Record<PayslipStatus, { bg: string; text: string }> = {
  Generated: { bg: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]", text: "text-[var(--primary)]" },
  Sent: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]",
    text: "text-[var(--status-warning)]",
  },
  Viewed: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]",
    text: "text-[var(--status-warning)]",
  },
  Downloaded: { bg: "bg-[color-mix(in_oklab,#7C3AED_14%,transparent)]", text: "text-[#7C3AED]" },
};

function AttendanceRow({ label, value, tone }: { label: string; value: string; tone: "good" | "critical" | "warning" | "violet" | "default" }) {
  const toneClass =
    tone === "good"
      ? "text-[var(--status-good)]"
      : tone === "critical"
      ? "text-[var(--status-critical)]"
      : tone === "warning"
      ? "text-[var(--status-warning)]"
      : tone === "violet"
      ? "text-[#7C3AED]"
      : "text-[var(--foreground)]";
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-2 text-sm last:border-b-0">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className={cn("font-semibold", toneClass)}>{value}</span>
    </div>
  );
}

function AmountRow({
  label,
  value,
  sign,
  bold,
}: {
  label: string;
  value: number;
  sign?: "+" | "-";
  bold?: boolean;
}) {
  const color =
    sign === "+" ? "text-[var(--status-good)]" : sign === "-" ? "text-[var(--status-critical)]" : "text-[var(--foreground)]";
  return (
    <div className={cn("flex items-center justify-between py-1.5 text-sm", bold && "border-t border-[var(--border)] pt-2 mt-1")}>
      <span className={bold ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>{label}</span>
      <span className={cn(bold ? "font-bold" : "font-medium", bold ? "text-[var(--foreground)]" : color)}>
        {sign ? `${sign}${currency2(value)}` : currency2(value)}
      </span>
    </div>
  );
}

const Payslips = () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [payslips, setPayslips] = useState<PayslipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date(`${currentMonth}-01`).getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [statusTab, setStatusTab] = useState<"All" | "Generated" | "Downloaded">("All");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchPayslips = async () => {
    try {
      const res = await axios.get(`${API_BASE}/payslips`, { headers });
      setPayslips(res.data || []);
    } catch (err) {
      console.error("Failed to fetch payslips", err);
      toast({ type: "error", title: "Failed to Load", message: "Could not fetch payslips." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePayslip = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/payslips/generate-from-payroll`, { month: selectedMonth }, { headers });
      fetchPayslips();
      toast({ type: "success", title: "Payslips Generated", message: res.data?.message || "Payslips generated successfully." });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Payslips Not Generated",
        message: err?.response?.data?.message || "Failed to generate payslips.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const monthPayslips = useMemo(() => payslips.filter((p) => p.month === selectedMonth), [payslips, selectedMonth]);

  const employeeOptions = useMemo(
    () => Array.from(new Set(monthPayslips.map((p) => p.user?.name).filter(Boolean))).sort(),
    [monthPayslips]
  );

  const yearOptions = useMemo(() => {
    const years = new Set(payslips.map((p) => Number(p.month.split("-")[0])));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [payslips]);

  const monthsWithData = useMemo(() => new Set(payslips.map((p) => p.month)), [payslips]);

  const counts = useMemo(() => {
    const base = { All: monthPayslips.length, Generated: 0, Downloaded: 0 };
    monthPayslips.forEach((p) => {
      if (p.status === "Downloaded") base.Downloaded += 1;
      else base.Generated += 1;
    });
    return base;
  }, [monthPayslips]);

  const filteredPayslips = useMemo(() => {
    return monthPayslips
      .filter((p) => (statusTab === "All" ? true : statusTab === "Downloaded" ? p.status === "Downloaded" : p.status !== "Downloaded"))
      .filter((p) => (employeeFilter === "All" ? true : p.user?.name === employeeFilter))
      .filter((p) => p.user?.name?.toLowerCase().includes(search.trim().toLowerCase()));
  }, [monthPayslips, statusTab, employeeFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, employeeFilter, search, selectedMonth, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredPayslips.length / rowsPerPage));
  const pagedPayslips = filteredPayslips.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const resetFilters = () => {
    setSearch("");
    setEmployeeFilter("All");
    setStatusTab("All");
  };

  const openPanel = async (row: PayslipRow) => {
    setPanelOpen(true);
    setPanelLoading(true);
    setDetail(null);
    try {
      const res = await axios.get(`${API_BASE}/payslips/${row._id}/detail`, { headers });
      setDetail(res.data);
    } catch (err) {
      console.error(err);
      toast({ type: "error", title: "Failed to Load", message: "Could not load payslip details." });
      setPanelOpen(false);
    } finally {
      setPanelLoading(false);
    }
  };

  const closePanel = () => {
    setPanelOpen(false);
    setDetail(null);
  };

  const downloadPayslip = async (id: string, employeeName: string, monthStr: string) => {
    setDownloadingId(id);
    try {
      const res = await axios.get(`${API_BASE}/payslips/${id}/download`, {
        responseType: "blob",
        headers,
      });

      const [y, m] = monthStr.split("-").map(Number);
      const monthName = new Date(y, m - 1, 1).toLocaleString("default", { month: "long" });
      const fileName = `${employeeName}_${monthName}_${y}.pdf`;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      setPayslips((prev) => prev.map((p) => (p._id === id ? { ...p, status: "Downloaded" } : p)));
      setDetail((prev) => (prev && prev.payslip._id === id ? { ...prev, payslip: { ...prev.payslip, status: "Downloaded" } } : prev));
    } catch (err) {
      console.error(err);
      toast({ type: "error", title: "Download Failed", message: "Could not download payslip." });
    } finally {
      setDownloadingId(null);
    }
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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">Payslips</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Browse and download employee payslips.</p>
        </div>

        <button
          onClick={generatePayslip}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {generating ? "Generating..." : "Generate Payslips"}
        </button>
      </div>

      {/* MONTH STRIP */}
      <div className="card-premium shadow-premium-sm p-4 sm:p-5">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {MONTH_NAMES.map((name, idx) => {
            const monthValue = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
            const isSelected = monthValue === selectedMonth;
            const hasData = monthsWithData.has(monthValue);
            return (
              <button
                key={name}
                onClick={() => setSelectedMonth(monthValue)}
                className={cn(
                  "relative rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  isSelected ? "bg-[var(--status-good)] text-white shadow-premium-sm" : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                )}
              >
                {name}
                {isSelected && <span className="block text-[10px] font-normal opacity-90">{selectedYear}</span>}
                {hasData && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--status-good)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="card-premium shadow-premium-sm p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <select
            value={selectedYear}
            onChange={(e) => {
              const year = Number(e.target.value);
              setSelectedYear(year);
              setSelectedMonth(`${year}-${selectedMonth.split("-")[1]}`);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          >
            <option value="All">All Employees</option>
            {employeeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            onClick={resetFilters}
            title="Reset filters"
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--foreground)]">
            Year: {selectedYear}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-[var(--border)]">
          {(
            [
              { key: "All", label: "All", icon: LayoutGrid },
              { key: "Generated", label: "Generated", icon: FileText },
              { key: "Downloaded", label: "Downloaded", icon: CheckCircle2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = statusTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "border-[var(--status-good)] text-[var(--status-good)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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

      {/* TABLE (scrollable) */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--muted)]">
              <tr>
                {["#", "Employee", "Pay Date", "Net Pay", "Status", "Generated On"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {pagedPayslips.map((p, i) => {
                const tone = statusTone[p.status] ?? statusTone.Generated;
                return (
                  <tr key={p._id} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{(page - 1) * rowsPerPage + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: avatarColor(p.user?.name || "?") }}
                        >
                          {initials(p.user?.name || "?")}
                        </span>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{p.user?.name}</p>
                          {p.user?.employeeId && <p className="text-xs text-[var(--muted-foreground)]">{p.user.employeeId}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      <div className="flex items-center gap-1.5 text-xs">
                        <CalendarDays className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        {p.payDate ? fmtDate(p.payDate) : <span className="italic text-[var(--muted-foreground)]">Not set</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--status-good)]">{currency(p.netSalary)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", tone.bg, tone.text)}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {fmtDate(p.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        title="View"
                        onClick={() => openPanel(p)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {pagedPayslips.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                    No payslips found for {monthYearLabel(selectedMonth)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            Showing {filteredPayslips.length === 0 ? 0 : (page - 1) * rowsPerPage + 1} to{" "}
            {Math.min(page * rowsPerPage, filteredPayslips.length)} of {filteredPayslips.length} results
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

      {/* PAY STUB SIDE PANEL */}
      {panelOpen && (
        <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-md border-l border-[var(--border)] bg-[var(--card)] shadow-premium-lg animate-in slide-in-from-right duration-200">
          <div className="flex h-full flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">Pay Stub</h2>
                {detail && <p className="text-xs text-[var(--muted-foreground)]">{monthBoundsLabel(detail.payslip.month)}</p>}
              </div>
              <div className="flex items-center gap-1">
                {detail && (
                  <button
                    title="Download PDF"
                    disabled={downloadingId === detail.payslip._id}
                    onClick={() => downloadPayslip(detail.payslip._id, detail.payslip.user.name, detail.payslip.month)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                  >
                    {downloadingId === detail.payslip._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  </button>
                )}
                <button
                  title="Close"
                  onClick={closePanel}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Panel body (independently scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {panelLoading || !detail ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Employee card */}
                  <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: avatarColor(detail.payslip.user.name) }}
                      >
                        {initials(detail.payslip.user.name)}
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{detail.payslip.user.name}</p>
                        {detail.payslip.user.employeeId && (
                          <p className="text-xs text-[var(--muted-foreground)]">{detail.payslip.user.employeeId}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Pay Date</p>
                      <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-[var(--foreground)]">
                        <Clock className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        {fmtDate(detail.payslip.payDate)}
                      </p>
                    </div>
                  </div>

                  {/* Attendance */}
                  <section>
                    <h3 className="mb-1 border-b border-[var(--border)] pb-1 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Attendance
                    </h3>
                    <AttendanceRow label="Working Days" value={detail.breakdown.workingDays.toString()} tone="default" />
                    <AttendanceRow label="Present Days" value={detail.breakdown.presentDays.toFixed(2)} tone="good" />
                    <AttendanceRow label="Absent Days" value={detail.breakdown.absentDays.toString()} tone="critical" />
                    <AttendanceRow label="Half Days" value={detail.breakdown.halfDays.toFixed(2)} tone="warning" />
                    <AttendanceRow label="Holiday Days" value={detail.breakdown.holidayDays.toString()} tone="default" />
                    <AttendanceRow label="Paid Leave" value={detail.breakdown.paidLeaveDays.toFixed(2)} tone="good" />
                    <AttendanceRow label="Unpaid Leave" value={detail.breakdown.unpaidLeaveDays.toFixed(2)} tone="warning" />
                    <AttendanceRow label="LOP Days" value={detail.breakdown.lopDays.toFixed(2)} tone="critical" />
                    <AttendanceRow label="Effective Paid Days" value={detail.breakdown.effectivePaidDays.toFixed(2)} tone="good" />
                    <AttendanceRow label="Overtime Hours" value={detail.breakdown.overtimeHours.toFixed(2)} tone="violet" />
                  </section>

                  {/* Gross Pay Calculation */}
                  <section>
                    <h3 className="mb-1 border-b border-[var(--border)] pb-1 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Gross Pay Calculation
                    </h3>
                    <AmountRow label="Basic Salary" value={detail.breakdown.basic} />
                    <AmountRow label="Component Earnings" value={detail.breakdown.componentEarnings} sign="+" />
                    <AmountRow label="Total Earnings (Basic + Components)" value={detail.breakdown.totalEarnings} bold />
                    <AmountRow label="LOP Deduction" value={detail.breakdown.lopDeductionAmount} sign="-" />
                    <AmountRow label="Unpaid Leave Deduction" value={detail.breakdown.unpaidLeaveDeductionAmount} sign="-" />
                    <AmountRow label="Overtime Earnings" value={detail.breakdown.overtimeAmount} sign="+" />
                    {detail.breakdown.encashmentBonus > 0 && (
                      <AmountRow label="Leave Encashment" value={detail.breakdown.encashmentBonus} sign="+" />
                    )}
                    <div className="mt-2 rounded-lg border border-[var(--status-good)]/25 bg-[color-mix(in_oklab,var(--status-good)_10%,transparent)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--status-good)]">Gross Pay</span>
                        <span className="text-lg font-bold text-[var(--status-good)]">{currency2(detail.breakdown.grossPay)}</span>
                      </div>
                      <p className="mt-1 text-[10px] italic text-[var(--muted-foreground)]">
                        Total Earnings − LOP − Unpaid Leave + Overtime
                      </p>
                    </div>
                  </section>

                  {/* Earnings / Allowances */}
                  <section>
                    <h3 className="mb-1 border-b border-[var(--border)] pb-1 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Earnings / Allowances
                    </h3>
                    <AmountRow label="House Rent Allowance (HRA)" value={detail.breakdown.hra} sign="+" />
                    <AmountRow label="Other Allowance" value={detail.breakdown.otherAllowance} sign="+" />
                    <AmountRow label="Total Allowances" value={detail.breakdown.componentEarnings} sign="+" bold />
                  </section>

                  {/* Deductions */}
                  <section>
                    <h3 className="mb-1 border-b border-[var(--border)] pb-1 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Deductions
                    </h3>
                    {detail.breakdown.professionalTax > 0 && <AmountRow label="Professional Tax" value={detail.breakdown.professionalTax} sign="-" />}
                    {detail.breakdown.pf > 0 && <AmountRow label="Provident Fund (PF)" value={detail.breakdown.pf} sign="-" />}
                    {detail.breakdown.tds > 0 && <AmountRow label="Income Tax (TDS)" value={detail.breakdown.tds} sign="-" />}
                    {detail.breakdown.advance > 0 && <AmountRow label="Advance" value={detail.breakdown.advance} sign="-" />}
                    {detail.breakdown.others > 0 && <AmountRow label="Others" value={detail.breakdown.others} sign="-" />}
                    <AmountRow label="Total Deductions" value={detail.breakdown.totalComponentDeductions} sign="-" bold />
                  </section>

                  {/* Net Pay Summary */}
                  <section>
                    <h3 className="mb-1 border-b border-[var(--border)] pb-1 text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Net Pay Summary
                    </h3>
                    <AmountRow label="Basic Salary" value={detail.breakdown.basic} />
                    <AmountRow label="Total Earnings" value={detail.breakdown.totalEarnings} sign="+" />
                    <AmountRow label="Gross Pay" value={detail.breakdown.grossPay} />
                    <AmountRow label="Total Deductions" value={detail.breakdown.totalComponentDeductions} sign="-" />
                    <div className="mt-2 rounded-lg border border-[var(--primary)]/25 bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold uppercase tracking-wide text-[var(--primary)]">Net Pay</span>
                        <span className="text-xl font-bold text-[var(--primary)]">{currency2(detail.breakdown.netPay)}</span>
                      </div>
                      <p className="mt-1 text-[10px] italic text-[var(--muted-foreground)]">Net Pay = Gross Pay − Total Deductions</p>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payslips;
