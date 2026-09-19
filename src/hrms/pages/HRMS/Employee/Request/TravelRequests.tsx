/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AddTravelRequestModal from "./AddTravelRequestModal";
import UploadReceiptModal from "./UploadReciptModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { Plane, Plus, Search, Clock, CheckCircle2, IndianRupee, Eye, Trash2 } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

const TravelRequests = () => {
  const token = localStorage.getItem("token");

  const [requests, setRequests] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [receiptModal, setReceiptModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/travel-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch travel requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDelete = async () => {
    try {
      const res = await axios.delete(
        `${API_BASE}/travel-requests/${deleteItem._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        type: "success",
        title: "Travel Request Deleted",
        message: res?.data?.message || "Travel request deleted successfully",
      });

      setDeleteItem(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        message: error?.response?.data?.message || "Unable to delete travel request.",
      });
    }
  };

  const filteredRequests = useMemo(() =>
    requests.filter((r) =>
      r.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [requests, searchTerm]
  );

  const pendingCount = useMemo(() => requests.filter((r) => r.status === "PENDING").length, [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => r.status === "APPROVED").length, [requests]);
  const totalBudget = useMemo(() => requests.reduce((sum, r) => sum + (Number(r.budget) || 0), 0), [requests]);

  const formatDate = (date: string) => (date ? new Date(date).toLocaleDateString("en-GB") : "—");

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">My Travel Requests</h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Submit and manage official business travel applications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Request
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Travel Claims" value={requests.length} icon={Plane} tone="primary" />
        <StatCard label="Total Budget Requested" value={`₹${totalBudget.toLocaleString("en-IN")}`} icon={IndianRupee} tone="violet" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Approved Trips" value={approvedCount} icon={CheckCircle2} tone="good" />
      </div>

      {/* TABLE PANEL */}
      <DashboardPanel title="Travel Applications History" subtitle="Your business travel plans and status">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by purpose, destination or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            <Plane className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No travel requests found</p>
            <p className="mt-1">Click "Add Request" to submit a new travel plan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3">From Date</th>
                  <th className="p-3">To Date</th>
                  <th className="p-3">Budget</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredRequests.map((r) => {
                  const isApproved = r.status === "APPROVED";
                  const isRejected = r.status === "REJECTED";

                  return (
                    <tr key={r._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3 font-semibold text-[var(--foreground)]">{r.purpose}</td>
                      <td className="p-3 text-[var(--foreground)] font-medium">{r.destination}</td>
                      <td className="p-3 text-[var(--foreground)]">{formatDate(r.fromDate)}</td>
                      <td className="p-3 text-[var(--foreground)]">{formatDate(r.toDate)}</td>
                      <td className="p-3 font-bold text-[var(--foreground)]">₹{Number(r.budget || 0).toLocaleString("en-IN")}</td>
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
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(r);
                              setOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
                            title="View / Edit"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {r.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => setDeleteItem(r)}
                              className="p-1.5 rounded-lg border border-[color-mix(in_oklab,var(--status-critical)_25%,transparent)] text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {/* MODALS */}
      {open && (
        <AddTravelRequestModal
          open={open}
          data={selected}
          onClose={() => setOpen(false)}
          onSuccess={fetchRequests}
        />
      )}

      {receiptModal && (
        <UploadReceiptModal
          open={!!receiptModal}
          data={receiptModal}
          onClose={() => setReceiptModal(null)}
          onSuccess={fetchRequests}
        />
      )}

      {deleteItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-premium-lg">
            <h3 className="font-bold text-base text-[var(--foreground)] mb-2">Delete Travel Request?</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete this travel request?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--status-critical)] text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelRequests;
