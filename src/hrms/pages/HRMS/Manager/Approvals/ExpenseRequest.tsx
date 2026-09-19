/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Receipt, Search, CheckCircle2, Clock, Eye, IndianRupee, FileText } from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;
const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "" + (parts[1]?.[0] || "")).toUpperCase() || "U";
}

export default function ExpenseRequest() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const token = localStorage.getItem("token");

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/expenses/manager`, {
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

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await axios.put(
        `${API_BASE}/expenses/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        type: "success",
        title: status === "APPROVED" ? "Expense Approved" : "Expense Rejected",
        message:
          res.data?.message ||
          `Expense has been ${status.toLowerCase()} successfully.`,
      });

      fetchExpenses();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          "Unable to update expense status. Please try again.",
      });
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expenseType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || e.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [expenses, searchTerm, statusFilter]);

  const pendingCount = useMemo(() => expenses.filter((e) => e.status === "PENDING").length, [expenses]);
  const approvedCount = useMemo(() => expenses.filter((e) => e.status === "APPROVED").length, [expenses]);
  const totalAmount = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Expense & Reimbursements
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Review and process reimbursement claims submitted by team members.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_25%,transparent)] text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>{pendingCount} Pending Claims</span>
          </div>
        )}
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Claims"
          value={expenses.length}
          icon={Receipt}
          tone="primary"
        />
        <StatCard
          label="Total Amount Claimed"
          value={`₹${totalAmount.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="violet"
        />
        <StatCard
          label="Pending Claims"
          value={pendingCount}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Approved Claims"
          value={approvedCount}
          icon={CheckCircle2}
          tone="good"
        />
      </div>

      {/* ================= PANEL & TABLE ================= */}
      <DashboardPanel title="Expense Claims Log" subtitle="Filter and update approval status">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search employee or expense category..."
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

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            No expense requests found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Expense Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredExpenses.map((exp) => {
                  const status = exp.status || "PENDING";
                  const isApproved = status === "APPROVED";
                  const isRejected = status === "REJECTED";

                  return (
                    <tr key={exp._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white text-xs font-bold">
                            {getInitials(exp.employee?.name)}
                          </span>
                          <div>
                            <p className="font-semibold text-[var(--foreground)] text-sm">{exp.employee?.name || "—"}</p>
                            {exp.employee?.email && (
                              <p className="text-[11px] text-[var(--muted-foreground)]">{exp.employee.email}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-semibold text-[var(--foreground)]">{exp.expenseType}</td>
                      <td className="p-3 text-[var(--foreground)]">{exp.category}</td>

                      <td className="p-3 font-bold text-[var(--foreground)] text-sm">
                        ₹{Number(exp.amount).toLocaleString("en-IN")}
                      </td>

                      <td className="p-3 text-[var(--foreground)] font-medium">
                        {new Date(exp.date).toLocaleDateString("en-GB")}
                      </td>

                      <td className="p-3">
                        <select
                          value={status}
                          onChange={(e) => updateStatus(exp._id, e.target.value)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-colors",
                            isApproved && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)] border-[color-mix(in_oklab,var(--status-good)_30%,transparent)]",
                            isRejected && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)] border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)]",
                            !isApproved && !isRejected && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)] border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)]"
                          )}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3">
                        {isApproved ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              exp.paymentStatus === "PAID"
                                ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                                : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                            )}
                          >
                            {exp.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--muted-foreground)] opacity-50">—</span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedExpense(exp)}
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

      {/* VIEW MODAL */}
      {selectedExpense && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedExpense(null)}
        >
          <div
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg shadow-premium-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 pb-2 border-b border-[var(--border)]">
              Expense Claim Details
            </h3>

            <div className="space-y-3 text-xs text-[var(--foreground)]">
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Employee:</span>
                <span className="font-semibold">{selectedExpense.employee?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Expense Type:</span>
                <span className="font-semibold">{selectedExpense.expenseType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Category:</span>
                <span className="font-semibold">{selectedExpense.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Amount:</span>
                <span className="font-bold text-sm">₹{Number(selectedExpense.amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border)]">
                <span className="text-[var(--muted-foreground)]">Date:</span>
                <span className="font-medium">{new Date(selectedExpense.date).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="py-1">
                <span className="text-[var(--muted-foreground)] block mb-1">Remarks:</span>
                <p className="bg-[var(--muted)] p-2.5 rounded-lg text-xs italic">{selectedExpense.remarks || "No remarks provided"}</p>
              </div>

              {selectedExpense.receipt && (
                <div className="pt-2">
                  <a
                    href={`${API_BASE.replace("/api", "")}${selectedExpense.receipt}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Attached Receipt
                  </a>
                </div>
              )}
            </div>

            <div className="mt-6 text-right">
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
