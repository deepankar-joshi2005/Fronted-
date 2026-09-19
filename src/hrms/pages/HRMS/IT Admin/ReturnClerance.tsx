/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Eye,
  Users,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  ShieldCheck,
  Banknote,
  User as UserIcon,
  Briefcase,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  };
  lastWorkingDay: string;
  clearances: DepartmentClearance[];
  overallStatus: "IN_PROGRESS" | "COMPLETED";
}

/* ================= STYLES ================= */

const deptPillClass: Record<Status, string> = {
  PENDING: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  CLEARED:
    "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  ISSUE:
    "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
};

const overallPillClass: Record<ClearanceRow["overallStatus"], string> = {
  IN_PROGRESS:
    "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  COMPLETED:
    "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
};

const overallDotClass: Record<ClearanceRow["overallStatus"], string> = {
  IN_PROGRESS: "bg-[var(--status-warning)]",
  COMPLETED: "bg-[var(--status-good)]",
};

/* ================= MAIN ================= */

const ReturnClerance = () => {
  const [data, setData] = useState<ClearanceRow[]>([]);
  const [selected, setSelected] = useState<ClearanceRow | null>(null);
  const [loading, setLoading] = useState(true);

  /* 🔹 FETCH APPROVED RESIGNATIONS → CLEARANCE */
  const fetchClearance = async () => {
    try {
      const res = await axios.get(`${API}/clearances`);
      setData(res.data);
    } catch (error) {
      console.error("Clearance fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClearance();
  }, []);

  const updateClearanceStatus = async (
    clearanceId: string,
    status: Status
  ) => {
    await axios.patch(`${API}/clearances/${clearanceId}/department`, {
      departmentName: "IT", // 🔥 seedha IT bhej diya
      status,
    });

    fetchClearance();
    setSelected(null);
  };

  const getDeptStatus = (row: ClearanceRow, dept: string) =>
    row.clearances.find((c) => c.department === dept)?.status || "PENDING";

  /* ================= KPI ================= */
  const kpis = useMemo(() => {
    const total = data.length;
    const itPending = data.filter((d) => getDeptStatus(d, "IT") === "PENDING").length;
    const itCleared = data.filter((d) => getDeptStatus(d, "IT") === "CLEARED").length;
    const itIssues = data.filter((d) => getDeptStatus(d, "IT") === "ISSUE").length;
    return { total, itPending, itCleared, itIssues };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Clearance Workflow
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Asset Management <span className="mx-1">›</span> Asset Return & Exit Clearance
          </p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Offboarding"
          value={kpis.total}
          icon={Users}
          tone="primary"
          sublabel="Employees in clearance"
        />
        <StatCard
          label="IT Pending"
          value={kpis.itPending}
          icon={Hourglass}
          tone="warning"
          sublabel="Awaiting IT sign-off"
        />
        <StatCard
          label="IT Cleared"
          value={kpis.itCleared}
          icon={CheckCircle2}
          tone="good"
          sublabel="Assets & access recovered"
        />
        <StatCard
          label="IT Issues"
          value={kpis.itIssues}
          icon={AlertTriangle}
          tone="critical"
          sublabel="Needs attention"
        />
      </div>

      {/* TABLE */}
      {data.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ClipboardCheck className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No clearance records found</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Sr No.</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">LWD</th>
                  <th className="px-4 py-3">IT</th>
                  <th className="px-4 py-3">Finance</th>
                  <th className="px-4 py-3">HR</th>
                  <th className="px-4 py-3">Overall</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {data.map((row, index) => (
                  <tr key={row._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{index + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-sm font-semibold text-[var(--primary)]">
                          {row.employee.name.charAt(0)}
                        </div>
                        <p className="font-medium text-[var(--foreground)]">{row.employee.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{row.employee.role}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(row.lastWorkingDay).toDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          deptPillClass[getDeptStatus(row, "IT")]
                        )}
                      >
                        {getDeptStatus(row, "IT")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          deptPillClass[getDeptStatus(row, "Finance")]
                        )}
                      >
                        {getDeptStatus(row, "Finance")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          deptPillClass[getDeptStatus(row, "HR")]
                        )}
                      >
                        {getDeptStatus(row, "HR")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          overallPillClass[row.overallStatus]
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", overallDotClass[row.overallStatus])} />
                        {row.overallStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        title="View"
                        onClick={() => setSelected(row)}
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
        </div>
      )}

      {/* View Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-0 shadow-premium-lg">
          <DialogHeader className="border-b border-[var(--border)] bg-[var(--muted)] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]">
                <ClipboardCheck className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-[var(--foreground)]">
                  Clearance Details
                </DialogTitle>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Departmental offboarding sign-off status
                </p>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Employee
                  </p>
                  <p className="text-sm font-medium text-[var(--foreground)]">{selected.employee.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Role
                  </p>
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{selected.employee.role}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Last Working Day
                  </p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {new Date(selected.lastWorkingDay).toDateString()}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    Overall Status
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      overallPillClass[selected.overallStatus]
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", overallDotClass[selected.overallStatus])} />
                    {selected.overallStatus}
                  </span>
                </div>
              </div>

              {/* Department Clearances */}
              <div className="space-y-3">
                <label className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Department Clearances
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selected.clearances.map((c) => {
                    const isIT = c.department === "IT";

                    return (
                      <div
                        key={c.department}
                        className={cn(
                          "space-y-3 rounded-xl border bg-[var(--card)] p-5 transition-colors",
                          isIT ? "border-[var(--primary)]" : "border-[var(--border)]"
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
                              {c.department !== "IT" && c.department !== "Finance" && c.department !== "HR" && (
                                <Briefcase size={14} />
                              )}
                            </span>
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground)]">
                              {c.department}
                            </h3>
                          </div>
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                              deptPillClass[c.status]
                            )}
                          >
                            {c.status}
                          </span>
                        </div>

                        {/* 👇 Only IT admin can update IT department */}
                        {isIT && c.status === "PENDING" && (
                          <div className="flex gap-2 border-t border-dashed border-[var(--border)] pt-3">
                            <Button
                              className="h-8 flex-1 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-xs font-semibold text-white shadow-premium-sm hover:opacity-90"
                              onClick={() => updateClearanceStatus(selected._id, "CLEARED")}
                            >
                              Mark Cleared
                            </Button>

                            <Button
                              variant="destructive"
                              className="h-8 flex-1 rounded-lg text-xs font-semibold"
                              onClick={() => updateClearanceStatus(selected._id, "ISSUE")}
                            >
                              Mark Issue
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  variant="ghost"
                  className="h-10 rounded-lg px-8 text-sm font-medium"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnClerance;
