/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Eye,
  X,
  Users,
  Hourglass,
  CheckCircle2,
  Laptop,
  ClipboardCheck,
  KeyRound,
} from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

type ClearanceStatus = "PENDING" | "CLEARED" | "ISSUE";

interface Row {
  clearanceId: string;
  employee: {
    _id: string;
    name: string;
    role: string;
  };
  emailStatus: string;
  assetStatus: string;
  licenseStatus: string;
  itStatus: ClearanceStatus;

  assets: any[];
  licenses: any[];
  lastWorkingDay: string;
}

/* ================= STYLES ================= */

const itStatusPillClass: Record<ClearanceStatus, string> = {
  PENDING:
    "border-[var(--status-warning)] bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)]",
  CLEARED:
    "border-transparent bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  ISSUE:
    "border-[var(--status-critical)] bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] text-[var(--status-critical)]",
};

/* ================= COMPONENT ================= */

export default function ITClearanceDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewRow, setViewRow] = useState<Row | null>(null);

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  /* ================= FETCH DATA ================= */

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [clearanceRes, assetRes, licenseRes] = await Promise.all([
        axios.get(`${API}/clearances`, { headers, params: { limit: 1000 } }),
        axios.get(`${API}/asset`, { headers }),
        axios.get(`${API}/license/assigned`, { headers }),
      ]);

      const clearances = clearanceRes.data.data || [];
      const assets = assetRes.data;
      const licenses = licenseRes.data;

      const mapped: Row[] = clearances.map((c: any) => {
        const empId = c.employee._id;

        const employeeAssets = assets.filter(
          (a: any) => a.assignedTo?._id === empId
        );

        const employeeLicenses = licenses.filter(
          (l: any) => l.user?._id === empId
        );

        const itClearance = c.clearances.find(
          (x: any) => x.department === "IT"
        );

        return {
          clearanceId: c._id,
          employee: c.employee,
          lastWorkingDay: c.lastWorkingDay,

          emailStatus: "DEACTIVATED",

          assetStatus: employeeAssets.length ? "ALLOCATED" : "DEALLOCATED",

          licenseStatus: employeeLicenses.length ? "ALLOCATED" : "DEALLOCATED",

          itStatus: itClearance?.status || "PENDING",

          assets: employeeAssets,
          licenses: employeeLicenses,
        };
      });

      setRows(mapped);
    } catch (err) {
      console.error("IT Dashboard Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  /* ================= UPDATE IT STATUS ================= */

  const updateITStatus = async (
    clearanceId: string,
    status: ClearanceStatus
  ) => {
    await axios.patch(
      `${API}/clearances/${clearanceId}/department`,
      {
        department: "IT",
        status,
      },
      { headers }
    );

    fetchDashboard();
  };

  /* ================= KPI ================= */
  const kpis = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.itStatus === "PENDING").length;
    const cleared = rows.filter((r) => r.itStatus === "CLEARED").length;
    const assetsAllocated = rows.filter((r) => r.assetStatus === "ALLOCATED").length;
    return { total, pending, cleared, assetsAllocated };
  }, [rows]);

  /* ================= UI ================= */

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
            IT Clearance Dashboard
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Offboarding & IT Clearance <span className="mx-1">›</span> Access Deactivation
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
          sublabel="Employees exiting"
        />
        <StatCard
          label="Pending IT Clearance"
          value={kpis.pending}
          icon={Hourglass}
          tone="warning"
          sublabel="Awaiting review"
        />
        <StatCard
          label="Cleared"
          value={kpis.cleared}
          icon={CheckCircle2}
          tone="good"
          sublabel="IT sign-off complete"
        />
        <StatCard
          label="Assets Still Allocated"
          value={kpis.assetsAllocated}
          icon={Laptop}
          tone="critical"
          sublabel="Pending recovery"
        />
      </div>

      {/* TABLE */}
      {rows.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ClipboardCheck className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No offboarding employees found</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Assets</th>
                  <th className="px-4 py-3">Licenses</th>
                  <th className="px-4 py-3">IT Clearance</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((row) => (
                  <tr key={row.clearanceId} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-sm font-semibold text-[var(--primary)]">
                          {row.employee.name.charAt(0)}
                        </div>
                        <p className="font-medium text-[var(--foreground)]">{row.employee.name}</p>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{row.employee.role}</td>

                    {/* EMAIL */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          row.emailStatus === "ACTIVE"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            row.emailStatus === "ACTIVE" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                          )}
                        />
                        {row.emailStatus}
                      </span>
                    </td>

                    {/* ASSET */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          row.assetStatus === "ALLOCATED"
                            ? "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        )}
                      >
                        {row.assetStatus}
                      </span>
                    </td>

                    {/* LICENSE */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          row.licenseStatus === "ALLOCATED"
                            ? "bg-[color-mix(in_oklab,#7C3AED_14%,transparent)] text-[#7C3AED]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        )}
                      >
                        {row.licenseStatus}
                      </span>
                    </td>

                    {/* IT CLEARANCE */}
                    <td className="px-4 py-3.5">
                      {row.itStatus === "CLEARED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--status-good)]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Cleared
                        </span>
                      ) : row.itStatus === "ISSUE" ? (
                        <select
                          value={row.itStatus}
                          onChange={(e) =>
                            updateITStatus(row.clearanceId, e.target.value as ClearanceStatus)
                          }
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors focus:border-[var(--primary)]",
                            itStatusPillClass.ISSUE
                          )}
                        >
                          <option value="ISSUE">Issue</option>
                          <option value="PENDING">Pending</option>
                          <option value="CLEARED">Mark Approved</option>
                        </select>
                      ) : (
                        <select
                          value={row.itStatus}
                          onChange={(e) =>
                            updateITStatus(row.clearanceId, e.target.value as ClearanceStatus)
                          }
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors focus:border-[var(--primary)]",
                            itStatusPillClass.PENDING
                          )}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CLEARED">Mark Approved</option>
                          <option value="ISSUE">Issue</option>
                        </select>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        title="View"
                        onClick={() => setViewRow(row)}
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

      {/* VIEW MODAL */}
      {viewRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="card-premium max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 shadow-premium-lg">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]">
                  <ClipboardCheck className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">IT Clearance Details</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Access, asset & license recovery status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewRow(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* EMPLOYEE INFO */}
            <div className="mb-6 grid grid-cols-2 gap-5 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-5 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Name</p>
                <p className="font-medium text-[var(--foreground)]">{viewRow.employee.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">Role</p>
                <p className="font-medium text-[var(--foreground)]">{viewRow.employee.role}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Last Working Day
                </p>
                <p className="font-medium text-[var(--foreground)]">
                  {new Date(viewRow.lastWorkingDay).toDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  IT Status
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    viewRow.itStatus === "CLEARED"
                      ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                      : viewRow.itStatus === "ISSUE"
                      ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                      : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                  )}
                >
                  {viewRow.itStatus}
                </span>
              </div>
            </div>

            {/* EMAIL */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Email
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                Deactivated
              </span>
            </div>

            {/* ASSETS */}
            <div className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Assets
              </h3>

              {viewRow.assets.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No assets assigned</p>
              ) : (
                <div className="space-y-2">
                  {viewRow.assets.map((a: any) => (
                    <div
                      key={a._id}
                      className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 text-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]">
                        <Laptop className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {a.assetType} <span className="text-[var(--muted-foreground)]">({a.serialNumber})</span>
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Accessories: {a.accessories.join(", ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LICENSES */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Licenses
              </h3>

              {viewRow.licenses.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No active licenses</p>
              ) : (
                <div className="space-y-2">
                  {viewRow.licenses.map((l: any) => (
                    <div
                      key={l._id}
                      className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3 text-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklab,#7C3AED_14%,transparent)] text-[#7C3AED]">
                        <KeyRound className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{l.software}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Key: {l.licenseKey || "N/A"}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Status: {l.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
