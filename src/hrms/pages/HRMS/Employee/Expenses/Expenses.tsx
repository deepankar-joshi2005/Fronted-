/** @format */
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import AddExpenseModal from "./AddExpenseModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import {
  Plus, Receipt, IndianRupee, Clock, CheckCircle2, Search, Eye, Pencil, Trash2
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

const Expense = () => {
  const token = localStorage.getItem("token");

  const [expenses, setExpenses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [mode, setMode] = useState<"view" | "edit" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/expenses/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data || []);
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDelete = async () => {
    try {
      const res = await axios.delete(`${API_BASE}/expenses/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ type: "success", title: "Expense Deleted", message: res?.data?.message || "Expense deleted successfully" });
      setDeleteId(null);
      fetchExpenses();
    } catch (error: any) {
      toast({ type: "error", title: "Delete Failed", message: error?.response?.data?.message || "Failed to delete expense." });
    }
  };

  const filteredExpenses = useMemo(() =>
    expenses.filter((e) =>
      e.expenseType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.status?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [expenses, searchTerm]
  );

  const pendingCount = useMemo(() => expenses.filter((e) => e.status === "PENDING").length, [expenses]);
  const approvedCount = useMemo(() => expenses.filter((e) => e.status === "APPROVED").length, [expenses]);
  const totalAmount = useMemo(() => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0), [expenses]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">Submit Expense</h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Submit, track, and manage your reimbursement claims.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setOpen(true); setSelectedExpense(null); }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Claims" value={expenses.length} icon={Receipt} tone="primary" />
        <StatCard label="Total Amount" value={`₹${totalAmount.toLocaleString("en-IN")}`} icon={IndianRupee} tone="violet" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Approved Claims" value={approvedCount} icon={CheckCircle2} tone="good" />
      </div>

      {/* TABLE PANEL */}
      <DashboardPanel title="My Expense Claims" subtitle="All submitted reimbursement requests">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by type or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            <Receipt className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No expense claims yet</p>
            <p className="mt-1">Click "Add Expense" to submit a new reimbursement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Bill</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredExpenses.map((e) => {
                  const isApproved = e.status === "APPROVED";
                  const isPending = e.status === "PENDING";
                  return (
                    <tr key={e._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold text-[var(--foreground)]">{e.expenseType}</p>
                        {e.subCategory && <p className="text-[10px] text-[var(--muted-foreground)]">{e.subCategory}</p>}
                      </td>
                      <td className="p-3 font-bold text-[var(--foreground)]">₹{Number(e.amount).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-[var(--foreground)]">{new Date(e.date).toLocaleDateString("en-GB")}</td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                          isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                          e.status === "REJECTED" && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
                          isPending && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}>
                          {e.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {isApproved ? (
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                            e.paymentStatus === "PAID"
                              ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                              : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                          )}>
                            {e.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                          </span>
                        ) : (
                          <span className="text-[var(--muted-foreground)] opacity-50">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {e.receipt ? (
                          <a href={`${API_BASE.replace("/api", "")}${e.receipt}`} target="_blank" rel="noopener noreferrer"
                            className="text-[var(--primary)] underline text-xs font-semibold">
                            View
                          </a>
                        ) : <span className="text-[var(--muted-foreground)] opacity-40">—</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={() => { setSelectedExpense(e); setMode("view"); }}
                            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--muted)] transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {isPending && (
                            <>
                              <button type="button" onClick={() => { setSelectedExpense(e); setMode("edit"); }}
                                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => setDeleteId(e._id)}
                                className="p-1.5 rounded-lg border border-[color-mix(in_oklab,var(--status-critical)_25%,transparent)] text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] transition-colors">
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

      {open && <AddExpenseModal open onClose={() => setOpen(false)} onSuccess={fetchExpenses} />}
      {mode && <AddExpenseModal open expense={selectedExpense} readOnly={mode === "view"} onClose={() => setMode(null)} onSuccess={fetchExpenses} />}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-premium-lg">
            <h3 className="font-bold text-base text-[var(--foreground)] mb-2">Delete Expense?</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--status-critical)] text-white hover:opacity-90">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;
