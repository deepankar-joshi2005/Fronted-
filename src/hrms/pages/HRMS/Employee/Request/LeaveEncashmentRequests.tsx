/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AddLeaveEncashmentModal from "./AddLeaveEncashmentModal";
import { toast } from "../../Alert/Toast";
import Loader from "../../Loader";
import { Wallet, Plus, Search, Clock, CheckCircle2, IndianRupee } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

const LeaveEncashmentRequests = () => {
  const token = localStorage.getItem("token");

  const [requests, setRequests] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/leave-encashment/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch leave encashment requests", err);
      toast({
        type: "error",
        title: "Fetch Failed",
        message: "Unable to load your requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRequests = useMemo(() =>
    requests.filter((r) =>
      r.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [requests, searchTerm]
  );

  const pendingCount = useMemo(() => requests.filter((r) => r.status === "PENDING").length, [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => r.status === "APPROVED").length, [requests]);
  const totalEncashDays = useMemo(() => requests.reduce((sum, r) => sum + (Number(r.requestedDays) || 0), 0), [requests]);

  const formatDate = (date: string) => (date ? new Date(date).toLocaleDateString("en-GB") : "—");

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Leave Encashment Requests
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Submit requests to encash eligible unused leave balances for cash payout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Request Encashment
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Encash Claims" value={requests.length} icon={Wallet} tone="primary" />
        <StatCard label="Total Encash Days" value={`${totalEncashDays} days`} icon={IndianRupee} tone="violet" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Approved Claims" value={approvedCount} icon={CheckCircle2} tone="good" />
      </div>

      {/* TABLE PANEL */}
      <DashboardPanel title="My Leave Encashment History" subtitle="Submitted encashment applications">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by leave type or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No encashment requests found</p>
            <p className="mt-1">Submit an encashment request using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Requested Days</th>
                  <th className="p-3">Estimated Amount</th>
                  <th className="p-3">Submitted Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredRequests.map((r) => {
                  const isApproved = r.status === "APPROVED";
                  const isRejected = r.status === "REJECTED";

                  return (
                    <tr key={r._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3 font-semibold text-[var(--foreground)]">{r.leaveType || "Earned Leave"}</td>
                      <td className="p-3 font-bold text-[var(--primary)]">{r.requestedDays} days</td>
                      <td className="p-3 font-bold text-[var(--foreground)]">
                        {r.totalAmount ? `₹${Number(r.totalAmount).toLocaleString("en-IN")}` : "Calculated on approval"}
                      </td>
                      <td className="p-3 text-[var(--foreground)]">{formatDate(r.createdAt)}</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                          isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                          isRejected && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
                          !isApproved && !isRejected && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {isApproved ? (
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                            r.paymentStatus === "PAID"
                              ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                              : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                          )}>
                            {r.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                          </span>
                        ) : (
                          <span className="text-[var(--muted-foreground)] opacity-40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {/* MODAL */}
      {open && (
        <AddLeaveEncashmentModal
          open={open}
          onClose={() => setOpen(false)}
          onSuccess={fetchRequests}
        />
      )}
    </div>
  );
};

export default LeaveEncashmentRequests;
