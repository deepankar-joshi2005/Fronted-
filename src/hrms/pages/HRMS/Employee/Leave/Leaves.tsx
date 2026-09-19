/** @format */
import { useEffect, useState, useMemo } from "react";
import ApplyLeaveModal from "./ApplyLeaveModal";
import axios from "axios";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { Plus, Search, ClipboardList, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const Leave = () => {
  const API_BASE = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [leaves, setLeaves] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLeave, setDeleteLeave] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employee/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data || []);
    } catch (error) {
      console.error("Failed to fetch leaves", error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const confirmDelete = async () => {
    try {
      const res = await axios.delete(`${API_BASE}/employee/leaves/${deleteLeave._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ type: "success", title: "Leave Deleted", message: res.data?.message || "Leave deleted successfully" });
      setDeleteModal(false);
      setDeleteLeave(null);
      fetchLeaves();
    } catch (error: any) {
      toast({ type: "error", title: "Delete Failed", message: error?.response?.data?.message || "Failed to delete leave" });
    }
  };

  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) =>
      l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaves, searchTerm]);

  const pendingCount = useMemo(() => leaves.filter((l) => l.status === "PENDING").length, [leaves]);
  const approvedCount = useMemo(() => leaves.filter((l) => l.status === "APPROVED").length, [leaves]);
  const rejectedCount = useMemo(() => leaves.filter((l) => l.status === "REJECTED").length, [leaves]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">Apply Leave</h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">Submit and track your leave applications.</p>
        </div>
        <button
          type="button"
          onClick={() => { setSelected(null); setOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={leaves.length} icon={ClipboardList} tone="primary" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Approved Leaves" value={approvedCount} icon={CheckCircle2} tone="good" />
        <StatCard label="Rejected Leaves" value={rejectedCount} icon={XCircle} tone="critical" />
      </div>

      <DashboardPanel title="My Leave Applications" subtitle="All your submitted leave requests">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by leave type, status or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No leave applications</p>
            <p className="text-xs mt-1">Apply for leave using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredLeaves.map((l, i) => {
                  const isApproved = l.status === "APPROVED";
                  const isRejected = l.status === "REJECTED";
                  const days = Math.ceil((new Date(l.toDate).getTime() - new Date(l.fromDate).getTime()) / 86400000) + 1;
                  return (
                    <tr key={l._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3 text-[var(--muted-foreground)]">{i + 1}</td>
                      <td className="p-3 font-semibold text-[var(--foreground)]">{l.leaveType}</td>
                      <td className="p-3 text-[var(--foreground)]">{formatDate(l.fromDate)}</td>
                      <td className="p-3 text-[var(--foreground)]">{formatDate(l.toDate)}</td>
                      <td className="p-3 font-bold text-[var(--primary)]">{days}d</td>
                      <td className="p-3 text-[var(--muted-foreground)] max-w-[160px] truncate">{l.reason || "—"}</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                          isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                          isRejected && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
                          !isApproved && !isRejected && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}>
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {l.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => { setSelected(l); setOpen(true); }}
                              className="px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--primary)] text-xs font-semibold hover:bg-[var(--muted)] transition-colors">
                              Edit
                            </button>
                            <button type="button" onClick={() => { setDeleteLeave(l); setDeleteModal(true); }}
                              className="p-1.5 rounded-lg border border-[color-mix(in_oklab,var(--status-critical)_25%,transparent)] text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {l.status !== "PENDING" && <span className="text-[11px] text-[var(--muted-foreground)] opacity-50">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {open && (
        <ApplyLeaveModal
          open={open}
          onClose={() => { setOpen(false); setSelected(null); }}
          onSuccess={fetchLeaves}
          editData={selected}
        />
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-premium-lg">
            <h3 className="font-bold text-base text-[var(--foreground)] mb-2">Delete Leave?</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80">Cancel</button>
              <button type="button" onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--status-critical)] text-white hover:opacity-90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
