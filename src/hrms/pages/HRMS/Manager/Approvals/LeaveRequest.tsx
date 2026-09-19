/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ClipboardList, Search, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
import LeaveViewModal from "./LeaveViewModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "" + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

export default function LeaveRequest() {
  const token = localStorage.getItem("token");

  const [leaves, setLeaves] = useState<any[]>([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employee/leaves/manager`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data || []);
    } catch (error) {
      console.error("Failed to fetch leave requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/employee/leaves/manager/leaves/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        type: "success",
        title: status === "APPROVED" ? "Leave Approved" : "Leave Rejected",
        message:
          res.data?.message ||
          `Leave has been ${status.toLowerCase()} successfully.`,
      });

      fetchLeaves();
    } catch (error: any) {
      console.error("Failed to update status", error);

      toast({
        type: "error",
        title: "Action Failed",
        message:
          error?.response?.data?.message ||
          "Unable to update leave status. Please try again.",
      });
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const matchesSearch =
        l.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.reason?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || l.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchTerm, statusFilter]);

  const pendingCount = useMemo(() => leaves.filter((l) => l.status === "PENDING").length, [leaves]);
  const approvedCount = useMemo(() => leaves.filter((l) => l.status === "APPROVED").length, [leaves]);
  const rejectedCount = useMemo(() => leaves.filter((l) => l.status === "REJECTED").length, [leaves]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Leave Requests
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Review, approve, or reject employee leave applications.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_25%,transparent)] text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>{pendingCount} Pending Approvals</span>
          </div>
        )}
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={leaves.length}
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Approved Leaves"
          value={approvedCount}
          icon={CheckCircle2}
          tone="good"
        />
        <StatCard
          label="Rejected Leaves"
          value={rejectedCount}
          icon={XCircle}
          tone="critical"
        />
      </div>

      {/* ================= PANEL & TABLE ================= */}
      <DashboardPanel title="Leave Applications List" subtitle="Search and process applications">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by employee or leave type..."
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
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            No leave requests found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredLeaves.map((l) => {
                  const status = l.status || "PENDING";
                  const isApproved = status === "APPROVED";
                  const isRejected = status === "REJECTED";

                  return (
                    <tr key={l._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                            {getInitials(l.employee?.name)}
                          </span>
                          <div>
                            <p className="font-semibold text-[var(--foreground)] text-sm">{l.employee?.name || "—"}</p>
                            {l.employee?.email && (
                              <p className="text-[11px] text-[var(--muted-foreground)]">{l.employee.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-medium text-[var(--foreground)]">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)] font-semibold">
                          {l.leaveType}
                        </span>
                      </td>

                      <td className="p-3 text-[var(--foreground)] font-medium">{formatDate(l.fromDate)}</td>
                      <td className="p-3 text-[var(--foreground)] font-medium">{formatDate(l.toDate)}</td>

                      <td className="p-3 font-semibold text-[var(--foreground)]">
                        {l.totalDays} Day{l.totalDays > 1 ? "s" : ""}
                      </td>

                      <td className="p-3">
                        <select
                          value={status}
                          onChange={(e) => updateStatus(l._id, e.target.value)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-colors",
                            isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] border-[color-mix(in_oklab,var(--status-good)_30%,transparent)]",
                            isRejected && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)] border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)]",
                            !isApproved && !isRejected && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)]"
                          )}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVE</option>
                          <option value="REJECTED">REJECT</option>
                        </select>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeave(l);
                            setViewOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      <LeaveViewModal
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedLeave(null);
        }}
        data={selectedLeave}
      />
    </div>
  );
}
