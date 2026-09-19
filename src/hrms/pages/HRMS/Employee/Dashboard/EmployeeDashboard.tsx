/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import {
  CalendarCheck,
  Wallet,
  Clock,
  IndianRupee,
  Receipt,
  Target,
  ArrowRight,
  ClipboardList,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { DonutChart } from "@/components/ui/donut-chart";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

interface EmployeeDashboardStats {
  attendance: {
    present: number;
    total: number;
  };
  leaves: {
    used: number;
    balance: number;
    pending: number;
  };
  payroll: {
    lastSalary: number;
    month: string;
  };
  expenses: {
    submitted: number;
  };
  goals: {
    total: number;
    completed: number;
  };
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<EmployeeDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [
        attendanceRes,
        leaveSummaryRes,
        employeeLeavesRes,
        expenseRes,
        travelReqRes,
        attendanceReqRes,
        payslipRes,
        goalsRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/attendance/me`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/leave-balance-adjustments/my-balances`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/employee/leaves`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/expenses/me`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/travel-requests`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/attendance-request/me`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/payslips/me/my-payslips`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/goals/my-assigned`, { headers }).catch(() => ({ data: [] })),
      ]);

      /* ================= ATTENDANCE ================= */
      const monthlyAttendance = (attendanceRes.data || []).filter((a: any) => {
        const d = new Date(a.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const presentCount = monthlyAttendance.filter(
        (a: any) => a.status === "PRESENT"
      ).length;

      /* ================= LEAVES ================= */
      const leaveSummary = (leaveSummaryRes.data || []) as any[];
      const totalBalance = leaveSummary.reduce((sum, item) => sum + (item.balance || 0), 0);
      const totalUsed = leaveSummary.reduce((sum, item) => sum + (item.used || 0), 0);

      const pendingLeaves = (employeeLeavesRes.data || []).filter(
        (l: any) => l.status === "PENDING"
      ).length;

      /* ================= PENDING REQUESTS ================= */
      const pendingExpenses = (expenseRes.data || []).filter(
        (e: any) => e.status === "Pending"
      ).length;

      const pendingTravel = (travelReqRes.data || []).filter(
        (t: any) => t.status === "Pending"
      ).length;

      const pendingAttendanceReq = (attendanceReqRes.data || []).filter(
        (a: any) => a.status === "Pending"
      ).length;

      const totalPendingRequests =
        pendingExpenses + pendingTravel + pendingLeaves + pendingAttendanceReq;

      /* ================= PAYROLL ================= */
      const sortedPayslips = [...(payslipRes.data || [])].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const lastPayslip = sortedPayslips[0];

      /* ================= SET STATS ================= */
      setStats({
        attendance: {
          present: presentCount,
          total: totalDaysInMonth,
        },
        leaves: {
          used: totalUsed,
          balance: totalBalance,
          pending: totalPendingRequests,
        },
        payroll: {
          lastSalary: lastPayslip ? lastPayslip.netSalary : 0,
          month: lastPayslip ? lastPayslip.month : "-",
        },
        expenses: {
          submitted: (expenseRes.data || []).length,
        },
        goals: {
          total: (goalsRes.data || []).length,
          completed: (goalsRes.data || []).filter((g: any) => g.completed || g.status === "Completed").length,
        },
      });
    } catch (err) {
      console.error("Employee dashboard load error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const attendanceDonutSlices = [
    { label: "Days Attended", value: stats?.attendance.present || 0, color: "var(--status-good)" },
    { label: "Remaining Days", value: Math.max(0, (stats?.attendance.total || 30) - (stats?.attendance.present || 0)), color: "var(--primary)" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back, {user?.name || "Employee"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Track your attendance, salary structure, leave balance, and performance goals.
          </p>
        </div>

        {stats && stats.leaves.pending > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_25%,transparent)] text-xs font-semibold">
            <Clock className="h-4 w-4" />
            <span>{stats.leaves.pending} Pending Requests</span>
          </div>
        )}
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Attendance"
          value={`${stats?.attendance.present || 0}/${stats?.attendance.total || 30}`}
          icon={CalendarCheck}
          tone="good"
          sublabel="Days logged this month"
        />
        <StatCard
          label="Leave Balance"
          value={stats?.leaves.balance || 0}
          icon={Wallet}
          tone="primary"
          sublabel="Available leave days"
        />
        <StatCard
          label="Pending Requests"
          value={stats?.leaves.pending || 0}
          icon={Clock}
          tone="warning"
          sublabel="Awaiting approval"
        />
        <StatCard
          label="Last Salary"
          value={`₹${(stats?.payroll.lastSalary || 0).toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="violet"
          sublabel={stats?.payroll.month ? `Month: ${stats.payroll.month}` : "Latest payout"}
        />
        <StatCard
          label="Expenses Submitted"
          value={stats?.expenses.submitted || 0}
          icon={Receipt}
          tone="primary"
          sublabel="Reimbursement claims"
        />
        <StatCard
          label="Goals Progress"
          value={`${stats?.goals.completed || 0}/${stats?.goals.total || 0}`}
          icon={Target}
          tone="good"
          sublabel="Completed objectives"
        />
      </div>

      {/* ================= MIDDLE ROW: ATTENDANCE DONUT & QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DONUT CHART */}
        <DashboardPanel
          title="Monthly Attendance Overview"
          subtitle="Real-time attendance progress for current month"
          className="lg:col-span-1"
        >
          <div className="py-2">
            <DonutChart data={attendanceDonutSlices} centerLabel="Days" />
          </div>
        </DashboardPanel>

        {/* QUICK ACTIONS & SHORTCUTS */}
        <DashboardPanel
          title="Quick Actions"
          subtitle="Direct shortcuts to common employee actions"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate("/hrms/employee/attendance/mark")}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--foreground)]">Mark Attendance</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Punch in/out for shift</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/hrms/employee/leave/apply")}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--foreground)]">Apply Leave</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Request time off</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/hrms/employee/payroll/payslips")}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--foreground)]">View Payslip</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Download monthly salary slip</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/hrms/employee/performance/goals")}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--foreground)]">My Goals & OKRs</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Review target objectives</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}
