/** @format */
import { useEffect, useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Search, Wallet, Plane, Receipt, IndianRupee, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "../Alert/Toast";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

type RequestType = "Expense" | "Travel" | "Leave Encashment";
type PaymentStatus = "UNPAID" | "PAID";

interface PaymentRequestRow {
  id: string;
  type: RequestType;
  employee: {
    _id: string;
    name: string;
    employeeId?: string;
    departmentName?: string;
  };
  category: string;
  amount: number;
  date: string;
  status: string;
  paymentStatus: PaymentStatus;
}

const TYPE_META: Record<RequestType, { icon: any; badge: string; apiSegment: string }> = {
  Expense: {
    icon: Receipt,
    badge: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]",
    apiSegment: "expense",
  },
  Travel: {
    icon: Plane,
    badge: "bg-[color-mix(in_oklab,#7C3AED_14%,transparent)] text-[#7C3AED]",
    apiSegment: "travel",
  },
  "Leave Encashment": {
    icon: IndianRupee,
    badge: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
    apiSegment: "encashment",
  },
};

const FinancePaymentRequests = () => {
  const [rows, setRows] = useState<PaymentRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | RequestType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentStatus>("ALL");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/payment-requests`);
      setRows(res.data.data || []);
    } catch (error) {
      toast({ type: "error", title: "Fetch Failed", message: "Failed to load payment requests" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handlePaymentStatusChange = async (row: PaymentRequestRow, value: PaymentStatus) => {
    try {
      setSavingId(row.id);
      await axiosInstance.patch(
        `/payment-requests/${TYPE_META[row.type].apiSegment}/${row.id}/payment-status`,
        { paymentStatus: value }
      );
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, paymentStatus: value } : r)));
      toast({ type: "success", title: "Updated", message: `Marked as ${value === "PAID" ? "Paid" : "Unpaid"}.` });
    } catch (error: any) {
      toast({
        type: "error",
        title: "Update Failed",
        message: error?.response?.data?.message || "Could not update payment status",
      });
    } finally {
      setSavingId(null);
    }
  };

  const filteredRows = rows.filter((r) => {
    if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && r.paymentStatus !== statusFilter) return false;
    if (search && !r.employee.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalUnpaidAmount = rows
    .filter((r) => r.paymentStatus === "UNPAID")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const unpaidCount = rows.filter((r) => r.paymentStatus === "UNPAID").length;
  const paidCount = rows.filter((r) => r.paymentStatus === "PAID").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Payment Requests
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Approved Expense, Travel & Leave Encashment requests awaiting disbursement
          </p>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Approved" value={rows.length} icon={Wallet} tone="primary" sublabel="All request types" />
        <StatCard
          label="Unpaid"
          value={unpaidCount}
          icon={Clock}
          tone="warning"
          sublabel="Awaiting disbursement"
        />
        <StatCard label="Paid" value={paidCount} icon={CheckCircle2} tone="good" sublabel="Disbursed to employees" />
        <StatCard
          label="Pending Payout"
          value={`₹${totalUnpaidAmount.toLocaleString()}`}
          icon={IndianRupee}
          tone="violet"
          sublabel="Total unpaid amount"
        />
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          >
            <option value="ALL">All Types</option>
            <option value="Expense">Expense</option>
            <option value="Travel">Travel</option>
            <option value="Leave Encashment">Leave Encashment</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="card-premium shadow-premium-sm overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--card)]/60 backdrop-blur-[1px]">
            <Loader />
          </div>
        )}

        {filteredRows.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
            <Wallet className="h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">
              No approved payment requests align with current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Date</th>
                  <th className="px-4 py-3 text-center">Payment Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {filteredRows.map((row) => {
                  const meta = TYPE_META[row.type];
                  const Icon = meta.icon;
                  return (
                    <tr key={`${row.type}-${row.id}`} className="transition-colors hover:bg-[var(--muted)]">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-sm font-semibold text-[var(--primary)]">
                            {row.employee.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">{row.employee.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {row.employee.departmentName || "Unassigned"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", meta.badge)}>
                          <Icon size={11} />
                          {row.type}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-[240px] truncate text-[var(--muted-foreground)]" title={row.category}>
                        {row.category}
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium text-[var(--foreground)]">
                        ₹{(row.amount || 0).toLocaleString()}
                      </td>

                      <td className="px-4 py-3.5 text-center text-xs text-[var(--muted-foreground)]">
                        {row.date
                          ? new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <select
                          value={row.paymentStatus}
                          disabled={savingId === row.id}
                          onChange={(e) => handlePaymentStatusChange(row, e.target.value as PaymentStatus)}
                          className={cn(
                            "rounded-md border px-2 py-1.5 text-xs font-semibold uppercase outline-none transition-colors disabled:opacity-60",
                            row.paymentStatus === "PAID"
                              ? "border-transparent bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                              : "border-transparent bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                          )}
                        >
                          <option value="UNPAID">Unpaid</option>
                          <option value="PAID">Paid</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancePaymentRequests;
