/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Plus, Eye, Pencil, Trash2, X, LogOut, Clock, CheckCircle2, Search } from "lucide-react";
import { toast } from "../../Alert/Toast";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface Resignation {
  _id: string;
  resignationType: string;
  reasonCategory: string;
  reasonText: string;
  expectedLastWorkingDay: string;
  documents?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function ResignationRequest() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState<Resignation[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [viewItem, setViewItem] = useState<Resignation | null>(null);
  const [editItem, setEditItem] = useState<Resignation | null>(null);
  const [deleteItem, setDeleteItem] = useState<Resignation | null>(null);

  const [form, setForm] = useState({
    resignationType: "",
    reasonCategory: "",
    reasonText: "",
    expectedLastWorkingDay: "",
    documents: "",
  });

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/resignation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch resignation requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    let newErrors: any = {};
    if (!form.resignationType) newErrors.resignationType = "Resignation type is required";
    if (!form.reasonCategory) newErrors.reasonCategory = "Reason category is required";
    if (!form.reasonText) newErrors.reasonText = "Detailed reason is required";
    if (!form.expectedLastWorkingDay) newErrors.expectedLastWorkingDay = "Expected last working day is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editItem) {
        await axios.put(`${API}/resignation/${editItem._id}`, form, { headers });
        toast({ type: "success", title: "Updated", message: "Resignation request updated successfully" });
      } else {
        await axios.post(`${API}/resignation`, form, { headers });
        toast({ type: "success", title: "Submitted", message: "Resignation request submitted successfully" });
      }
      setOpen(false);
      fetchRequests();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Action Failed",
        message: error?.response?.data?.message || "Failed to submit resignation request",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await axios.delete(`${API}/resignation/${deleteItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ type: "success", title: "Deleted", message: "Resignation request deleted successfully" });
      setDeleteOpen(false);
      setDeleteItem(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Failed",
        message: error?.response?.data?.message || "Failed to delete request",
      });
    }
  };

  const filteredData = useMemo(() =>
    data.filter((d) =>
      d.resignationType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reasonCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.status?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [data, searchTerm]
  );

  const pendingCount = useMemo(() => data.filter((d) => d.status === "PENDING").length, [data]);
  const approvedCount = useMemo(() => data.filter((d) => d.status === "APPROVED").length, [data]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">Resignation Requests</h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Submit and track official separation or exit requests.
          </p>
        </div>

        {data.length === 0 && (
          <button
            type="button"
            onClick={() => {
              setEditItem(null);
              setForm({ resignationType: "", reasonCategory: "", reasonText: "", expectedLastWorkingDay: "", documents: "" });
              setErrors({});
              setOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Submit Resignation
          </button>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Resignation Claims" value={data.length} icon={LogOut} tone="primary" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Approved Exit Requests" value={approvedCount} icon={CheckCircle2} tone="good" />
      </div>

      {/* TABLE PANEL */}
      <DashboardPanel title="Resignation History" subtitle="Submitted exit notices and notice period details">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by category or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            <LogOut className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No resignation requests</p>
            <p className="mt-1">Active resignation notices will be listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Resignation Type</th>
                  <th className="p-3">Reason Category</th>
                  <th className="p-3">Expected Last Working Day</th>
                  <th className="p-3">Notice Period</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredData.map((row) => {
                  const isApproved = row.status === "APPROVED";
                  const isRejected = row.status === "REJECTED";

                  return (
                    <tr key={row._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3 font-semibold text-[var(--foreground)]">{row.resignationType}</td>
                      <td className="p-3 text-[var(--foreground)] font-medium">{row.reasonCategory}</td>
                      <td className="p-3 font-bold text-[var(--primary)]">
                        {new Date(row.expectedLastWorkingDay).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3 text-[var(--muted-foreground)]">30 Days Standard</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                          isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                          isRejected && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
                          !isApproved && !isRejected && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewItem(row)}
                            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {row.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditItem(row);
                                  setForm({
                                    resignationType: row.resignationType,
                                    reasonCategory: row.reasonCategory,
                                    reasonText: row.reasonText,
                                    expectedLastWorkingDay: row.expectedLastWorkingDay ? row.expectedLastWorkingDay.split("T")[0] : "",
                                    documents: row.documents || "",
                                  });
                                  setErrors({});
                                  setOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteItem(row);
                                  setDeleteOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-[color-mix(in_oklab,var(--status-critical)_25%,transparent)] text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
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

      {/* CREATE / EDIT MODAL */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-premium-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="font-bold text-base text-[var(--foreground)]">
                {editItem ? "Edit Resignation" : "Submit Resignation"}
              </h3>
              <button onClick={() => setOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Resignation Type</label>
                <select
                  value={form.resignationType}
                  onChange={(e) => setForm({ ...form, resignationType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none"
                >
                  <option value="">Select Type</option>
                  <option value="Voluntary Resignation">Voluntary Resignation</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Higher Education">Higher Education</option>
                  <option value="Career Transition">Career Transition</option>
                </select>
                {errors.resignationType && <p className="text-[var(--status-critical)] text-[10px] mt-1">{errors.resignationType}</p>}
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Reason Category</label>
                <select
                  value={form.reasonCategory}
                  onChange={(e) => setForm({ ...form, reasonCategory: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none"
                >
                  <option value="">Select Category</option>
                  <option value="Better Opportunity">Better Opportunity</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Health Issues">Health Issues</option>
                  <option value="Other">Other</option>
                </select>
                {errors.reasonCategory && <p className="text-[var(--status-critical)] text-[10px] mt-1">{errors.reasonCategory}</p>}
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Expected Last Working Day</label>
                <input
                  type="date"
                  value={form.expectedLastWorkingDay}
                  onChange={(e) => setForm({ ...form, expectedLastWorkingDay: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none"
                />
                {errors.expectedLastWorkingDay && <p className="text-[var(--status-critical)] text-[10px] mt-1">{errors.expectedLastWorkingDay}</p>}
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Detailed Reason</label>
                <textarea
                  rows={3}
                  value={form.reasonText}
                  onChange={(e) => setForm({ ...form, reasonText: e.target.value })}
                  placeholder="Provide details regarding your separation request..."
                  className="w-full p-2.5 rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none"
                />
                {errors.reasonText && <p className="text-[var(--status-critical)] text-[10px] mt-1">{errors.reasonText}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--primary)] text-white hover:opacity-90"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-premium-lg">
            <h3 className="font-bold text-base text-[var(--foreground)] mb-4 border-b border-[var(--border)] pb-2">
              Resignation Details
            </h3>
            <div className="space-y-2.5 text-xs text-[var(--foreground)]">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Type:</span>
                <span className="font-semibold">{viewItem.resignationType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Category:</span>
                <span className="font-semibold">{viewItem.reasonCategory}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Expected Last Day:</span>
                <span className="font-bold text-[var(--primary)]">
                  {new Date(viewItem.expectedLastWorkingDay).toLocaleDateString("en-GB")}
                </span>
              </div>
              <div className="py-1">
                <span className="text-[var(--muted-foreground)] block mb-1">Reason:</span>
                <p className="bg-[var(--muted)] p-2.5 rounded-lg text-xs italic">{viewItem.reasonText}</p>
              </div>
              <div className="flex justify-between py-1 border-t border-[var(--border)] pt-2">
                <span className="text-[var(--muted-foreground)]">Status:</span>
                <span className="font-bold">{viewItem.status}</span>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteOpen && deleteItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-premium-lg">
            <h3 className="font-bold text-base text-[var(--foreground)] mb-2">Delete Resignation Request?</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
}
