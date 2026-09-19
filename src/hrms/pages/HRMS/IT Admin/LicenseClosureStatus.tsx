/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Ban,
  ClipboardList,
  KeyRound,
  CalendarClock,
} from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "../Alert/Toast";

const API = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

interface IClearanceEmployee {
  _id: string;
  name: string;
  role: string;
  departmentId?: { _id: string; name: string };
}

interface IDepartmentClearance {
  department: string;
  status: "PENDING" | "CLEARED" | "ISSUE";
}

interface IClearance {
  _id: string;
  employee: IClearanceEmployee;
  lastWorkingDay: string;
  clearances: IDepartmentClearance[];
}

interface ILicense {
  _id: string;
  user: { _id: string; name: string; email: string } | null;
  software: string;
  licenseKey?: string;
  expiryDate?: string;
  status: "ACTIVE" | "REVOKED";
}

type ClosureFilter = "All" | "PENDING" | "CLOSED";

interface ClosureRow {
  clearanceId: string;
  employee: IClearanceEmployee;
  lastWorkingDay: string;
  itStatus: IDepartmentClearance["status"];
  licenses: ILicense[];
  status: "PENDING" | "CLOSED";
  overdue: boolean;
}

/* ================= AUTH HEADER ================= */

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

/* ================= COMPONENT ================= */

export default function LicenseClosureStatus() {
  const [clearances, setClearances] = useState<IClearance[]>([]);
  const [licenses, setLicenses] = useState<ILicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClosureFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH ================= */

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clearanceRes, licenseRes] = await Promise.all([
        axios.get(`${API}/clearances`, {
          ...authHeaders(),
          params: { limit: 1000 },
        }),
        axios.get(`${API}/license/assigned`, authHeaders()),
      ]);

      setClearances(clearanceRes.data?.data || []);
      setLicenses(licenseRes.data || []);
    } catch (error) {
      toast({
        type: "error",
        title: "Fetch Failed",
        message: "Failed to load license closure status",
      });
      console.error("License closure fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  /* ================= REVOKE LICENSE ================= */

  const revokeLicense = async (licenseId: string, licenseLabel: string) => {
    try {
      setRevokingId(licenseId);
      await axios.patch(`${API}/license/revoke/${licenseId}`, {}, authHeaders());

      toast({
        type: "success",
        title: "License Closed",
        message: `${licenseLabel} has been revoked.`,
      });

      await fetchData();
    } catch (error) {
      toast({
        type: "error",
        title: "Failed",
        message: "Could not revoke license. Please try again.",
      });
      console.error("Revoke license error", error);
    } finally {
      setRevokingId(null);
    }
  };

  /* ================= BUILD CLOSURE ROWS ================= */

  const rows: ClosureRow[] = useMemo(() => {
    const now = Date.now();

    return clearances.map((c) => {
      const activeLicenses = licenses.filter(
        (l) => l.status === "ACTIVE" && l.user?._id === c.employee?._id
      );
      const itStatus =
        c.clearances.find((d) => d.department === "IT")?.status || "PENDING";

      return {
        clearanceId: c._id,
        employee: c.employee,
        lastWorkingDay: c.lastWorkingDay,
        itStatus,
        licenses: activeLicenses,
        status: activeLicenses.length > 0 ? "PENDING" : "CLOSED",
        overdue:
          activeLicenses.length > 0 &&
          new Date(c.lastWorkingDay).getTime() < now,
      };
    });
  }, [clearances, licenses]);

  /* ================= KPIs ================= */

  const kpis = useMemo(() => {
    const totalEmployees = rows.length;
    const pendingLicenses = rows.reduce((sum, r) => sum + r.licenses.length, 0);
    const fullyClosed = rows.filter((r) => r.status === "CLOSED").length;
    const overdue = rows.filter((r) => r.overdue).length;
    return { totalEmployees, pendingLicenses, fullyClosed, overdue };
  }, [rows]);

  /* ================= FILTER ================= */

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      const matchesSearch =
        !q ||
        r.employee?.name?.toLowerCase().includes(q) ||
        r.employee?.departmentId?.name?.toLowerCase().includes(q) ||
        r.licenses.some((l) => l.software?.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [rows, search, statusFilter]);

  const sortedRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) => {
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
        if (a.status !== b.status) return a.status === "PENDING" ? -1 : 1;
        return new Date(a.lastWorkingDay).getTime() - new Date(b.lastWorkingDay).getTime();
      }),
    [filteredRows]
  );

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

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
            License Closure
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Offboarding & IT Clearance <span className="mx-1">›</span> License Closure
          </p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Offboarding Employees"
          value={kpis.totalEmployees}
          icon={ClipboardList}
          tone="primary"
          sublabel="In exit process"
        />
        <StatCard
          label="Licenses Pending Closure"
          value={kpis.pendingLicenses}
          icon={KeyRound}
          tone="warning"
          sublabel="Still active"
        />
        <StatCard
          label="Fully Closed"
          value={kpis.fullyClosed}
          icon={CheckCircle2}
          tone="good"
          sublabel={`Of ${kpis.totalEmployees} employees`}
        />
        <StatCard
          label="Overdue Closures"
          value={kpis.overdue}
          icon={AlertTriangle}
          tone="critical"
          sublabel="Past last working day"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, department or software..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]",
                statusFilter !== "All" && "border-[var(--primary)] text-[var(--primary)]"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {statusFilter !== "All"
                ? `: ${statusFilter === "PENDING" ? "Pending" : "Closed"}`
                : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("All")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>
              Pending Closure
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("CLOSED")}>
              Fully Closed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      {filteredRows.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ShieldCheck className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            No offboarding employees match your search
          </p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3 min-w-[200px]">Employee</th>
                  <th className="px-4 py-3">Last Working Day</th>
                  <th className="px-4 py-3 min-w-[300px]">Licenses to Close</th>
                  <th className="px-4 py-3">IT Clearance</th>
                  <th className="px-4 py-3">Closure Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedRows.map((row) => (
                  <tr key={row.clearanceId} className="transition-colors hover:bg-[var(--muted)]">
                    {/* EMPLOYEE */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-sm font-semibold text-[var(--primary)]">
                          {row.employee?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{row.employee?.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {row.employee?.role}
                            {row.employee?.departmentId?.name
                              ? ` · ${row.employee.departmentId.name}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* LAST WORKING DAY */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium",
                          row.overdue ? "text-[var(--status-critical)]" : "text-[var(--muted-foreground)]"
                        )}
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        {new Date(row.lastWorkingDay).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* LICENSES */}
                    <td className="px-4 py-3.5">
                      {row.licenses.length === 0 ? (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          No active licenses
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.licenses.map((l) => (
                            <span
                              key={l._id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 pl-2 pr-1 text-xs"
                            >
                              <KeyRound className="h-3 w-3 text-[var(--muted-foreground)]" />
                              <span className="font-medium text-[var(--foreground)]">{l.software}</span>
                              {l.expiryDate && (
                                <span className="text-[var(--muted-foreground)]">
                                  (exp. {new Date(l.expiryDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })})
                                </span>
                              )}
                              <button
                                title="Revoke license"
                                disabled={revokingId === l._id}
                                onClick={() => revokeLicense(l._id, l.software)}
                                className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--status-critical)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_16%,transparent)] disabled:opacity-40"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* IT CLEARANCE */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          row.itStatus === "CLEARED"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : row.itStatus === "ISSUE"
                            ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        )}
                      >
                        {row.itStatus}
                      </span>
                    </td>

                    {/* CLOSURE STATUS */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          row.status === "CLOSED"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : row.overdue
                            ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                            : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            row.status === "CLOSED"
                              ? "bg-[var(--status-good)]"
                              : row.overdue
                              ? "bg-[var(--status-critical)]"
                              : "bg-[var(--status-warning)]"
                          )}
                        />
                        {row.status === "CLOSED"
                          ? "Fully Closed"
                          : row.overdue
                          ? "Overdue"
                          : "Pending Closure"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[var(--border)] px-4 py-3.5">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={filteredRows.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="employees"
            />
          </div>
        </div>
      )}
    </div>
  );
}
