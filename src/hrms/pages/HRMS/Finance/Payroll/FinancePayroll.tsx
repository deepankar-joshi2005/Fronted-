/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Eye, Ban, Users, IndianRupee, MinusCircle, Wallet, X, XCircle } from "lucide-react";
import ViewPayrollModal from "../../Admin/Payroll/ViewPayrollModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { DonutChart, type DonutSlice } from "@/components/ui/donut-chart";
import { TrendChart } from "@/components/ui/trend-chart";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

type PayrollStatus = "Draft" | "Processed" | "Paid" | "Rejected";

interface PayrollRow {
  payrollId?: string;
  userId: string;
  name: string;
  gross: number;
  deduction: number;
  net: number;
  status: PayrollStatus;
  overtimeAmount?: number;
  encashmentBonus?: number;
  fixedDeductionAmount?: number;
  lopDeductionAmount?: number;
}

interface TrendPoint {
  month: string;
  gross: number;
  net: number;
  deduction: number;
  employees: number;
}

const statusTone: Record<PayrollStatus, { bg: string; text: string }> = {
  Draft: { bg: "bg-[var(--muted)]", text: "text-[var(--muted-foreground)]" },
  Processed: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]",
    text: "text-[var(--status-warning)]",
  },
  Paid: {
    bg: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)]",
    text: "text-[var(--status-good)]",
  },
  Rejected: {
    bg: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)]",
    text: "text-[var(--status-critical)]",
  },
};

const sum = (rows: PayrollRow[] | any[], key: string) =>
  rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

const formatMonthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
};

const FinancePayroll = () => {
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);

  const [openPayslip, setOpenPayslip] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);

  const token = localStorage.getItem("token");
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [payingAll, setPayingAll] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  const headers = { Authorization: `Bearer ${token}` };

  /* ================= FETCH PAYROLL (ONLY HR RUN DATA) ================= */
  const fetchPayrollFromServer = async () => {
    try {
      const res = await axios.get(`${API_BASE}/payroll?month=${month}`, { headers });

      const mapped = res.data.map((p: any) => ({
        payrollId: p._id,
        userId: p.employee._id,
        name: p.employee.name,
        gross: p.gross,
        deduction: p.deduction,
        net: p.net,
        status: p.status,
        overtimeAmount: p.overtimeAmount,
        encashmentBonus: p.encashmentBonus,
        fixedDeductionAmount: p.fixedDeductionAmount,
        lopDeductionAmount: p.lopDeductionAmount,
      }));

      setPayroll(mapped);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  /* ================= REAL 6-MONTH TREND ================= */
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    const loadTrend = async () => {
      const [y, m] = month.split("-").map(Number);
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(y, m - 1 - (5 - i), 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      });

      const points = await Promise.all(
        months.map(async (mo): Promise<TrendPoint> => {
          if (mo === month) {
            return {
              month: mo,
              gross: sum(payroll, "gross"),
              net: sum(payroll, "net"),
              deduction: sum(payroll, "deduction"),
              employees: payroll.length,
            };
          }
          try {
            const res = await axios.get(`${API_BASE}/payroll?month=${mo}`, { headers });
            const rows = res.data || [];
            return {
              month: mo,
              gross: sum(rows, "gross"),
              net: sum(rows, "net"),
              deduction: sum(rows, "deduction"),
              employees: rows.length,
            };
          } catch {
            return { month: mo, gross: 0, net: 0, deduction: 0, employees: 0 };
          }
        })
      );

      if (!cancelled) setTrend(points);
    };

    loadTrend();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, loading, payroll.length]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (payrollId: string, status: PayrollStatus) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/payroll/${payrollId}/status`,
        { status },
        { headers }
      );

      setPayroll((prev) => prev.map((p) => (p.payrollId === payrollId ? { ...p, status } : p)));

      toast({
        type: "success",
        title: "Payroll Updated",
        message: res?.data?.message || `Payroll status updated to ${status}.`,
      });
    } catch (error: any) {
      toast({
        type: "error",
        title: "Update Failed",
        message: error?.response?.data?.message || "Status update failed. Please try again.",
      });
      console.error(error);
    }
  };

  /* ================= PAY ALL (BULK) ================= */
  const payAll = async () => {
    const processedCount = payroll.filter((p) => p.status === "Processed").length;
    if (processedCount === 0) return;

    if (!window.confirm(`Mark all ${processedCount} processed payroll record(s) for ${month} as Paid?`)) {
      return;
    }

    try {
      setPayingAll(true);
      const res = await axios.patch(`${API_BASE}/payroll/pay-all`, { month }, { headers });

      toast({
        type: "success",
        title: "Payroll Paid",
        message: res?.data?.message || "All processed payroll has been marked as Paid.",
      });

      fetchPayrollFromServer();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Pay All Failed",
        message: error?.response?.data?.message || "Unable to mark payroll as paid. Please try again.",
      });
    } finally {
      setPayingAll(false);
    }
  };

  /* ================= CANCEL PAYROLL RUN ================= */
  const cancelPayrollRun = async () => {
    if (
      !window.confirm(
        `Cancel the payroll run for ${month}? This will remove the processed payroll for every employee this month so HR can run it again.`
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      const res = await axios.patch(`${API_BASE}/payroll/runs/${month}/cancel`, {}, { headers });

      toast({
        type: "success",
        title: "Payroll Run Cancelled",
        message: res?.data?.message || "The payroll run has been cancelled.",
      });

      fetchPayrollFromServer();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Cancel Failed",
        message: error?.response?.data?.message || "Unable to cancel payroll run. Please try again.",
      });
    } finally {
      setCancelling(false);
    }
  };

  const rejectPayroll = async (payrollId: string, reason: string) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/payroll/${payrollId}/reject`,
        { reason },
        { headers }
      );

      setPayroll((prev) =>
        prev.map((p) => (p.payrollId === payrollId ? { ...p, status: "Rejected" } : p))
      );

      toast({
        type: "success",
        title: "Payroll Rejected",
        message: res?.data?.message || "Payroll has been rejected successfully.",
      });
    } catch (error: any) {
      toast({
        type: "error",
        title: "Rejection Failed",
        message: error?.response?.data?.message || "Reject failed. Please try again.",
      });
      console.error(error);
    }
  };

  /* ================= DERIVED, REAL DATA ================= */
  const totals = useMemo(
    () => ({
      employees: payroll.length,
      gross: sum(payroll, "gross"),
      deduction: sum(payroll, "deduction"),
      net: sum(payroll, "net"),
      processed: payroll.filter((p) => p.status === "Processed").length,
    }),
    [payroll]
  );

  // A run is "Completed" once every employee for the month has been paid — matches
  // the backend's PayrollRun status derivation. Completed runs can't be cancelled.
  const isRunCompleted = payroll.length > 0 && payroll.every((p) => p.status === "Paid");
  const canCancelRun = payroll.length > 0 && !isRunCompleted;

  const trendChartData = useMemo(
    () => trend.map((t) => ({ label: formatMonthLabel(t.month), value: t.gross })),
    [trend]
  );

  const breakdownData: DonutSlice[] = useMemo(() => {
    const overtime = sum(payroll, "overtimeAmount");
    const encashment = sum(payroll, "encashmentBonus");
    const base = Math.max(totals.gross - overtime - encashment, 0);
    const fixedDeduction = sum(payroll, "fixedDeductionAmount");
    const lopDeduction = sum(payroll, "lopDeductionAmount");
    const otherDeduction = Math.max(totals.deduction - fixedDeduction - lopDeduction, 0);

    const slices: DonutSlice[] = [{ label: "Base Salary", value: Math.round(base), color: "var(--cat-1)" }];
    if (overtime > 0) slices.push({ label: "Overtime", value: Math.round(overtime), color: "var(--cat-3)" });
    if (encashment > 0)
      slices.push({ label: "Leave Encashment", value: Math.round(encashment), color: "var(--cat-2)" });
    if (fixedDeduction > 0)
      slices.push({ label: "Fixed Deductions", value: Math.round(fixedDeduction), color: "var(--status-critical)" });
    if (lopDeduction > 0)
      slices.push({ label: "Loss of Pay", value: Math.round(lopDeduction), color: "var(--cat-5)" });
    if (otherDeduction > 0)
      slices.push({ label: "Other Deductions", value: Math.round(otherDeduction), color: "var(--cat-other)" });
    return slices;
  }, [payroll, totals]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Payroll Review
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Finance &gt; Payroll &gt; Review</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          />

          <button
            onClick={payAll}
            disabled={totals.processed === 0 || payingAll}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity",
              totals.processed === 0 || payingAll
                ? "cursor-not-allowed bg-[var(--muted-foreground)]/50"
                : "bg-gradient-to-r from-[var(--status-good)] to-[#16A34A] hover:opacity-90"
            )}
          >
            {payingAll ? "Paying..." : `Pay All${totals.processed > 0 ? ` (${totals.processed})` : ""}`}
          </button>

          {canCancelRun && (
            <button
              onClick={cancelPayrollRun}
              disabled={cancelling}
              title="Cancel this payroll run so HR can run it again"
              className="flex items-center gap-2 rounded-lg border border-[var(--status-critical)]/30 bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] px-4 py-2 text-sm font-medium text-[var(--status-critical)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_16%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              {cancelling ? "Cancelling..." : "Cancel Run"}
            </button>
          )}
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        <StatCard label="Total Employees" value={totals.employees} icon={Users} tone="primary" sublabel="This month" />
        <StatCard
          label="Total Gross Pay"
          value={`₹${totals.gross.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="good"
          sublabel="This month"
        />
        <StatCard
          label="Total Deductions"
          value={`₹${totals.deduction.toLocaleString("en-IN")}`}
          icon={MinusCircle}
          tone="critical"
          sublabel="This month"
        />
        <StatCard
          label="Net Payable"
          value={`₹${totals.net.toLocaleString("en-IN")}`}
          icon={Wallet}
          tone="violet"
          sublabel="This month"
        />
        <StatCard
          label="Awaiting Payment"
          value={totals.processed}
          icon={IndianRupee}
          tone="warning"
          sublabel="Processed, not yet paid"
        />
      </div>

      {/* TREND + BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <DashboardPanel
          title="Payroll Trend"
          subtitle="Gross payroll over the last 6 months"
          className="lg:col-span-3"
        >
          <TrendChart data={trendChartData} color="var(--primary)" unit="gross pay" />
        </DashboardPanel>

        <DashboardPanel title="Payroll Breakdown" subtitle="This month overview" className="lg:col-span-2">
          {breakdownData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              No payroll data for this month yet
            </p>
          ) : (
            <DonutChart centerLabel="Total Gross" data={breakdownData} />
          )}
        </DashboardPanel>
      </div>

      {/* TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  S.No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Gross
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Deduction
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Net
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {payroll.map((row, i) => {
                const tone = statusTone[row.status] ?? statusTone.Draft;
                return (
                  <tr key={row.userId} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{row.name}</td>
                    <td className="px-4 py-3 text-[var(--foreground)]">₹{row.gross.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-[var(--status-critical)]">
                      ₹{row.deduction.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--status-good)]">
                      ₹{row.net.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "Rejected" ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            tone.bg,
                            tone.text
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          Rejected
                        </span>
                      ) : (
                        <select
                          value={row.status}
                          onChange={(e) => updateStatus(row.payrollId!, e.target.value as PayrollStatus)}
                          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Processed">Processed</option>
                          <option value="Paid">Paid</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="View"
                          onClick={() => {
                            setSelectedPayslip({
                              name: row.name,
                              month,
                              gross: row.gross,
                              deduction: row.deduction,
                              net: row.net,
                            });
                            setOpenPayslip(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {row.status === "Processed" && (
                          <button
                            title="Reject"
                            onClick={() => {
                              setSelectedPayrollId(row.payrollId!);
                              setRejectModal(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--status-critical)]"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {payroll.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                    No payroll records found for this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-premium-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Reject Payroll</h2>
              <button
                onClick={() => setRejectModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason"
              className="mb-4 w-full rounded-md border border-[var(--border)] bg-[var(--card)] p-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                onClick={() => setRejectModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[var(--status-critical)] px-4 py-2 text-sm text-white hover:opacity-90"
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast({ type: "error", title: "Reason Required", message: "Rejection reason required." });
                    return;
                  }

                  rejectPayroll(selectedPayrollId!, rejectReason);

                  setRejectReason("");
                  setRejectModal(false);
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewPayrollModal isOpen={openPayslip} onClose={() => setOpenPayslip(false)} data={selectedPayslip} />
    </div>
  );
};

export default FinancePayroll;
