/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Eye, X, Receipt, Plane, ListChecks, Clock3, CheckCircle2, Banknote, XCircle } from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL as string;
const ViewAPI = API_BASE.replace("/api", "");

/* ================= TYPES ================= */

type StatusType = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

interface Employee {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
}

interface Expense {
  _id: string;
  employee: Employee;
  expenseType: "TRAVEL" | "OTHER";
  category: string;
  amount: number;
  date: string;
  remarks?: string;
  receipt?: string;
  status: StatusType;
  createdAt: string;
}

interface TravelRequest {
  _id: string;
  employee: Employee;
  purpose: string;
  destination: string;
  fromDate: string;
  toDate: string;
  budget: number;
  remarks?: string;
  status: StatusType;
  createdAt: string;
}

/* ================= HELPERS ================= */

const statusTone: Record<StatusType, { bg: string; text: string }> = {
  PENDING: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_16%,transparent)]",
    text: "text-[var(--status-warning)]",
  },
  APPROVED: {
    bg: "bg-[color-mix(in_oklab,var(--status-good)_16%,transparent)]",
    text: "text-[var(--status-good)]",
  },
  PAID: {
    bg: "bg-[color-mix(in_oklab,var(--primary)_16%,transparent)]",
    text: "text-[var(--primary)]",
  },
  REJECTED: {
    bg: "bg-[color-mix(in_oklab,var(--status-critical)_16%,transparent)]",
    text: "text-[var(--status-critical)]",
  },
};

/* ================= COMPONENT ================= */

const FinanceReimbursementRequests = () => {
  const token = localStorage.getItem("token");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [travels, setTravels] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "TRAVEL">("EXPENSE");
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [viewTravel, setViewTravel] = useState<TravelRequest | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH ================= */

  const fetchExpenses = async () => {
    const res = await axios.get(`${API_BASE}/expenses/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setExpenses(res.data);
  };

  const fetchTravels = async () => {
    const res = await axios.get(`${API_BASE}/travel-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTravels(res.data);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchExpenses(), fetchTravels()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize]);

  /* ================= STATUS UPDATE ================= */

  const updateExpenseStatus = async (id: string, status: StatusType) => {
    try {
      await axios.put(
        `${API_BASE}/expenses/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast({ type: "success", title: "Expense Updated" });
      fetchExpenses();
    } catch (e: any) {
      toast({ type: "error", title: "Update Failed" });
    }
  };

  const updateTravelStatus = async (id: string, status: StatusType) => {
    try {
      await axios.patch(
        `${API_BASE}/travel-requests/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast({ type: "success", title: "Travel Updated" });
      fetchTravels();
    } catch (e: any) {
      toast({ type: "error", title: "Update Failed" });
    }
  };

  /* ================= DERIVED, REAL DATA ================= */

  const kpis = useMemo(() => {
    const allStatuses = [...expenses.map((e) => e.status), ...travels.map((t) => t.status)];
    const total = allStatuses.length;
    const pending = allStatuses.filter((s) => s === "PENDING").length;
    const approved = allStatuses.filter((s) => s === "APPROVED").length;
    const paid = allStatuses.filter((s) => s === "PAID").length;
    const rejected = allStatuses.filter((s) => s === "REJECTED").length;
    return { total, pending, approved, paid, rejected };
  }, [expenses, travels]);

  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return expenses.slice(start, start + pageSize);
  }, [expenses, page, pageSize]);

  const paginatedTravels = useMemo(() => {
    const start = (page - 1) * pageSize;
    return travels.slice(start, start + pageSize);
  }, [travels, page, pageSize]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Finance Reimbursement
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Finance <span className="mx-1">›</span> Expense & Reimbursement <span className="mx-1">›</span> Reimbursement
          Requests
        </p>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        <StatCard label="Total Requests" value={kpis.total} icon={ListChecks} tone="primary" sublabel="Expense + Travel" />
        <StatCard label="Pending" value={kpis.pending} icon={Clock3} tone="warning" sublabel="Awaiting decision" />
        <StatCard label="Approved" value={kpis.approved} icon={CheckCircle2} tone="good" sublabel="Cleared requests" />
        <StatCard label="Paid" value={kpis.paid} icon={Banknote} tone="violet" sublabel="Disbursed to employees" />
        <StatCard label="Rejected" value={kpis.rejected} icon={XCircle} tone="critical" sublabel="Declined requests" />
      </div>

      {/* ================= TABS ================= */}
      <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-1">
        <button
          onClick={() => setActiveTab("EXPENSE")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
            activeTab === "EXPENSE"
              ? "bg-[var(--card)] text-[var(--primary)] shadow-premium-xs"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <Receipt className="h-4 w-4" />
          Expense Requests
        </button>

        <button
          onClick={() => setActiveTab("TRAVEL")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
            activeTab === "TRAVEL"
              ? "bg-[var(--card)] text-[var(--primary)] shadow-premium-xs"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <Plane className="h-4 w-4" />
          Travel Requests
        </button>
      </div>

      {/* ================= EXPENSE TABLE ================= */}
      {activeTab === "EXPENSE" && (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Sr.No</th>
                  <th className="px-4 py-3">Employee</th>
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
                  paginatedExpenses.map((e, i) => {
                    const tone = statusTone[e.status] ?? statusTone.PENDING;
                    return (
                      <tr key={e._id} className="transition-colors hover:bg-[var(--muted)]">
                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                          {(page - 1) * pageSize + i + 1}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{e.employee.name}</td>
                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{e.category}</td>
                        <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">₹{e.amount}</td>
                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                          {new Date(e.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            value={e.status}
                            disabled={e.status === "REJECTED"}
                            onChange={(ev) =>
                              updateExpenseStatus(e._id, ev.target.value as StatusType)
                            }
                            className={cn(
                              "cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-70",
                              tone.bg,
                              tone.text
                            )}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="PAID">Paid</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end">
                            <button
                              title="View"
                              onClick={() => setViewExpense(e)}
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
      )}

      {/* ================= TRAVEL TABLE ================= */}
      {activeTab === "TRAVEL" && (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {travels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                      No travel requests found
                    </td>
                  </tr>
                ) : (
                  paginatedTravels.map((t, i) => {
                    const tone = statusTone[t.status] ?? statusTone.PENDING;
                    return (
                      <tr key={t._id} className="transition-colors hover:bg-[var(--muted)]">
                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                          {(page - 1) * pageSize + i + 1}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{t.employee.name}</td>
                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{t.destination}</td>
                        <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                          {new Date(t.fromDate).toLocaleDateString()} -{" "}
                          {new Date(t.toDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">₹{t.budget}</td>
                        <td className="px-4 py-3.5">
                          <select
                            value={t.status}
                            disabled={t.status === "REJECTED"}
                            onChange={(ev) => updateTravelStatus(t._id, ev.target.value as StatusType)}
                            className={cn(
                              "cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-70",
                              tone.bg,
                              tone.text
                            )}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="PAID">Paid</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end">
                            <button
                              title="View"
                              onClick={() => setViewTravel(t)}
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

          {travels.length > 0 && (
            <div className="border-t border-[var(--border)] px-4 py-3.5">
              <TablePagination
                page={page}
                pageSize={pageSize}
                total={travels.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                itemLabel="travel requests"
              />
            </div>
          )}
        </div>
      )}

      {/* ================= MODALS (same as before) ================= */}
      {viewExpense && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewExpense(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-premium-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Expense Details</h2>
              <button
                onClick={() => setViewExpense(null)}
                className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-[var(--foreground)]">
              <p>
                <span className="font-semibold">Employee:</span> {viewExpense.employee.name}
              </p>
              <p>
                <span className="font-semibold">Employee ID:</span> {viewExpense.employee.employeeId}
              </p>
              <p>
                <span className="font-semibold">Type:</span> {viewExpense.expenseType}
              </p>
              <p>
                <span className="font-semibold">Category:</span> {viewExpense.category}
              </p>
              <p>
                <span className="font-semibold">Amount:</span> ₹{viewExpense.amount}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {new Date(viewExpense.date).toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {viewExpense.status}
              </p>

              {viewExpense.remarks && (
                <p>
                  <span className="font-semibold">Remarks:</span> {viewExpense.remarks}
                </p>
              )}

              {viewExpense.receipt && (
                <a
                  href={`${ViewAPI}${viewExpense.receipt}`}
                  target="_blank"
                  className="inline-block text-[var(--primary)] underline"
                >
                  View Receipt
                </a>
              )}
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setViewExpense(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {viewTravel && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewTravel(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-premium-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Travel Request Details</h2>
              <button
                onClick={() => setViewTravel(null)}
                className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-[var(--foreground)]">
              <p>
                <span className="font-semibold">Employee:</span> {viewTravel.employee.name}
              </p>
              <p>
                <span className="font-semibold">Employee ID:</span> {viewTravel.employee.employeeId}
              </p>
              <p>
                <span className="font-semibold">Purpose:</span> {viewTravel.purpose}
              </p>
              <p>
                <span className="font-semibold">Destination:</span> {viewTravel.destination}
              </p>

              <p>
                <span className="font-semibold">Travel Dates:</span>{" "}
                {new Date(viewTravel.fromDate).toLocaleDateString()} →{" "}
                {new Date(viewTravel.toDate).toLocaleDateString()}
              </p>

              <p>
                <span className="font-semibold">Budget:</span> ₹{viewTravel.budget}
              </p>

              {viewTravel.remarks && (
                <p>
                  <span className="font-semibold">Remarks:</span> {viewTravel.remarks}
                </p>
              )}

              <p>
                <span className="font-semibold">Status:</span> {viewTravel.status}
              </p>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setViewTravel(null)}
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
};

export default FinanceReimbursementRequests;
