/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Eye, X, ListChecks, Clock3, CheckCircle2, XCircle } from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;
const ViewAPI = API_BASE.replace("/api", "");

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];

const statusTone: Record<string, { bg: string; text: string }> = {
  APPROVED: {
    bg: "bg-[color-mix(in_oklab,var(--status-good)_16%,transparent)]",
    text: "text-[var(--status-good)]",
  },
  REJECTED: {
    bg: "bg-[color-mix(in_oklab,var(--status-critical)_16%,transparent)]",
    text: "text-[var(--status-critical)]",
  },
  PENDING: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_16%,transparent)]",
    text: "text-[var(--status-warning)]",
  },
};

export default function FinanceExpenseRequest() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const token = localStorage.getItem("token");

  const fetchExpenses = async () => {
    const res = await axios.get(`${API_BASE}/expenses/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setExpenses(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await axios.put(
        `${API_BASE}/expenses/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        type: "success",
        title: "Expense Status Updated",
        message:
          res?.data?.message ||
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

  /* ================= DERIVED, REAL DATA ================= */
  const kpis = useMemo(() => {
    const total = expenses.length;
    const pending = expenses.filter((e) => e.status === "PENDING").length;
    const approved = expenses.filter((e) => e.status === "APPROVED").length;
    const rejected = expenses.filter((e) => e.status === "REJECTED").length;
    return { total, pending, approved, rejected };
  }, [expenses]);

  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return expenses.slice(start, start + pageSize);
  }, [expenses, page, pageSize]);

  if (loading)
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Expense Requests
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Finance <span className="mx-1">›</span> Expense & Reimbursement <span className="mx-1">›</span> Expense Requests
        </p>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Requests" value={kpis.total} icon={ListChecks} tone="primary" sublabel="All expense claims" />
        <StatCard label="Pending" value={kpis.pending} icon={Clock3} tone="warning" sublabel="Awaiting decision" />
        <StatCard label="Approved" value={kpis.approved} icon={CheckCircle2} tone="good" sublabel="Cleared for payment" />
        <StatCard label="Rejected" value={kpis.rejected} icon={XCircle} tone="critical" sublabel="Declined claims" />
      </div>

      {/* TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                    No expense requests found
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => {
                  const tone = statusTone[exp.status] ?? statusTone.PENDING;
                  return (
                    <tr key={exp._id} className="transition-colors hover:bg-[var(--muted)]">
                      {/* Employee */}
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[var(--foreground)]">{exp.employee?.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{exp.employee?.email}</p>
                      </td>

                      <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{exp.expenseType}</td>
                      <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{exp.category}</td>
                      <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">₹{exp.amount}</td>
                      <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>

                      {/* STATUS DROPDOWN */}
                      <td className="px-4 py-3.5">
                        <select
                          value={exp.status}
                          onChange={(e) => updateStatus(exp._id, e.target.value)}
                          className={cn(
                            "cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none",
                            tone.bg,
                            tone.text
                          )}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* ACTION */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end">
                          <button
                            title="View"
                            onClick={() => setSelectedExpense(exp)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {expenses.length > 0 && (
          <div className="border-t border-[var(--border)] px-4 py-3.5">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={expenses.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="expense requests"
            />
          </div>
        )}
      </div>

      {/* ================= VIEW MODAL ================= */}
      {selectedExpense && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedExpense(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-premium-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Expense Details</h3>
              <button
                onClick={() => setSelectedExpense(null)}
                className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-[var(--foreground)]">
              <p>
                <span className="font-semibold">Employee:</span> {selectedExpense.employee?.name}
              </p>
              <p>
                <span className="font-semibold">Expense Type:</span> {selectedExpense.expenseType}
              </p>
              <p>
                <span className="font-semibold">Category:</span> {selectedExpense.category}
              </p>
              <p>
                <span className="font-semibold">Amount:</span> ₹{selectedExpense.amount}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(selectedExpense.date).toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold">Remarks:</span> {selectedExpense.remarks || "-"}
              </p>

              {selectedExpense.receipt && (
                <a
                  href={`${ViewAPI}${selectedExpense.receipt}`}
                  target="_blank"
                  className="mt-2 inline-block text-[var(--primary)] underline"
                >
                  View Receipt
                </a>
              )}
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setSelectedExpense(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
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
