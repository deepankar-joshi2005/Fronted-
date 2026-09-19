/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Eye, CheckCircle2, Users, Wallet, Clock3, X } from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { confirmToast } from "../Confirm/ConfirmModal";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

type PayrollStatus = "Draft" | "Processed" | "Paid" | "Rejected";

interface Employee {
  _id: string;
  name: string;
}

interface Payroll {
  _id: string;
  employee: Employee;
  net: number;
  status: PayrollStatus;
}

interface DocumentItem {
  _id: string;
  type: string;
  file: string;
  fileUrl: string;
  mimeType: string;
}

const statusTone: Record<string, { bg: string; text: string; dot: string }> = {
  Paid: {
    bg: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)]",
    text: "text-[var(--status-good)]",
    dot: "bg-[var(--status-good)]",
  },
  Processed: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]",
    text: "text-[var(--status-warning)]",
    dot: "bg-[var(--status-warning)]",
  },
};

const API_BASE = import.meta.env.VITE_API_URL as string;

const SalaryDisbursement = () => {
  const token = localStorage.getItem("token");

  const [month, setMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [passbook, setPassbook] = useState<DocumentItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH PAYROLL ================= */
  const fetchPayroll = async (): Promise<void> => {
    try {
      setLoading(true);

      const res = await axios.get<Payroll[]>(
        `${API_BASE}/payroll?month=${month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const filtered = res.data.filter(
        (p) => p.status === "Processed" || p.status === "Paid"
      );

      setPayrolls(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    setPage(1);
  }, [month, pageSize]);

  /* ================= VIEW PASSBOOK ================= */
  const viewPassbook = async (userId: string): Promise<void> => {
    try {
      const res = await axios.get<DocumentItem[]>(
        `${API_BASE}/documents/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const bankPassbook = res.data.find((doc) => doc.type === "PASSBOOK");

      if (!bankPassbook) {
        alert("Bank passbook not uploaded");
        return;
      }

      setPassbook(bankPassbook);
    } catch (error) {
      console.error(error);
    }
  };

  /* ================= MARK AS PAID ================= */
  const confirmPaid = async (payrollId: string): Promise<void> => {
    confirmToast({
      title: "Confirm Payment",
      message: "Are you sure you want to mark this salary as Paid?",
      onConfirm: async () => {
        try {
          const res = await axios.patch(
            `${API_BASE}/payroll/${payrollId}/status`,
            { status: "Paid" },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          toast({
            type: "success",
            title: "Salary Paid",
            message:
              res?.data?.message ||
              "Payroll status has been marked as Paid successfully.",
          });

          fetchPayroll();
        } catch (error: any) {
          toast({
            type: "error",
            title: "Update Failed",
            message:
              error?.response?.data?.message ||
              "Failed to update payroll status.",
          });
          console.error(error);
        }
      },
    });
  };

  /* ================= DERIVED, REAL DATA ================= */
  const kpis = useMemo(() => {
    const total = payrolls.length;
    const netPayable = payrolls.reduce((sum, p) => sum + (Number(p.net) || 0), 0);
    const paid = payrolls.filter((p) => p.status === "Paid").length;
    const awaiting = payrolls.filter((p) => p.status === "Processed").length;
    return { total, netPayable, paid, awaiting };
  }, [payrolls]);

  const paginatedPayrolls = useMemo(() => {
    const start = (page - 1) * pageSize;
    return payrolls.slice(start, start + pageSize);
  }, [payrolls, page, pageSize]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Salary Disbursement
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Finance <span className="mx-1">›</span> Payroll <span className="mx-1">›</span> Salary Disbursement
          </p>
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Payrolls Ready"
          value={kpis.total}
          icon={Users}
          tone="primary"
          sublabel={`For ${month}`}
        />
        <StatCard
          label="Total Net Payable"
          value={`₹${kpis.netPayable.toLocaleString("en-IN")}`}
          icon={Wallet}
          tone="violet"
          sublabel="This month"
        />
        <StatCard
          label="Paid"
          value={kpis.paid}
          icon={CheckCircle2}
          tone="good"
          sublabel="Disbursed successfully"
        />
        <StatCard
          label="Awaiting Payment"
          value={kpis.awaiting}
          icon={Clock3}
          tone="warning"
          sublabel="Processed, not yet paid"
        />
      </div>

      {/* TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3">Sr.No</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Net Salary</th>
                <th className="px-4 py-3">Passbook</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                    No payroll found
                  </td>
                </tr>
              ) : (
                paginatedPayrolls.map((p, i) => {
                  const tone = statusTone[p.status] ?? statusTone.Processed;
                  return (
                    <tr key={p._id} className="transition-colors hover:bg-[var(--muted)]">
                      <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                        {(page - 1) * pageSize + i + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">
                        {p.employee.name}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{month}</td>
                      <td className="px-4 py-3.5 font-semibold text-[var(--status-good)]">
                        ₹{p.net.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline"
                          onClick={() => viewPassbook(p.employee._id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            tone.bg,
                            tone.text
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                          {p.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end">
                          <button
                            title={p.status === "Paid" ? "Already paid" : "Mark as Paid"}
                            onClick={() => confirmPaid(p._id)}
                            disabled={p.status === "Paid"}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                              p.status === "Paid"
                                ? "cursor-not-allowed text-[var(--status-good)] opacity-50"
                                : "text-[var(--muted-foreground)] hover:bg-[color-mix(in_oklab,var(--status-good)_12%,transparent)] hover:text-[var(--status-good)]"
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4" />
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

        {payrolls.length > 0 && (
          <div className="border-t border-[var(--border)] px-4 py-3.5">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={payrolls.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="payroll records"
            />
          </div>
        )}
      </div>

      {/* PASSBOOK MODAL */}
      {passbook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[90vh] w-[95%] flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-premium-lg md:w-[90vw]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Bank Passbook</h2>
              <button
                onClick={() => setPassbook(null)}
                className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {passbook.mimeType?.startsWith("image") ? (
                <img
                  src={`/${passbook.fileUrl.replace(
                    /\\/g,
                    "/"
                  )}`}
                  alt="Passbook"
                  className="mx-auto max-h-[75vh] w-full object-contain"
                />
              ) : (
                <iframe
                  src={`/${passbook.fileUrl.replace(
                    /\\/g,
                    "/"
                  )}`}
                  className="h-[75vh] w-full rounded border border-[var(--border)]"
                />
              )}
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setPassbook(null)}
                className="rounded-lg border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
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

export default SalaryDisbursement;
