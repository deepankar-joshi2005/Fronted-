/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { utils as XLSXUtils, writeFile as writeXlsx } from "xlsx";
import {
  Users,
  CalendarCheck,
  UserX,
  Clock,
  FileText,
  IndianRupee,
  Plus,
  UserPlus,
  ClipboardCheck,
  ArrowRight,
  Download,
  ChevronDown,
  UserCheck,
  FileWarning,
  Wallet,
  Activity as ActivityIcon,
  LogIn,
  Trash2,
  Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader";
import { useAuth } from "@/contexts/AuthContext";
import { useBranchFilter } from "@/contexts/BranchFilterContext";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { DonutChart, type DonutSlice } from "@/components/ui/donut-chart";
import { TrendChart } from "@/components/ui/trend-chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getActivityLogs, type ActivityLog } from "@/api/activityLogApi";
import type { MatrixEntry } from "@/utils/attendanceStatus";

const API_BASE = import.meta.env.VITE_API_URL;
const PRESENT_STATUSES = new Set(["FULL_DAY", "LATE_FULL_DAY", "HALF_DAY", "LATE_HALF_DAY"]);

/* ================= TYPES ================= */

interface RawEmployee {
  _id: string;
  name: string;
  branchId?: { _id: string; name: string };
  departmentId?: { _id: string; name: string };
  joiningDate?: string;
}

interface RawLeave {
  _id: string;
  employee?: { _id: string; name: string };
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  status: string;
  createdAt?: string;
}

interface RawDocument {
  _id: string;
  user?: { _id: string; name: string };
  status: string;
}

interface PayrollRecord {
  status: "Draft" | "Processed" | "Paid";
  net?: number;
}

/* ================= HELPERS ================= */

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function activityIconFor(action: string) {
  const a = action?.toUpperCase() || "";
  if (a.includes("DELETE")) return { icon: Trash2, tone: "critical" as const };
  if (a.includes("CREATE") || a.includes("ADD")) return { icon: Plus, tone: "good" as const };
  if (a.includes("LOGIN")) return { icon: LogIn, tone: "primary" as const };
  if (a.includes("UPDATE") || a.includes("EDIT")) return { icon: Pencil, tone: "warning" as const };
  return { icon: ActivityIcon, tone: "primary" as const };
}

const toneClasses: Record<string, string> = {
  primary: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]",
  good: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  warning: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  critical: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
};

/* ================= DASHBOARD ================= */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { branches, selectedBranchId } = useBranchFilter();

  const [rawEmployees, setRawEmployees] = useState<RawEmployee[]>([]);
  const [matrix, setMatrix] = useState<MatrixEntry[]>([]);
  const [leaves, setLeaves] = useState<RawLeave[]>([]);
  const [documents, setDocuments] = useState<RawDocument[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payrollMonthLabel, setPayrollMonthLabel] = useState("");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [canSeeActivity, setCanSeeActivity] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = toDateStr(today);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed, matches backend's attendance/all contract

    try {
      const [empRes, attendanceRes, leaveRes, payrollRes, documentsRes] = await Promise.all([
        axios.get(`${API_BASE}/users`, { headers }),
        axios.get(`${API_BASE}/attendance/all`, { headers, params: { year, month } }),
        axios.get(`${API_BASE}/employee/leaves/all`, { headers }),
        axios.get(`${API_BASE}/payroll`, { headers, params: { year, month: month + 1 } }),
        axios.get(`${API_BASE}/documents/all`, { headers }).catch(() => ({ data: [] })),
      ]);

      let mergedMatrix: MatrixEntry[] = attendanceRes.data.matrix || [];

      // If we're early in the month, pull in the tail of the previous month
      // so the "last 7 days" trend always has 7 real data points.
      if (today.getDate() < 7) {
        const prevMonthDate = new Date(year, month, 0);
        const prevRes = await axios.get(`${API_BASE}/attendance/all`, {
          headers,
          params: { year: prevMonthDate.getFullYear(), month: prevMonthDate.getMonth() },
        });
        mergedMatrix = [...(prevRes.data.matrix || []), ...mergedMatrix];
      }

      setRawEmployees(empRes.data || []);
      setMatrix(mergedMatrix);
      setLeaves(leaveRes.data || []);
      setDocuments(documentsRes.data || []);
      setPayrollRecords(payrollRes.data || []);
      setPayrollMonthLabel(
        today.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
      );

      if (user?.role === "superadmin") {
        setCanSeeActivity(true);
        try {
          const activityRes = await getActivityLogs({
            limit: 5,
            sortBy: "createdAt",
            sortOrder: "desc",
          });
          setActivityLogs(activityRes.data?.activityLogs || []);
        } catch {
          setActivityLogs([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= BRANCH-FILTERED DERIVED DATA ================= */

  const filteredEmployees = useMemo(() => {
    if (selectedBranchId === "all") return rawEmployees;
    return rawEmployees.filter((e) => e.branchId?._id === selectedBranchId);
  }, [rawEmployees, selectedBranchId]);

  const filteredIds = useMemo(
    () => new Set(filteredEmployees.map((e) => e._id)),
    [filteredEmployees]
  );

  const todayBreakdown = useMemo(() => {
    const entries = matrix.filter((m) => m.date === todayStr && filteredIds.has(m.userId));
    return {
      present: entries.filter((m) => PRESENT_STATUSES.has(m.status)).length,
      onLeave: entries.filter((m) => m.status === "ON_LEAVE").length,
      absent: entries.filter((m) => m.status === "ABSENT").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrix, filteredIds, todayStr]);

  const last7DateStrs = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return toDateStr(d);
    });
  }, []);

  const trendData = useMemo(() => {
    return last7DateStrs.map((dateStr) => {
      const count = matrix.filter(
        (m) => m.date === dateStr && filteredIds.has(m.userId) && PRESENT_STATUSES.has(m.status)
      ).length;
      const d = new Date(dateStr);
      return {
        label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: count,
      };
    });
  }, [matrix, filteredIds, last7DateStrs]);

  const presentSparkline = useMemo(() => trendData.map((t) => t.value), [trendData]);

  const absentSparkline = useMemo(
    () =>
      last7DateStrs.map(
        (dateStr) =>
          matrix.filter((m) => m.date === dateStr && filteredIds.has(m.userId) && m.status === "ABSENT")
            .length
      ),
    [matrix, filteredIds, last7DateStrs]
  );

  const onLeaveSparkline = useMemo(
    () =>
      last7DateStrs.map(
        (dateStr) =>
          matrix.filter((m) => m.date === dateStr && filteredIds.has(m.userId) && m.status === "ON_LEAVE")
            .length
      ),
    [matrix, filteredIds, last7DateStrs]
  );

  // Real cumulative headcount on each of the last 7 days, from actual joining dates
  const employeesSparkline = useMemo(
    () =>
      last7DateStrs.map(
        (dateStr) =>
          filteredEmployees.filter((e) => !e.joiningDate || e.joiningDate.split("T")[0] <= dateStr).length
      ),
    [filteredEmployees, last7DateStrs]
  );

  // Real count of leave requests submitted per day, last 7 days
  const leaveRequestsSparkline = useMemo(
    () =>
      last7DateStrs.map(
        (dateStr) =>
          leaves.filter(
            (lv) =>
              lv.createdAt?.split("T")[0] === dateStr && (!lv.employee || filteredIds.has(lv.employee._id))
          ).length
      ),
    [leaves, filteredIds, last7DateStrs]
  );

  // Stable department -> color assignment computed from the FULL org, so a
  // department's color never shifts when the branch filter changes.
  const departmentColorMap = useMemo(() => {
    const counts = new Map<string, number>();
    rawEmployees.forEach((e) => {
      const name = e.departmentId?.name || "Unassigned";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const ordered = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
    const palette = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];
    const map = new Map<string, string>();
    ordered.slice(0, 5).forEach((name, i) => map.set(name, palette[i]));
    return map;
  }, [rawEmployees]);

  const departmentData: DonutSlice[] = useMemo(() => {
    const counts = new Map<string, number>();
    filteredEmployees.forEach((e) => {
      const name = e.departmentId?.name || "Unassigned";
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    const slices: DonutSlice[] = [];
    let other = 0;
    counts.forEach((value, name) => {
      const color = departmentColorMap.get(name);
      if (color) slices.push({ label: name, value, color });
      else other += value;
    });
    slices.sort((a, b) => b.value - a.value);
    if (other > 0) slices.push({ label: "Other", value: other, color: "var(--cat-other)" });
    return slices;
  }, [filteredEmployees, departmentColorMap]);

  const pendingLeaves = useMemo(
    () =>
      leaves.filter(
        (lv) => lv.status === "PENDING" && (!lv.employee || filteredIds.has(lv.employee._id))
      ),
    [leaves, filteredIds]
  );

  const missingDocEmployeeCount = useMemo(() => {
    const ids = new Set(
      documents
        .filter((d) => d.status === "PENDING" && (!d.user || filteredIds.has(d.user._id)))
        .map((d) => d.user?._id)
        .filter(Boolean)
    );
    return ids.size;
  }, [documents, filteredIds]);

  const payrollStatus: "Draft" | "Processed" | "Paid" = payrollRecords.some((p) => p.status === "Paid")
    ? "Paid"
    : payrollRecords.some((p) => p.status === "Processed")
    ? "Processed"
    : "Draft";
  const netPayable = payrollRecords.reduce((s, p) => s + (p.net || 0), 0);

  const attendanceRate =
    filteredEmployees.length > 0
      ? (todayBreakdown.present / filteredEmployees.length) * 100
      : 0;

  const pendingActionItems = [
    pendingLeaves.length > 0 && {
      icon: UserCheck,
      tone: "warning" as const,
      title: `${pendingLeaves.length} leave request${pendingLeaves.length === 1 ? "" : "s"} awaiting approval`,
      action: "Review now",
      onClick: () => navigate("/hrms/SuperAdmin/leaves"),
    },
    missingDocEmployeeCount > 0 && {
      icon: FileWarning,
      tone: "primary" as const,
      title: `${missingDocEmployeeCount} employee${missingDocEmployeeCount === 1 ? "" : "s"} missing documents`,
      action: "View details",
      onClick: () => navigate("/hrms/SuperAdmin/documents"),
    },
    payrollStatus !== "Paid" && {
      icon: Wallet,
      tone: "good" as const,
      title: `Payroll for ${payrollMonthLabel} is ${payrollStatus.toLowerCase()}`,
      action: "Continue process",
      onClick: () => navigate("/hrms/SuperAdmin/payroll/run"),
    },
  ].filter(Boolean) as { icon: any; tone: "warning" | "primary" | "good"; title: string; action: string; onClick: () => void }[];

  const handleExportReport = () => {
    const summarySheet = XLSXUtils.json_to_sheet([
      { Metric: "Total Employees", Value: filteredEmployees.length },
      { Metric: "Present Today", Value: todayBreakdown.present },
      { Metric: "Absent Today", Value: todayBreakdown.absent },
      { Metric: "On Leave", Value: todayBreakdown.onLeave },
      { Metric: "Pending Leave Requests", Value: pendingLeaves.length },
      { Metric: "Net Payable", Value: netPayable },
      { Metric: "Payroll Status", Value: payrollStatus },
    ]);
    const deptSheet = XLSXUtils.json_to_sheet(
      departmentData.map((d) => ({ Department: d.label, Employees: d.value }))
    );
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, summarySheet, "Summary");
    XLSXUtils.book_append_sheet(wb, deptSheet, "Departments");
    writeXlsx(wb, `HRMS-Dashboard-Report-${todayStr}.xlsx`);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const firstName = user?.name?.split(" ")[0];
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const selectedBranchName =
    selectedBranchId === "all"
      ? null
      : branches.find((b) => b._id === selectedBranchId)?.name;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {firstName ? `${greeting}, ${firstName}` : "Admin Dashboard"} 👋
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {formattedDate} · Here's what's happening across your organization today
            {selectedBranchName ? ` in ${selectedBranchName}` : ""}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm font-medium text-[var(--foreground)] shadow-premium-xs transition-colors hover:bg-[var(--muted)]"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3.5 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90">
                <Plus className="h-4 w-4" />
                Quick Action
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/hrms/SuperAdmin/addUser")}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Employee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/hrms/SuperAdmin/leaves")}>
                <ClipboardCheck className="mr-2 h-4 w-4" /> Approve Leave
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/hrms/SuperAdmin/payroll/run")}>
                <FileText className="mr-2 h-4 w-4" /> Process Payroll
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        <StatCard
          label="Total employees"
          value={filteredEmployees.length}
          icon={Users}
          tone="primary"
          sparklineData={employeesSparkline}
        />
        <StatCard
          label="Present today"
          value={todayBreakdown.present}
          icon={CalendarCheck}
          tone="good"
          sublabel={`${Math.round(attendanceRate)}% of workforce`}
          sparklineData={presentSparkline}
        />
        <StatCard
          label="Absent today"
          value={todayBreakdown.absent}
          icon={UserX}
          tone="critical"
          sparklineData={absentSparkline}
        />
        <StatCard
          label="On leave"
          value={todayBreakdown.onLeave}
          icon={ClipboardCheck}
          tone="warning"
          sublabel="Approved for today"
          sparklineData={onLeaveSparkline}
        />
        <StatCard
          label="Pending leaves"
          value={pendingLeaves.length}
          icon={Clock}
          tone="warning"
          sublabel="Awaiting your approval"
          sparklineData={leaveRequestsSparkline}
        />
        <StatCard
          label="Net payable"
          value={`₹${netPayable.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="violet"
          sublabel={payrollMonthLabel}
        />
      </div>

      {/* ================= WORKFORCE OVERVIEW + TREND ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <DashboardPanel
          title="Workforce overview"
          subtitle="Employee status distribution today"
          className="lg:col-span-2"
        >
          <DonutChart
            centerLabel="Total"
            data={[
              { label: "Present", value: todayBreakdown.present, color: "var(--status-good)" },
              { label: "On leave", value: todayBreakdown.onLeave, color: "var(--status-warning)" },
              { label: "Absent", value: todayBreakdown.absent, color: "var(--status-critical)" },
            ]}
          />
        </DashboardPanel>

        <DashboardPanel title="Attendance trend" subtitle="Last 7 days overview" className="lg:col-span-3">
          <TrendChart data={trendData} color="var(--primary)" />
        </DashboardPanel>
      </div>

      {/* ================= DEPARTMENTS + ACTIVITY + PENDING ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <DashboardPanel
          title="Department distribution"
          subtitle="Employees by department"
          action={
            <button
              onClick={() => navigate("/hrms/SuperAdmin/departments")}
              className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              View All
            </button>
          }
        >
          {departmentData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No employees to show yet
            </p>
          ) : (
            <DonutChart centerLabel="Total" data={departmentData} />
          )}
        </DashboardPanel>

        <DashboardPanel title="Recent activity" subtitle="Latest activities across the system">
          {!canSeeActivity ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              Recent activity is available for Super Admin accounts
            </p>
          ) : activityLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No recent activity yet
            </p>
          ) : (
            <>
              <div className="space-y-4">
                {activityLogs.map((log) => {
                  const { icon: Icon, tone } = activityIconFor(log.action);
                  return (
                    <div key={log._id} className="flex items-start gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {log.description || log.action}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">{timeAgo(log.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => navigate("/hrms/SuperAdmin/audit-logs")}
                className="mt-5 w-full rounded-lg border border-[var(--border)] py-2 text-xs font-medium text-[var(--primary)] hover:bg-[var(--muted)]"
              >
                View All Activities
              </button>
            </>
          )}
        </DashboardPanel>

        <DashboardPanel title="Pending actions" subtitle="Items that need your attention">
          {pendingActionItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              You're all caught up
            </p>
          ) : (
            <>
              <div className="space-y-2.5">
                {pendingActionItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={item.onClick}
                    className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-left transition-colors hover:bg-[var(--muted)]"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses[item.tone]}`}>
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                        {item.title}
                      </span>
                      <span className="block text-xs text-[var(--primary)]">{item.action}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                  </button>
                ))}
              </div>
            </>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
};

export default AdminDashboard;
