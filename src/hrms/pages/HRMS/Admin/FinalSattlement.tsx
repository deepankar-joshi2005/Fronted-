import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "../Alert/Toast";
import Loader from "../Loader";
import {
  FileText,
  Search,
  ChevronRight,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Users,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */
type FnFStatus = "NOT_STARTED" | "STARTED" | "FINAL";

interface FnFRecord {
  _id: string;
  name: string;
  employeeId: string;
  joiningDate: string;
  departmentId?: {
    name: string;
  };
  designationId?: {
    name: string;
  };
  settlementStatus: FnFStatus;
  settlementDetails?: {
    earnings: number;
    deductions: number;
    notes: string;
    lastMonthSalary: number;
    unpaidSalary: number;
    bonus: number;
    lastWorkingDay: string | null;
  };
}

/* ================= STYLES ================= */
const statusPillClass: Record<FnFStatus, string> = {
  NOT_STARTED: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  STARTED: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  FINAL: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
};

const statusDotClass: Record<FnFStatus, string> = {
  NOT_STARTED: "bg-[var(--muted-foreground)]",
  STARTED: "bg-[var(--status-warning)]",
  FINAL: "bg-[var(--status-good)]",
};

const statusLabel: Record<FnFStatus, string> = {
  NOT_STARTED: "Awaiting",
  STARTED: "Processing",
  FINAL: "Settled",
};

/* ================= MAIN COMPONENT ================= */
const FinalSettlement = () => {
  const [data, setData] = useState<FnFRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FnFRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields for the modal
  const [earnings, setEarnings] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [lastMonthSalary, setLastMonthSalary] = useState(0);
  const [unpaidSalary, setUnpaidSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [notes, setNotes] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/final-settlement/inactive-users`, {
        params: { page, search },
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.totalRecords || 0);
    } catch (error) {
      toast({ type: "error", title: "Fetch Failed", message: "Failed to fetch workforce exit data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  /* ================= DEBOUNCE SEARCH ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        setSearchParams({ page: "1", search: searchInput.trim() });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openFnF = (record: FnFRecord) => {
    setSelected(record);
    const details = record.settlementDetails;
    setEarnings(details?.earnings || 0);
    setDeductions(details?.deductions || 0);
    setLastMonthSalary(details?.lastMonthSalary || 0);
    setUnpaidSalary(details?.unpaidSalary || 0);
    setBonus(details?.bonus || 0);
    setNotes(details?.notes || "");
    setOpen(true);
  };

  // Auto calculate total earnings when sub-fields change
  useEffect(() => {
    const total = Number(lastMonthSalary) + Number(unpaidSalary) + Number(bonus);
    setEarnings(total);
  }, [lastMonthSalary, unpaidSalary, bonus]);

  const updateStatus = async (status: FnFStatus) => {
    if (!selected) return;
    setSaving(true);
    try {
      await axios.post(
        `${API_BASE}/final-settlement/update-status`,
        {
          userId: selected._id,
          status,
          earnings,
          deductions,
          lastMonthSalary,
          unpaidSalary,
          bonus,
          notes,
          lastWorkingDay: selected.settlementDetails?.lastWorkingDay
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ type: "success", title: "Status Updated", message: "Settlement record synchronized." });
      fetchData();
      setOpen(false);
    } catch (error) {
      toast({ type: "error", title: "Sync Failed", message: "Could not update settlement status" });
    } finally {
      setSaving(false);
    }
  };

  /* ================= KPI ================= */
  const kpis = {
    total: totalRecords,
    settled: data.filter((d) => d.settlementStatus === "FINAL").length,
    pending: data.filter((d) => d.settlementStatus !== "FINAL").length,
  };

  /* ================= PAGINATION LIST ================= */
  const pageList = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, page, page - 1, page + 1]);
    return Array.from(set)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  })();

  const goToPage = (p: number) => setSearchParams({ page: p.toString(), search });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Full & Final Settlement
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Offboarding <span className="mx-1">›</span> Final Settlement
          </p>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Total Inactive" value={kpis.total} icon={Users} tone="primary" sublabel="Employees pending exit" />
        <StatCard label="Settled" value={kpis.settled} icon={CheckCircle2} tone="good" sublabel="Final dues disbursed" />
        <StatCard label="Pending" value={kpis.pending} icon={AlertCircle} tone="warning" sublabel="Settlement in progress" />
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="relative sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or ID..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="card-premium shadow-premium-sm overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--card)]/60 backdrop-blur-[1px]">
            <Loader />
          </div>
        )}

        {data.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-2 p-16 text-center">
            <FileText className="h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">No exit records match your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Staff Identity</th>
                  <th className="px-4 py-3">Unit Info</th>
                  <th className="px-4 py-3">Service Tenure</th>
                  <th className="px-4 py-3">Current Phase</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.map((emp) => (
                  <tr key={emp._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-sm font-semibold text-[var(--primary)]">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{emp.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)]">
                        <Building2 className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        {emp.departmentId?.name || "Unassigned"}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">{emp.designationId?.name || "General Staff"}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined {new Date(emp.joiningDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusPillClass[emp.settlementStatus])}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClass[emp.settlementStatus])} />
                        {statusLabel[emp.settlementStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => openFnF(emp)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        {emp.settlementStatus === "NOT_STARTED" ? "Initiate" : "Details"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            Showing <span className="font-medium text-[var(--foreground)]">{data.length}</span> of{" "}
            <span className="font-medium text-[var(--foreground)]">{totalRecords}</span> exits
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageList.map((p, i) => {
              const prev = pageList[i - 1];
              const showEllipsis = prev !== undefined && p - prev > 1;
              return (
                <span key={p} className="flex items-center">
                  {showEllipsis && <span className="px-1 text-xs text-[var(--muted-foreground)]">…</span>}
                  <button
                    onClick={() => goToPage(p)}
                    className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors",
                      p === page ? "bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-white" : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                    )}
                  >
                    {p}
                  </button>
                </span>
              );
            })}
            <button
              onClick={() => goToPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 shadow-premium-lg">
          <DialogHeader className="border-b border-[var(--border)] bg-[var(--muted)] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]">
                <FileText className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-[var(--foreground)]">Final Settlement Calculation</DialogTitle>
                <p className="text-xs text-[var(--muted-foreground)]">Verify final dues, exit benefits, and outstanding recovery</p>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="p-6 space-y-6">
              {/* STAFF OVERVIEW */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Full Name</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">{selected.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Employee ID</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">{selected.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Unit</p>
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{selected.departmentId?.name || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Joining Date</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">{new Date(selected.joiningDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--status-critical)]">Separation Date</p>
                  <p className="text-sm font-semibold text-[var(--status-critical)]">
                    {selected.settlementDetails?.lastWorkingDay ? new Date(selected.settlementDetails.lastWorkingDay).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ACCRUED PAYOUTS (LEFT SIDE) */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]">
                      <CreditCard size={14} />
                    </span>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Accrued Benefits</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Last Month Salary (Pro-rata)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">₹</span>
                        <Input
                          type="number"
                          value={lastMonthSalary}
                          onChange={(e) => setLastMonthSalary(Number(e.target.value))}
                          className="h-11 rounded-lg border-[var(--border)] bg-[var(--card)] pl-7 text-[var(--foreground)] focus-visible:ring-[var(--primary)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Prior Unpaid Dues</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">₹</span>
                        <Input
                          type="number"
                          value={unpaidSalary}
                          onChange={(e) => setUnpaidSalary(Number(e.target.value))}
                          className="h-11 rounded-lg border-[var(--border)] bg-[var(--card)] pl-7 text-[var(--foreground)] focus-visible:ring-[var(--primary)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--primary)]">Bonus / Incentives</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--primary)]">₹</span>
                        <Input
                          type="number"
                          placeholder="Manual adjustment"
                          value={bonus}
                          onChange={(e) => setBonus(Number(e.target.value))}
                          className="h-11 rounded-lg border-[var(--primary)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] pl-7 font-medium text-[var(--primary)] focus-visible:ring-[var(--primary)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DEDUCTIONS & SUMMARY (RIGHT SIDE) */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]">
                      <AlertCircle size={14} />
                    </span>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Recoveries & Reductions</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Notice Pay / Other Deductions</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--status-critical)]">₹</span>
                        <Input
                          type="number"
                          value={deductions}
                          onChange={(e) => setDeductions(Number(e.target.value))}
                          className="h-11 rounded-lg border-[var(--border)] bg-[var(--card)] pl-7 font-medium text-[var(--status-critical)] focus-visible:ring-[var(--status-critical)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Strategic Auditor Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Rationale for adjustments..."
                        className="h-32 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* NET RESULTS SUMMARY */}
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--muted)]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
                  <div className="text-center md:text-left">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Final Disbursable Amount</p>
                    <p className="border-b-2 border-[var(--primary)] pb-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                      <span className="mr-2 text-lg text-[var(--primary)] opacity-70">₹</span>
                      {(earnings - deductions).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                    <div className="w-full sm:w-64">
                      <Select disabled={saving} onValueChange={(val) => updateStatus(val as FnFStatus)} value={selected.settlementStatus}>
                        <SelectTrigger className="h-12 w-full rounded-lg border-[var(--border)] bg-[var(--card)] font-medium text-[var(--foreground)] shadow-premium-sm">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-premium-lg">
                          <SelectItem value="NOT_STARTED">Awaiting Disposition</SelectItem>
                          <SelectItem value="STARTED" className="font-medium text-[var(--status-warning)]">Authorize Execution</SelectItem>
                          <SelectItem value="FINAL" className="font-semibold text-[var(--status-good)]">Finalize & Settle Dues</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      disabled={saving}
                      onClick={() => updateStatus(selected.settlementStatus)}
                      className="h-12 w-full rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-8 font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 active:scale-95 sm:w-auto"
                    >
                      {saving ? <Loader /> : "Authorize Changes"}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center border-t border-[var(--border)] bg-[var(--card)]/50 px-6 py-3">
                  <p className="text-center text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    This action will synchronize financial data with the current payroll cycle upon finalization.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinalSettlement;
