/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  PackageCheck,
  ClipboardList,
  Laptop,
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
  overallStatus: "IN_PROGRESS" | "COMPLETED";
}

interface IAsset {
  _id: string;
  assetType: string;
  serialNumber: string;
  accessories: string[];
  status: "AVAILABLE" | "ASSIGNED";
  assignedTo: { _id: string; name: string; email: string } | null;
}

type CollectionFilter = "All" | "PENDING" | "COLLECTED";

interface CollectionRow {
  clearanceId: string;
  employee: IClearanceEmployee;
  lastWorkingDay: string;
  itStatus: IDepartmentClearance["status"];
  assets: IAsset[];
  status: "PENDING" | "COLLECTED";
  overdue: boolean;
}

/* ================= AUTH HEADER ================= */

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

/* ================= COMPONENT ================= */

export default function AssetCollectionStatus() {
  const [clearances, setClearances] = useState<IClearance[]>([]);
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CollectionFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH ================= */

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clearanceRes, assetRes] = await Promise.all([
        axios.get(`${API}/clearances`, {
          ...authHeaders(),
          params: { limit: 1000 },
        }),
        axios.get(`${API}/asset`, authHeaders()),
      ]);

      setClearances(clearanceRes.data?.data || []);
      setAssets(assetRes.data || []);
    } catch (error) {
      toast({
        type: "error",
        title: "Fetch Failed",
        message: "Failed to load asset collection status",
      });
      console.error("Asset collection status fetch error", error);
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

  /* ================= MARK ASSET COLLECTED ================= */

  const markCollected = async (assetId: string, assetLabel: string) => {
    try {
      setCollectingId(assetId);
      await axios.patch(`${API}/asset/${assetId}/unassign`, {}, authHeaders());

      toast({
        type: "success",
        title: "Asset Collected",
        message: `${assetLabel} has been marked as collected.`,
      });

      await fetchData();
    } catch (error) {
      toast({
        type: "error",
        title: "Failed",
        message: "Could not mark asset as collected. Please try again.",
      });
      console.error("Mark collected error", error);
    } finally {
      setCollectingId(null);
    }
  };

  /* ================= BUILD COLLECTION ROWS ================= */

  const rows: CollectionRow[] = useMemo(() => {
    const now = Date.now();

    return clearances.map((c) => {
      const heldAssets = assets.filter(
        (a) => a.status === "ASSIGNED" && a.assignedTo?._id === c.employee?._id
      );
      const itStatus =
        c.clearances.find((d) => d.department === "IT")?.status || "PENDING";

      return {
        clearanceId: c._id,
        employee: c.employee,
        lastWorkingDay: c.lastWorkingDay,
        itStatus,
        assets: heldAssets,
        status: heldAssets.length > 0 ? "PENDING" : "COLLECTED",
        overdue:
          heldAssets.length > 0 &&
          new Date(c.lastWorkingDay).getTime() < now,
      };
    });
  }, [clearances, assets]);

  /* ================= KPIs ================= */

  const kpis = useMemo(() => {
    const totalEmployees = rows.length;
    const pendingAssets = rows.reduce((sum, r) => sum + r.assets.length, 0);
    const fullyCollected = rows.filter((r) => r.status === "COLLECTED").length;
    const overdue = rows.filter((r) => r.overdue).length;
    return { totalEmployees, pendingAssets, fullyCollected, overdue };
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
        r.assets.some(
          (a) =>
            a.assetType?.toLowerCase().includes(q) ||
            a.serialNumber?.toLowerCase().includes(q)
        );
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
            Asset Collection Status
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Offboarding & IT Clearance <span className="mx-1">›</span> Asset Collection Status
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
          label="Assets Pending Collection"
          value={kpis.pendingAssets}
          icon={Boxes}
          tone="warning"
          sublabel="Still with employees"
        />
        <StatCard
          label="Fully Collected"
          value={kpis.fullyCollected}
          icon={CheckCircle2}
          tone="good"
          sublabel={`Of ${kpis.totalEmployees} employees`}
        />
        <StatCard
          label="Overdue Collections"
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
            placeholder="Search by employee, department, asset type or serial number..."
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
                ? `: ${statusFilter === "PENDING" ? "Pending" : "Collected"}`
                : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("All")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>
              Pending Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("COLLECTED")}>
              Fully Collected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      {filteredRows.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Boxes className="h-8 w-8 text-[var(--muted-foreground)]" />
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
                  <th className="px-4 py-3 min-w-[300px]">Assets to Collect</th>
                  <th className="px-4 py-3">IT Clearance</th>
                  <th className="px-4 py-3">Collection Status</th>
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

                    {/* ASSETS */}
                    <td className="px-4 py-3.5">
                      {row.assets.length === 0 ? (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          No assets currently held
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.assets.map((a) => (
                            <span
                              key={a._id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 pl-2 pr-1 text-xs"
                            >
                              <Laptop className="h-3 w-3 text-[var(--muted-foreground)]" />
                              <span className="font-medium text-[var(--foreground)]">{a.assetType}</span>
                              <span className="text-[var(--muted-foreground)]">({a.serialNumber})</span>
                              <button
                                title="Mark as collected"
                                disabled={collectingId === a._id}
                                onClick={() =>
                                  markCollected(a._id, `${a.assetType} (${a.serialNumber})`)
                                }
                                className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--status-good)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-good)_16%,transparent)] disabled:opacity-40"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
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

                    {/* COLLECTION STATUS */}
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          row.status === "COLLECTED"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : row.overdue
                            ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                            : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            row.status === "COLLECTED"
                              ? "bg-[var(--status-good)]"
                              : row.overdue
                              ? "bg-[var(--status-critical)]"
                              : "bg-[var(--status-warning)]"
                          )}
                        />
                        {row.status === "COLLECTED"
                          ? "Fully Collected"
                          : row.overdue
                          ? "Overdue"
                          : "Pending Collection"}
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
