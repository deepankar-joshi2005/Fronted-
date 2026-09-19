/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  CalendarCheck,
  UserX,
  ClipboardList,
  Clock,
  Receipt,
  ArrowRight,
  Target,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { DonutChart } from "@/components/ui/donut-chart";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

interface PendingLeave {
  _id: string;
  employee?: { name: string; email?: string };
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  status: string;
}

interface PendingAttendance {
  _id: string;
  user?: { name: string };
  date: string;
  type: string;
  punchIn?: string;
  punchOut?: string;
  status: string;
}

interface ManagerDashboardStats {
  teamMembers: number;
  attendance: {
    present: number;
    absent: number;
    onLeave: number;
  };
  approvals: {
    leaves: number;
    attendance: number;
    expenses: number;
    travel: number;
    overtime: number;
  };
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ManagerDashboardStats | null>(null);
  const [pendingLeavesList, setPendingLeavesList] = useState<PendingLeave[]>([]);
  const [pendingAttendanceList, setPendingAttendanceList] = useState<PendingAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [
        teamRes,
        attendanceRes,
        leaveRes,
        attendanceApprovalRes,
        expenseRes,
        travelRes,
        overtimeRes,
      ] = await Promise.all([
        axios.get(`${API_BASE}/users`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/attendance/all`, {
          headers,
          params: { year, month },
        }).catch(() => ({ data: { totalTodayPresent: 0 } })),
        axios.get(`${API_BASE}/employee/leaves/all`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/attendance-request/manager`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/expenses/manager`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/travel-requests/manager`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/overtime/team-requests`, { headers }).catch(() => ({ data: [] })),
      ]);

      const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
      const loggedInManagerId = loggedInUser?.id || loggedInUser?._id;

      // Filter team users for logged-in manager if backend returns all users
      const allUsers = teamRes.data || [];
      const teamList = allUsers.filter(
        (u: any) => u.managerId?._id === loggedInManagerId || u.managerId === loggedInManagerId
      );
      const teamCount = teamList.length || allUsers.length;

      // Attendance calculations
      const present = attendanceRes.data?.totalTodayPresent || 0;

      const approvedLeavesTodayList = (leaveRes.data || []).filter((lv: any) => {
        const from = lv.fromDate?.split("T")[0];
        const to = lv.toDate?.split("T")[0];
        return lv.status === "APPROVED" && todayStr >= from && todayStr <= to;
      });
      const onLeaveCount = approvedLeavesTodayList.length;

      const absent = Math.max(0, teamCount - present - onLeaveCount);

      // Pending approvals
      const rawLeaves = leaveRes.data || [];
      const pendingLeaves = rawLeaves.filter((lv: any) => lv.status === "PENDING");

      const rawAttReqs = attendanceApprovalRes.data || [];
      const pendingAttendance = rawAttReqs.filter((a: any) => a.status === "PENDING");

      const rawExpenses = expenseRes.data || [];
      const pendingExpenses = rawExpenses.filter((e: any) => e.status === "PENDING");

      const rawTravel = travelRes.data || [];
      const pendingTravel = rawTravel.filter((t: any) => t.status === "PENDING");

      const rawOvertime = overtimeRes.data || [];
      const pendingOvertime = rawOvertime.filter((o: any) => o.status === "PENDING");

      setStats({
        teamMembers: teamCount,
        attendance: {
          present,
          absent,
          onLeave: onLeaveCount,
        },
        approvals: {
          leaves: pendingLeaves.length,
          attendance: pendingAttendance.length,
          expenses: pendingExpenses.length,
          travel: pendingTravel.length,
          overtime: pendingOvertime.length,
        },
      });

      setPendingLeavesList(pendingLeaves.slice(0, 5));
      setPendingAttendanceList(pendingAttendance.slice(0, 5));
    } catch (err) {
      console.error("Manager dashboard load error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const attendanceDonutSlices = [
    { label: "Present", value: stats?.attendance.present || 0, color: "var(--status-good)" },
    { label: "On Leave", value: stats?.attendance.onLeave || 0, color: "var(--status-warning)" },
    { label: "Absent", value: stats?.attendance.absent || 0, color: "var(--status-critical)" },
  ];

  const totalPending =
    (stats?.approvals.leaves || 0) +
    (stats?.approvals.attendance || 0) +
    (stats?.approvals.expenses || 0) +
    (stats?.approvals.travel || 0) +
    (stats?.approvals.overtime || 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back, {user?.name || "Manager"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Here is your team overview and pending operational requests for today.
          </p>
        </div>

        {totalPending > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_25%,transparent)] text-xs font-semibold">
            <AlertCircle className="h-4 w-4" />
            <span>{totalPending} Action items pending</span>
          </div>
        )}
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Team Members"
          value={stats?.teamMembers || 0}
          icon={Users}
          tone="primary"
          sublabel="Direct reports"
        />
        <StatCard
          label="Present Today"
          value={stats?.attendance.present || 0}
          icon={CalendarCheck}
          tone="good"
          sublabel="Active on shift"
        />
        <StatCard
          label="Absent Today"
          value={stats?.attendance.absent || 0}
          icon={UserX}
          tone="critical"
          sublabel="Unexcused / Off"
        />
        <StatCard
          label="Pending Leaves"
          value={stats?.approvals.leaves || 0}
          icon={ClipboardList}
          tone="warning"
          sublabel="Leave approvals"
        />
        <StatCard
          label="Attendance Reqs"
          value={stats?.approvals.attendance || 0}
          icon={Clock}
          tone="warning"
          sublabel="Regularizations"
        />
        <StatCard
          label="Expenses / Travel"
          value={(stats?.approvals.expenses || 0) + (stats?.approvals.travel || 0)}
          icon={Receipt}
          tone="violet"
          sublabel="Reimbursements"
        />
      </div>

      {/* ================= MIDDLE ROW: DONUT & QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DONUT CHART */}
        <DashboardPanel
          title="Today's Team Attendance Breakdown"
          subtitle="Real-time distribution of your team members"
          className="lg:col-span-1"
        >
          <div className="py-2">
            <DonutChart data={attendanceDonutSlices} centerLabel="Members" />
          </div>
        </DashboardPanel>

        {/* QUICK ACTIONS & MODULE ACCESS */}
        <DashboardPanel
          title="Management Shortcuts"
          subtitle="Quick access to daily manager workflows"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => navigate("/hrms/manager/team")}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_4%,transparent)] transition-all text-left group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">Team Directory</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">View profiles & roles</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/hrms/manager/approvals/leaves")}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--status-good)] hover:bg-[color-mix(in_oklab,var(--status-good)_4%,transparent)] transition-all text-left group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] group-hover:scale-105 transition-transform">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">Leave Requests</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">Approve/Reject leaves ({stats?.approvals.leaves || 0})</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--status-good)] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/hrms/manager/approvals/expenses")}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--status-warning)] hover:bg-[color-mix(in_oklab,var(--status-warning)_4%,transparent)] transition-all text-left group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] group-hover:scale-105 transition-transform">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">Expense Claims</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">Review reimbursements ({stats?.approvals.expenses || 0})</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[var(--status-warning)] group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/hrms/manager/performance/goals")}
              className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[#7C3AED] hover:bg-[color-mix(in_oklab,#7C3AED_4%,transparent)] transition-all text-left group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,#7C3AED_14%,transparent)] text-[#7C3AED] group-hover:scale-105 transition-transform">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">Goals & OKRs</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">Track team objectives</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </DashboardPanel>
      </div>

      {/* ================= BOTTOM ROW: PENDING LEAVES & ATTENDANCE REQS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PENDING LEAVE REQUESTS */}
        <DashboardPanel
          title="Pending Leave Applications"
          subtitle="Recent leave applications awaiting your approval"
          action={
            <button
              type="button"
              onClick={() => navigate("/hrms/manager/approvals/leaves")}
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          {pendingLeavesList.length === 0 ? (
            <div className="py-8 text-center text-[var(--muted-foreground)] text-xs">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[var(--status-good)] opacity-80" />
              No pending leave requests!
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingLeavesList.map((lv) => (
                <div key={lv._id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{lv.employee?.name || "Employee"}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {lv.leaveType} • {new Date(lv.fromDate).toLocaleDateString()} to {new Date(lv.toDate).toLocaleDateString()} ({lv.totalDays} day{lv.totalDays > 1 ? "s" : ""})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/hrms/manager/approvals/leaves")}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>

        {/* PENDING ATTENDANCE REGULARIZATIONS */}
        <DashboardPanel
          title="Pending Attendance Corrections"
          subtitle="Punch correction & regularization requests"
          action={
            <button
              type="button"
              onClick={() => navigate("/hrms/manager/approvals/attendance")}
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        >
          {pendingAttendanceList.length === 0 ? (
            <div className="py-8 text-center text-[var(--muted-foreground)] text-xs">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[var(--status-good)] opacity-80" />
              No pending attendance corrections!
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingAttendanceList.map((att) => (
                <div key={att._id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{att.user?.name || "Employee"}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {att.type} • Date: {new Date(att.date).toLocaleDateString()} (In: {att.punchIn || "—"} / Out: {att.punchOut || "—"})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/hrms/manager/approvals/attendance")}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--primary)] text-white hover:opacity-90"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
