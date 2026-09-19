/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Building2,
  Mail,
  Briefcase,
} from "lucide-react";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

interface TeamMember {
  _id: string;
  name: string;
  employeeId?: string;
  email?: string;
  role: string;
  departmentId?: {
    _id?: string;
    name: string;
  };
  status?: string;
  managerId?: {
    _id: string;
    name?: string;
  };
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "" + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

export default function TeamMembers() {
  const token = localStorage.getItem("token");
  const loggedInUser = JSON.parse(localStorage.getItem("user") || "{}");
  const loggedInManagerId = loggedInUser?.id || loggedInUser?._id;

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const allUsers = res.data || [];
      const filteredTeam = allUsers.filter((user: TeamMember) => {
        return user.managerId?._id === loggedInManagerId || (user as any).managerId === loggedInManagerId;
      });

      setTeam(filteredTeam.length > 0 ? filteredTeam : allUsers);
    } catch (err) {
      console.error("Failed to fetch team members", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return team.filter((m) => {
      const matchesSearch =
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || (m.status || "Active").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [team, searchTerm, statusFilter]);

  const activeCount = useMemo(
    () => team.filter((m) => (m.status || "Active").toLowerCase() === "active").length,
    [team]
  );
  const inactiveCount = team.length - activeCount;
  const deptCount = useMemo(
    () => new Set(team.map((m) => m.departmentId?.name).filter(Boolean)).size,
    [team]
  );

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Team Members
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            View profiles and department assignments for all your direct reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] text-xs font-semibold">
            {team.length} Total Members
          </span>
        </div>
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Direct Reports"
          value={team.length}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Active Team Members"
          value={activeCount}
          icon={UserCheck}
          tone="good"
        />
        <StatCard
          label="Inactive Members"
          value={inactiveCount}
          icon={UserX}
          tone="critical"
        />
        <StatCard
          label="Departments Covered"
          value={deptCount}
          icon={Building2}
          tone="violet"
        />
      </div>

      {/* ================= SEARCH & CONTROLS ================= */}
      <DashboardPanel title="Direct Reports List" subtitle="Search and filter team records">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by name, emp ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        {filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            No team members matching your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredMembers.map((emp) => {
                  const status = emp.status || "Active";
                  const isActive = status.toLowerCase() === "active";

                  return (
                    <tr key={emp._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                            {getInitials(emp.name)}
                          </span>
                          <div>
                            <p className="font-semibold text-[var(--foreground)] text-sm">{emp.name}</p>
                            {emp.email && (
                              <p className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {emp.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono font-medium text-[var(--foreground)]">
                        {emp.employeeId || "—"}
                      </td>

                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)] font-medium capitalize">
                          <Briefcase className="h-3 w-3" />
                          {emp.role}
                        </span>
                      </td>

                      <td className="p-3 text-[var(--foreground)]">
                        {emp.departmentId?.name || "—"}
                      </td>

                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-semibold",
                            isActive
                              ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                              : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                          )}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
