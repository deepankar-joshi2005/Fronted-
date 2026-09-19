/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  CalendarCheck,
  Wallet,
  CalendarX2,
  ShieldCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { DonutChart } from "@/components/ui/donut-chart";
import { TrendChart } from "@/components/ui/trend-chart";

const API_BASE = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

interface AuditorStats {
  employees: number;
  attendancePercent: number;
  presentCount: number;
  absentCount: number;
  totalAttendanceRecords: number;
  payrollCount: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  complianceStatus: "COMPLIANT" | "PARTIAL" | "NON-COMPLIANT";
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

export default function AuditorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<AuditorStats | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based, for the /attendance/all endpoint
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`; // YYYY-MM, for /payroll

  const [trend, setTrend] = useState<
    { label: string; employees: number; attendancePercent: number; payrollCount: number; pendingLeaves: number }[]
  >([]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [userRes, attendanceRes, payrollRes, leaveRes] = await Promise.all([
        axios.get(`${API_BASE}/users`, { headers }),
        axios.get(`${API_BASE}/attendance/all`, {
          headers,
          params: { month, year },
        }),
        // Payroll.month is stored as "YYYY-MM" — passing the raw 0-based
        // month number here (as before) never matched anything.
        axios.get(`${API_BASE}/payroll`, {
          headers,
          params: { month: monthKey },
        }),
        axios.get(`${API_BASE}/employee/leaves/all`, { headers }),
      ]);

      const allUsers = userRes.data || [];
      const totalEmployees = allUsers.length;

      const present = attendanceRes.data.attendance.filter(
        (a: any) => a.punchIn && a.punchOut
      ).length;
      const totalAttendanceRecords = attendanceRes.data.attendance.length;
      const absentCount = totalAttendanceRecords - present;

      const attendancePercent = totalAttendanceRecords
        ? Math.round((present / totalAttendanceRecords) * 100)
        : 0;

      const allLeaves = leaveRes.data || [];
      const monthLeaves = allLeaves.filter((l: any) => {
        const d = new Date(l.fromDate);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      const pendingLeaves = monthLeaves.filter(
        (l: any) => l.status === "PENDING"
      ).length;
      const approvedLeaves = monthLeaves.filter(
        (l: any) => l.status === "APPROVED"
      ).length;
      const rejectedLeaves = monthLeaves.filter(
        (l: any) => l.status === "REJECTED"
      ).length;

      let compliance: AuditorStats["complianceStatus"] = "COMPLIANT";
      if (attendancePercent < 75 || pendingLeaves > 5)
        compliance = "NON-COMPLIANT";
      else if (pendingLeaves > 0) compliance = "PARTIAL";

      setStats({
        employees: totalEmployees,
        attendancePercent,
        presentCount: present,
        absentCount,
        totalAttendanceRecords,
        payrollCount: payrollRes.data.length,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        complianceStatus: compliance,
      });

      /* ================= 6-MONTH TREND (real data, for the KPI sparklines) ================= */
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(year, month - (5 - i), 1);
        return { y: d.getFullYear(), m: d.getMonth() };
      });

      const trendPoints = await Promise.all(
        months.map(async ({ y, m }) => {
          const key = `${y}-${String(m + 1).padStart(2, "0")}`;
          const label = new Date(y, m, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
          const employeesAtMonthEnd = allUsers.filter(
            (u: any) => !u.joiningDate || new Date(u.joiningDate) <= new Date(y, m + 1, 0)
          ).length;

          const pendingForMonth = allLeaves.filter((l: any) => {
            const d = new Date(l.fromDate);
            return d.getMonth() === m && d.getFullYear() === y && l.status === "PENDING";
          }).length;

          if (y === year && m === month) {
            return {
              label,
              employees: employeesAtMonthEnd,
              attendancePercent,
              payrollCount: payrollRes.data.length,
              pendingLeaves: pendingForMonth,
            };
          }

          try {
            const [attRes, payRes] = await Promise.all([
              axios.get(`${API_BASE}/attendance/all`, { headers, params: { month: m, year: y } }),
              axios.get(`${API_BASE}/payroll`, { headers, params: { month: key } }),
            ]);
            const p = attRes.data.attendance.filter((a: any) => a.punchIn && a.punchOut).length;
            const total = attRes.data.attendance.length;
            return {
              label,
              employees: employeesAtMonthEnd,
              attendancePercent: total ? Math.round((p / total) * 100) : 0,
              payrollCount: payRes.data.length,
              pendingLeaves: pendingForMonth,
            };
          } catch {
            return { label, employees: employeesAtMonthEnd, attendancePercent: 0, payrollCount: 0, pendingLeaves: pendingForMonth };
          }
        })
      );

      setTrend(trendPoints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ShieldCheck className="h-8 w-8 text-[var(--status-critical)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  const monthLabel = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const firstName = user?.name?.split(" ")[0];
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const complianceTone =
    stats.complianceStatus === "COMPLIANT"
      ? "good"
      : stats.complianceStatus === "PARTIAL"
      ? "warning"
      : "critical";

  const quickActions: {
    icon: React.ElementType;
    text: string;
    subtitle: string;
    tone: "primary" | "good" | "warning" | "critical" | "violet";
    onClick: () => void;
  }[] = [
    {
      icon: CalendarCheck,
      text: "Attendance Logs",
      subtitle: "Review daily punch records",
      tone: "primary" as const,
      onClick: () => navigate("/hrms/auditor/attendance"),
    },
    {
      icon: Wallet,
      text: "Payroll Reports",
      subtitle: "View processed payroll runs",
      tone: "good" as const,
      onClick: () => navigate("/hrms/auditor/payroll"),
    },
    {
      icon: CalendarX2,
      text: "Leave Records",
      subtitle: "Audit leave requests & history",
      tone: "warning" as const,
      onClick: () => navigate("/hrms/auditor/leaves"),
    },
    {
      icon: FileText,
      text: "Compliance Report",
      subtitle: "Organization-wide compliance",
      tone: "violet" as const,
      onClick: () => navigate("/hrms/auditor/compliance"),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {firstName ? `${greeting}, ${firstName}` : "Auditor Dashboard"} 👋
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Organization compliance & monthly overview · {monthLabel}
        </p>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        <StatCard
          label="Total Employees"
          value={stats.employees}
          icon={Users}
          tone="primary"
          sublabel="Across organization"
          sparklineData={trend.map((t) => t.employees)}
        />
        <StatCard
          label="Attendance"
          value={`${stats.attendancePercent}%`}
          icon={CalendarCheck}
          tone="good"
          sublabel={`${monthLabel} average`}
          sparklineData={trend.map((t) => t.attendancePercent)}
        />
        <StatCard
          label="Payroll Generated"
          value={stats.payrollCount}
          icon={Wallet}
          tone="violet"
          sublabel={`${monthLabel} records`}
          sparklineData={trend.map((t) => t.payrollCount)}
        />
        <StatCard
          label="Pending Leaves"
          value={stats.pendingLeaves}
          icon={CalendarX2}
          tone="warning"
          sublabel="This month"
          sparklineData={trend.map((t) => t.pendingLeaves)}
        />
        <StatCard
          label="Compliance Status"
          value={stats.complianceStatus}
          icon={ShieldCheck}
          tone={complianceTone}
          sublabel="Attendance & leave thresholds"
        />
      </div>

      {/* ================= TRENDS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardPanel title="Attendance % trend" subtitle="Last 6 months, org-wide average">
          <TrendChart
            data={trend.map((t) => ({ label: t.label, value: t.attendancePercent }))}
            color="var(--status-good)"
            unit="attendance"
          />
        </DashboardPanel>

        <DashboardPanel title="Payroll runs trend" subtitle="Records processed per month">
          <TrendChart
            data={trend.map((t) => ({ label: t.label, value: t.payrollCount }))}
            color="#7C3AED"
            unit="payroll records"
          />
        </DashboardPanel>
      </div>

      {/* ================= BREAKDOWNS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardPanel title="Attendance breakdown" subtitle={`${monthLabel} punch records`}>
          {stats.totalAttendanceRecords === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No attendance records for this month yet
            </p>
          ) : (
            <DonutChart
              centerLabel="Records"
              data={[
                { label: "Present", value: stats.presentCount, color: "var(--status-good)" },
                { label: "Absent", value: stats.absentCount, color: "var(--status-critical)" },
              ]}
            />
          )}
        </DashboardPanel>

        <DashboardPanel title="Leave requests" subtitle={`${monthLabel} status breakdown`}>
          {stats.approvedLeaves + stats.pendingLeaves + stats.rejectedLeaves === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No leave requests for this month
            </p>
          ) : (
            <DonutChart
              centerLabel="Leaves"
              data={[
                { label: "Approved", value: stats.approvedLeaves, color: "var(--status-good)" },
                { label: "Pending", value: stats.pendingLeaves, color: "var(--status-warning)" },
                { label: "Rejected", value: stats.rejectedLeaves, color: "var(--status-critical)" },
              ]}
            />
          )}
        </DashboardPanel>
      </div>

      {/* ================= QUICK ACCESS ================= */}
      <DashboardPanel title="Quick Access" subtitle="Jump to detailed audit reports">
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
