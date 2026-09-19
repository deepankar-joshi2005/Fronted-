/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "@/api/axiosInstance";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { Plus, Eye, Pencil, Trash2, Clock, CheckCircle2, Search, X } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

interface Overtime {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  hours: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default function EmployeeOvertimeRequest() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Overtime[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [viewItem, setViewItem] = useState<Overtime | null>(null);
  const [editItem, setEditItem] = useState<Overtime | null>(null);
  const [deleteItem, setDeleteItem] = useState<Overtime | null>(null);

  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  const [errors, setErrors] = useState<any>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/overtime/my-requests");
      setData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch overtime requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    setEditItem(null);
    setForm({ date: "", startTime: "", endTime: "", reason: "" });
    setErrors({});
    setOpen(true);
  };

  const openEditModal = (item: Overtime) => {
    setEditItem(item);
    setForm({
      date: item.date ? item.date.split("T")[0] : "",
      startTime: item.startTime,
      endTime: item.endTime,
      reason: item.reason,
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const errs: any = {};
    if (!form.date) errs.date = "Date is required";
    if (!form.startTime) errs.startTime = "Start time is required";
    if (!form.endTime) errs.endTime = "End time is required";
    if (!form.reason) errs.reason = "Reason is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editItem) {
        await axios.patch(`/overtime/${editItem._id}`, form);
        toast({ type: "success", title: "Updated", message: "Overtime request updated successfully." });
      } else {
        await axios.post("/overtime", form);
        toast({ type: "success", title: "Submitted", message: "Overtime request submitted successfully." });
      }
      setOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Failed",
        message: error?.response?.data?.message || "Failed to save overtime request.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await axios.delete(`/overtime/${deleteItem._id}`);
      toast({ type: "success", title: "Deleted", message: "Overtime request deleted successfully." });
      setDeleteOpen(false);
      setDeleteItem(null);
      fetchData();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Failed",
        message: error?.response?.data?.message || "Failed to delete request.",
      });
    }
  };

  const filteredData = useMemo(() =>
    data.filter((item) =>
      item.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [data, searchTerm]
  );

  const pendingCount = useMemo(() => data.filter((d) => d.status === "PENDING").length, [data]);
  const approvedCount = useMemo(() => data.filter((d) => d.status === "APPROVED").length, [data]);
  const totalHours = useMemo(() => data.reduce((sum, d) => sum + (d.hours || 0), 0), [data]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">Overtime Requests</h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Submit and manage your extra work hours requests.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Apply Overtime
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={data.length} icon={Clock} tone="primary" />
        <StatCard label="Total Claimed Hours" value={`${totalHours} hrs`} icon={Clock} tone="violet" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Approved Overtime" value={approvedCount} icon={CheckCircle2} tone="good" />
      </div>

      {/* TABLE PANEL */}
      <DashboardPanel title="My Overtime Log" subtitle="History of applied overtime hours">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by reason or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            <Clock className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No overtime requests found</p>
            <p className="mt-1">Apply for overtime using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Total Hours</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredData.map((item) => {
                  const isApproved = item.status === "APPROVED";
                  const isRejected = item.status === "REJECTED";

                  return (
                    <tr key={item._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3 font-semibold text-[var(--foreground)]">
                        {new Date(item.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3 text-[var(--foreground)] font-medium">
                        {item.startTime} – {item.endTime}
                      </td>
                      <td className="p-3 font-bold text-[var(--primary)]">{item.hours} hrs</td>
                      <td className="p-3 text-[var(--muted-foreground)] max-w-[200px] truncate">{item.reason}</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                          isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                          isRejected && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
                          !isApproved && !isRejected && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewItem(item)}
                            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {item.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteItem(item);
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
                {editItem ? "Edit Overtime Request" : "Apply Overtime"}
              </h3>
              <button onClick={() => setOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none"
                />
                {errors.date && <p className="text-[var(--status-critical)] text-[10px] mt-1">{errors.date}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none"
                  />
                  {errors.startTime && <p className="text-[var(--status-critical)] text-[10px] mt-1">{errors.startTime}</p>}
                </div>
                <div>
                  <label className="block font-semibold text-[var(--foreground)] mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none"
                  />
                  {errors.endTime && <p className="text-[var(--status-critical)] text-[10px] mt-1">{errors.endTime}</p>}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[var(--foreground)] mb-1">Reason</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="State the task or project requiring overtime..."
                  className="w-full p-2.5 rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none"
                />
                {errors.reason && <p className="text-[var(--status-critical)] text-[10px] mt-1">{errors.reason}</p>}
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
              Overtime Request Details
            </h3>
            <div className="space-y-2.5 text-xs text-[var(--foreground)]">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Date:</span>
                <span className="font-semibold">{new Date(viewItem.date).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Timing:</span>
                <span className="font-semibold">{viewItem.startTime} – {viewItem.endTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Calculated Hours:</span>
                <span className="font-bold text-[var(--primary)]">{viewItem.hours} hrs</span>
              </div>
              <div className="py-1">
                <span className="text-[var(--muted-foreground)] block mb-1">Reason:</span>
                <p className="bg-[var(--muted)] p-2.5 rounded-lg text-xs italic">{viewItem.reason}</p>
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
            <h3 className="font-bold text-base text-[var(--foreground)] mb-2">Delete Overtime Request?</h3>
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
