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
import {
  Search,
  Eye,
  User as UserIcon,
  ShieldCheck,
  Banknote,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Users,
  Hourglass,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "../Alert/Toast";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */
type Status = "PENDING" | "CLEARED" | "ISSUE";

interface DepartmentClearance {
  department: string;
  tasks: string[];
  status: Status;
  remarks?: string;
}

interface ClearanceRow {
  _id: string;
  employee: {
    name: string;
    role: string;
    departmentId?: { name: string };
  };
  lastWorkingDay: string;
  clearances: DepartmentClearance[];
  overallStatus: "IN_PROGRESS" | "COMPLETED";
}

/* ================= STYLES ================= */
const deptPillClass: Record<Status, string> = {
  PENDING: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  CLEARED: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  ISSUE: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
};

const overallPillClass: Record<ClearanceRow["overallStatus"], string> = {
  IN_PROGRESS: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  COMPLETED: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
};

const overallDotClass: Record<ClearanceRow["overallStatus"], string> = {
  IN_PROGRESS: "bg-[var(--status-warning)]",
  COMPLETED: "bg-[var(--status-good)]",
};

/* ================= MAIN ================= */
const Clearance = () => {
  const [data, setData] = useState<ClearanceRow[]>([]);
  const [selected, setSelected] = useState<ClearanceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [hrStatus, setHrStatus] = useState<Status>("PENDING");
  const [hrRemarks, setHrRemarks] = useState("");
  const [hrSaving, setHrSaving] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(search);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const token = localStorage.getItem("token");

  /* 🔹 FETCH CLEARANCE */
  const fetchClearance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/clearances`, {
        params: { page, search },
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.totalRecords || 0);
    } catch (error) {
      toast({ type: "error", title: "Fetch Failed", message: "Failed to load clearance workflows" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearance();
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

  /* 🔹 OPEN WORKFLOW DIALOG */
  const openWorkflow = (row: ClearanceRow) => {
    setSelected(row);
    const hr = row.clearances.find((c) => c.department === "HR");
    setHrStatus(hr?.status || "PENDING");
    setHrRemarks(hr?.remarks || "");
  };

  /* 🔹 SUPERADMIN DIRECTLY UPDATES HR CLEARANCE */
  const handleUpdateHR = async () => {
    if (!selected) return;
    try {
      setHrSaving(true);
      await axios.patch(
        `${API}/clearances/${selected._id}/department`,
        { departmentName: "HR", status: hrStatus, remarks: hrRemarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ type: "success", title: "HR Clearance Updated", message: "HR status has been synchronized." });
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              clearances: prev.clearances.map((c) =>
                c.department === "HR" ? { ...c, status: hrStatus, remarks: hrRemarks } : c
              ),
            }
          : prev
      );
      fetchClearance();
    } catch (error) {
      toast({ type: "error", title: "Update Failed", message: "Could not update HR clearance status" });
    } finally {
      setHrSaving(false);
    }
  };

  /* ================= KPI ================= */
  const kpis = {
    total: totalRecords,
    inProgress: data.filter((d) => d.overallStatus === "IN_PROGRESS").length,
    completed: data.filter((d) => d.overallStatus === "COMPLETED").length,
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

  const getDeptStatus = (row: ClearanceRow, dept: string) =>
    row.clearances.find((c) => c.department === dept)?.status || "PENDING";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Clearance Tracking
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Offboarding <span className="mx-1">›</span> Clearance
          </p>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Total Clearances" value={kpis.total} icon={Users} tone="primary" sublabel="Employees in offboarding" />
        <StatCard label="In Progress" value={kpis.inProgress} icon={Hourglass} tone="warning" sublabel="Awaiting department sign-off" />
        <StatCard label="Completed" value={kpis.completed} icon={CheckCircle2} tone="good" sublabel="Fully cleared" />
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="relative sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name..."
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
            <ClipboardCheck className="h-8 w-8 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">No clearance records match your search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">IT Clearance</th>
                  <th className="px-4 py-3">Finance</th>
                  <th className="px-4 py-3">HR Unit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.map((row) => (
                  <tr key={row._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-sm font-semibold text-[var(--primary)]">
                          {row.employee.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{row.employee.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{row.employee.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", deptPillClass[getDeptStatus(row, "IT")])}>
                        {getDeptStatus(row, "IT")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", deptPillClass[getDeptStatus(row, "Finance")])}>
                        {getDeptStatus(row, "Finance")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", deptPillClass[getDeptStatus(row, "HR")])}>
                        {getDeptStatus(row, "HR")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", overallPillClass[row.overallStatus])}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", overallDotClass[row.overallStatus])} />
                        {row.overallStatus === "COMPLETED" ? "Cleared" : "In Progress"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        title="Open Workflow"
                        onClick={() => openWorkflow(row)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        <Eye className="h-4 w-4" />
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
            <span className="font-medium text-[var(--foreground)]">{totalRecords}</span> entries
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

      {/* ================= VIEW DIALOG ================= */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 shadow-premium-lg">
          <DialogHeader className="border-b border-[var(--border)] bg-[var(--muted)] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]">
                <ClipboardCheck className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-[var(--foreground)]">Clearance Lifecycle</DialogTitle>
                <p className="text-sm text-[var(--muted-foreground)]">Departmental audit and asset recovery status</p>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="p-6 space-y-6">
              {/* STAFF OVERVIEW */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Staff Name</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">{selected.employee.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Designation</p>
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{selected.employee.role}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Final Day</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">{new Date(selected.lastWorkingDay).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Discharge</p>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      overallPillClass[selected.overallStatus]
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", overallDotClass[selected.overallStatus])} />
                    {selected.overallStatus === "COMPLETED" ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>

              {/* DEPARTMENTAL REVIEW */}
              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Infrastructure & Accounts Audit
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selected.clearances.map((c, idx) => {
                    const isHR = c.department === "HR";
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "space-y-3 rounded-xl border bg-[var(--card)] p-5 transition-colors",
                          isHR ? "border-[var(--primary)]" : "border-[var(--border)]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                deptPillClass[c.status]
                              )}
                            >
                              {c.department === "IT" && <ShieldCheck size={14} />}
                              {c.department === "Finance" && <Banknote size={14} />}
                              {c.department === "HR" && <UserIcon size={14} />}
                              {c.department !== "IT" && c.department !== "Finance" && c.department !== "HR" && <Briefcase size={14} />}
                            </span>
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]">{c.department}</h3>
                          </div>
                          {isHR ? (
                            <select
                              value={hrStatus}
                              disabled={hrSaving}
                              onChange={(e) => setHrStatus(e.target.value as Status)}
                              className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs font-medium text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CLEARED">CLEARED</option>
                              <option value="ISSUE">ISSUE</option>
                            </select>
                          ) : (
                            <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", deptPillClass[c.status])}>
                              {c.status}
                            </span>
                          )}
                        </div>

                        <div className="min-h-[56px]">
                          {c.tasks && c.tasks.length > 0 ? (
                            <div className="space-y-1.5">
                              {c.tasks.map((task, index) => (
                                <div key={index} className="flex items-start gap-2 text-xs font-medium text-[var(--muted-foreground)]">
                                  <CheckCircle2 size={12} className="mt-0.5 text-[var(--status-good)]" />
                                  {task}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs italic text-[var(--muted-foreground)]">Universal clearance protocol applied.</p>
                          )}
                        </div>

                        {isHR ? (
                          <div className="space-y-2 border-t border-dashed border-[var(--border)] pt-3">
                            <input
                              type="text"
                              value={hrRemarks}
                              disabled={hrSaving}
                              onChange={(e) => setHrRemarks(e.target.value)}
                              placeholder="HR remarks (optional)"
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                            />
                            <button
                              disabled={hrSaving}
                              onClick={handleUpdateHR}
                              className="flex h-8 w-full items-center justify-center rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-xs font-semibold uppercase tracking-wide text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                              {hrSaving ? "Saving..." : "Save HR Status"}
                            </button>
                          </div>
                        ) : (
                          c.remarks && (
                            <div className="flex items-center gap-2 rounded-lg bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] p-2 text-xs font-medium text-[var(--status-critical)]">
                              <AlertTriangle size={12} />
                              {c.remarks}
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  className="h-10 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-8 text-sm font-medium text-white shadow-premium-sm hover:opacity-90"
                  onClick={() => setSelected(null)}
                >
                  Acknowledge Review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clearance;
