/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { UserCog, Search, CheckCircle2, Clock, XCircle, Eye } from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

interface User {
  _id: string;
  name: string;
  role: string;
}

interface ProfileUpdateRequest {
  _id: string;
  employee: User;
  updateType: string;
  newValue: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "" + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

const EmployeeProfileUpdateRequest = () => {
  const token = localStorage.getItem("token");

  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([]);
  const [selected, setSelected] = useState<ProfileUpdateRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/profile-update/team-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch profile update requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(true);

      const res = await axios.patch(
        `${API_BASE}/profile-update/${id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        type: "success",
        title:
          status === "APPROVED"
            ? "Profile Update Approved"
            : "Profile Update Rejected",
        message:
          res.data?.message ||
          `Profile update request has been ${status.toLowerCase()} successfully.`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Action Failed",
        message:
          error?.response?.data?.message ||
          "Unable to update profile request. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.updateType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.newValue?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || r.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === "PENDING").length, [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => r.status === "APPROVED").length, [requests]);
  const rejectedCount = useMemo(() => requests.filter((r) => r.status === "REJECTED").length, [requests]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <UserCog className="h-6 w-6 text-[var(--primary)]" />
            Profile Update Requests
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Review requests to modify personal, contact, or bank details.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_25%,transparent)] text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>{pendingCount} Pending Updates</span>
          </div>
        )}
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Profile Requests"
          value={requests.length}
          icon={UserCog}
          tone="primary"
        />
        <StatCard
          label="Pending Review"
          value={pendingCount}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Approved Updates"
          value={approvedCount}
          icon={CheckCircle2}
          tone="good"
        />
        <StatCard
          label="Rejected Reqs"
          value={rejectedCount}
          icon={XCircle}
          tone="critical"
        />
      </div>

      {/* ================= PANEL & TABLE ================= */}
      <DashboardPanel title="Profile Update Log" subtitle="Search and update request statuses">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search employee, field, or new value..."
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

        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            No profile update requests found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Field</th>
                  <th className="p-3">Requested New Value</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredRequests.map((req) => {
                  const isApproved = req.status === "APPROVED";
                  const isRejected = req.status === "REJECTED";

                  return (
                    <tr key={req._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                            {getInitials(req.employee?.name)}
                          </span>
                          <div>
                            <p className="font-semibold text-[var(--foreground)] text-sm">{req.employee?.name || "—"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-semibold text-[var(--foreground)] capitalize">
                        {req.updateType}
                      </td>

                      <td className="p-3 font-mono text-[var(--foreground)] font-medium">
                        {req.newValue}
                      </td>

                      <td className="p-3">
                        {req.status === "PENDING" ? (
                          <select
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] cursor-pointer outline-none transition-colors"
                            defaultValue="PENDING"
                            disabled={actionLoading}
                            onChange={(e) =>
                              updateStatus(
                                req._id,
                                e.target.value as "APPROVED" | "REJECTED"
                              )
                            }
                          >
                            <option value="PENDING" disabled>
                              PENDING
                            </option>
                            <option value="APPROVED">APPROVE</option>
                            <option value="REJECTED">REJECT</option>
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-semibold",
                              isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                              isRejected && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                            )}
                          >
                            {req.status}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(req)}
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

      {/* VIEW DIALOG */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md bg-[var(--card)] border-[var(--border)] text-[var(--foreground)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Profile Update Request Details</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-3 text-xs pt-2">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Employee:</span>
                <span className="font-semibold">{selected.employee?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Field to Update:</span>
                <span className="font-semibold capitalize">{selected.updateType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Requested New Value:</span>
                <span className="font-mono font-bold">{selected.newValue}</span>
              </div>
              <div className="py-1">
                <span className="text-[var(--muted-foreground)] block mb-1">Reason:</span>
                <p className="bg-[var(--muted)] p-2.5 rounded-lg text-xs italic">{selected.reason || "No reason specified"}</p>
              </div>
              <div className="flex justify-between py-1 border-t border-[var(--border)] pt-2">
                <span className="text-[var(--muted-foreground)]">Status:</span>
                <Badge variant={selected.status === "APPROVED" ? "success" : "destructive"}>{selected.status}</Badge>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)] opacity-70 text-right pt-1">
                Requested on {new Date(selected.createdAt).toLocaleString()}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeProfileUpdateRequest;
