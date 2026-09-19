/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { utils as XLSXUtils, writeFile as writeXlsx } from "xlsx";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Download,
  Plus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CalendarPlus,
} from "lucide-react";
import RoleModal from "./RoleModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

export interface Role {
  _id: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export default function Role() {
  const token = localStorage.getItem("token");

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH ROLES ================= */
  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ================= DELETE ================= */
  const deleteRole = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;

    await axios.delete(`${API_BASE}/roles/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast({
      type: "success",
      title: "Role Deleted",
      message: "Role deleted successfully.",
    });

    fetchRoles();
  };

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [roles, search]);

  const paginatedRoles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, page, pageSize]);

  const kpis = useMemo(() => {
    const total = roles.length;
    const active = roles.filter((r) => r.status === "Active").length;
    const inactive = total - active;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyAdded = roles.filter(
      (r) => new Date(r.createdAt).getTime() >= thirtyDaysAgo
    ).length;
    return { total, active, inactive, recentlyAdded };
  }, [roles]);

  const handleExport = () => {
    const sheet = XLSXUtils.json_to_sheet(
      filteredRoles.map((r) => ({
        "Role Name": r.name,
        Description: r.description || "-",
        Status: r.status,
        "Created On": new Date(r.createdAt).toLocaleDateString(),
      }))
    );
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, sheet, "Roles");
    writeXlsx(wb, `Roles-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

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
            Roles
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            System Configuration <span className="mx-1">›</span> Roles
          </p>
        </div>

        <button
          onClick={() => {
            setMode("add");
            setSelectedRole(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Role
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Roles" value={kpis.total} icon={ShieldCheck} tone="primary" sublabel="All defined roles" />
        <StatCard
          label="Active Roles"
          value={kpis.active}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Inactive Roles" value={kpis.inactive} icon={XCircle} tone="critical" sublabel="Currently disabled" />
        <StatCard
          label="Recently Added"
          value={kpis.recentlyAdded}
          icon={CalendarPlus}
          tone="warning"
          sublabel="In last 30 days"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles by name or description..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* TABLE */}
      {filteredRoles.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ShieldCheck className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No roles match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Role Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedRoles.map((role, i) => (
                  <tr key={role._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{role.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{role.description || "-"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          role.status === "Active"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            role.status === "Active" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                          )}
                        />
                        {role.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(role.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View"
                          onClick={() => {
                            setMode("view");
                            setSelectedRole(role);
                            setOpenModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => {
                            setMode("edit");
                            setSelectedRole(role);
                            setOpenModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => deleteRole(role._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
              total={filteredRoles.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="roles"
            />
          </div>
        </div>
      )}

      <RoleModal
        isOpen={openModal}
        mode={mode}
        role={selectedRole}
        onClose={() => {
          setOpenModal(false);
          fetchRoles();
        }}
      />
    </div>
  );
}
