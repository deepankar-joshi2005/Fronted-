/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { CalendarOff, Users, ClipboardList } from "lucide-react";
import Loader from "../../Loader";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { StatCard } from "@/components/ui/stat-card";

const API_BASE = import.meta.env.VITE_API_URL;

interface Leave {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  user: {
    name: string;
    role: string;
    email: string;
  };
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "" + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

const LeaveCalendar = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await axios.get(`${API_BASE}/leaves/manager/today`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        setLeaves(res.data || []);
      } catch (err) {
        console.error("Failed to fetch leaves", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Today's Team Leave Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Overview of direct report team members currently absent on approved leave.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] text-xs font-semibold">
            {leaves.length} Member{leaves.length === 1 ? "" : "s"} On Leave Today
          </span>
        </div>
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="On Leave Today"
          value={leaves.length}
          icon={CalendarOff}
          tone="warning"
          sublabel="Approved absences"
        />
        <StatCard
          label="Team Availability"
          value={leaves.length === 0 ? "100% Present" : "Partial Team Active"}
          icon={Users}
          tone="good"
          sublabel="Daily operational status"
        />
      </div>

      {/* ================= PANEL ================= */}
      <DashboardPanel title="Members On Leave" subtitle="Detailed leave records for today">
        {leaves.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-[var(--muted-foreground)] text-center">
            <div className="p-3 rounded-full bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] mb-3">
              <CalendarOff className="h-8 w-8" />
            </div>
            <p className="font-semibold text-sm text-[var(--foreground)]">No team members on leave today!</p>
            <p className="text-xs mt-1">Your entire team is scheduled to be active.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                          {getInitials(leave.user.name)}
                        </span>
                        <div>
                          <p className="font-semibold text-[var(--foreground)] text-sm">{leave.user.name}</p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">{leave.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[var(--foreground)] capitalize font-medium">{leave.user.role}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] font-semibold">
                        <ClipboardList className="h-3 w-3" />
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--foreground)] font-medium">{leave.startDate}</td>
                    <td className="p-3 text-[var(--foreground)] font-medium">{leave.endDate}</td>
                    <td className="p-3 text-[var(--muted-foreground)] max-w-xs truncate">
                      {leave.reason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
};

export default LeaveCalendar;
