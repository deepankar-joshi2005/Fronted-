/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  X,
  Search,
  SlidersHorizontal,
  Boxes,
  CheckCircle2,
  UserCheck,
  Users,
  UserPlus,
  RefreshCcw,
  UserMinus,
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

const API = import.meta.env.VITE_API_URL;

/* ---------------- TYPES ---------------- */
interface User {
  _id: string;
  name: string;
  email: string;
}

interface Asset {
  _id: string;
  assetType: string;
  serialNumber: string;
  status: "AVAILABLE" | "ASSIGNED";
  assignedTo?: User | null;
}

type StatusFilter = "All" | "AVAILABLE" | "ASSIGNED";

/* ---------------- COMPONENT ---------------- */
export default function AssignReassignAsset() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [employeeId, setEmployeeId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ---------------- FETCH DATA ---------------- */
  const fetchAssets = async () => {
    try {
      const res = await axios.get(`${API}/asset`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAssets(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setUsers(res.data);
  };

  useEffect(() => {
    fetchAssets();
    fetchUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  /* ---------------- ASSIGN / RE-ASSIGN ---------------- */
  const handleAssign = async () => {
    if (!selectedAsset || !employeeId) return;

    await axios.patch(
      `${API}/asset/${selectedAsset._id}/assign`,
      { employeeId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setOpen(false);
    setEmployeeId("");
    setSelectedAsset(null);
    fetchAssets();
  };

  /* ---------------- UNASSIGN (OPTIONAL) ---------------- */
  const handleUnassign = async (assetId: string) => {
    await axios.patch(
      `${API}/asset/${assetId}/unassign`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    fetchAssets();
  };

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      const matchesSearch =
        !q ||
        a.assetType?.toLowerCase().includes(q) ||
        a.serialNumber?.toLowerCase().includes(q) ||
        a.assignedTo?.name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [assets, search, statusFilter]);

  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, page, pageSize]);

  const kpis = useMemo(() => {
    const total = assets.length;
    const assigned = assets.filter((a) => a.status === "ASSIGNED").length;
    const available = assets.filter((a) => a.status === "AVAILABLE").length;
    const employeesWithAssets = new Set(
      assets.filter((a) => a.assignedTo).map((a) => a.assignedTo!._id)
    ).size;
    return { total, assigned, available, employeesWithAssets };
  }, [assets]);

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Asset Assignment
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Asset Management <span className="mx-1">›</span> Assign / Re-Assign Assets
        </p>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Assets" value={kpis.total} icon={Boxes} tone="primary" sublabel="All IT assets" />
        <StatCard
          label="Assigned"
          value={kpis.assigned}
          icon={UserCheck}
          tone="warning"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.assigned / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Available" value={kpis.available} icon={CheckCircle2} tone="good" sublabel="Ready to assign" />
        <StatCard
          label="Employees With Assets"
          value={kpis.employeesWithAssets}
          icon={Users}
          tone="violet"
          sublabel="Unique holders"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by asset type, serial number or assignee..."
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
              Filters{statusFilter !== "All" ? `: ${statusFilter === "AVAILABLE" ? "Available" : "Assigned"}` : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("All")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("AVAILABLE")}>Available</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("ASSIGNED")}>Assigned</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      {filteredAssets.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Boxes className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No assets match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Serial Number</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedAssets.map((asset, i) => (
                  <tr key={asset._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{asset.assetType}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
                        {asset.serialNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {asset.assignedTo ? asset.assignedTo.name : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          asset.status === "AVAILABLE"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            asset.status === "AVAILABLE" ? "bg-[var(--status-good)]" : "bg-[var(--status-warning)]"
                          )}
                        />
                        {asset.status}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title={asset.status === "AVAILABLE" ? "Assign" : "Re-Assign"}
                          onClick={() => {
                            setSelectedAsset(asset);
                            setOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          {asset.status === "AVAILABLE" ? (
                            <UserPlus className="h-4 w-4" />
                          ) : (
                            <RefreshCcw className="h-4 w-4" />
                          )}
                        </button>

                        {asset.status === "ASSIGNED" && (
                          <button
                            title="Unassign"
                            onClick={() => handleUnassign(asset._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
              total={filteredAssets.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="assets"
            />
          </div>
        </div>
      )}

      {/* MODAL */}
      {open && selectedAsset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] px-4">
          <div className="card-premium relative w-full max-w-lg p-6 shadow-premium-sm">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-6">
              {selectedAsset.status === "AVAILABLE" ? "Assign Asset" : "Re-Assign Asset"}
            </h2>

            {/* FORM */}
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Asset</label>
                <input
                  disabled
                  value={`${selectedAsset.assetType} (${selectedAsset.serialNumber})`}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--muted-foreground)] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Assign To</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                >
                  <option value="">Select Employee</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!employeeId}
                className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {selectedAsset.status === "AVAILABLE" ? "Assign Asset" : "Re-Assign Asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
