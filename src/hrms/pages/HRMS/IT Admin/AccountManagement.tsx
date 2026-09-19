/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  Search,
  SlidersHorizontal,
  Users,
  CheckCircle2,
  Lock,
  UserX,
} from "lucide-react";
import AccountViewModal from "./AccountViewModal";
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

export interface UserType {
  _id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "HR" | "MANAGER" | "ADMIN";
  department: string;
  departmentId: { _id: string; name: string };
  designation: string;
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  createdAt: string;
}

type StatusFilter = "All" | "ACTIVE" | "LOCKED" | "DISABLED";

const statusLabel: Record<StatusFilter, string> = {
  All: "All",
  ACTIVE: "Active",
  LOCKED: "Locked",
  DISABLED: "Disabled",
};

const statusToneClasses: Record<UserType["status"], string> = {
  ACTIVE: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  LOCKED: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  DISABLED: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
};

const statusDotClasses: Record<UserType["status"], string> = {
  ACTIVE: "bg-[var(--status-good)]",
  LOCKED: "bg-[var(--status-warning)]",
  DISABLED: "bg-[var(--status-critical)]",
};

export default function AccountManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const kpis = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const locked = users.filter((u) => u.status === "LOCKED").length;
    const disabled = users.filter((u) => u.status === "DISABLED").length;
    return { total, active, locked, disabled };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.departmentId?.name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [users, search, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

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
          Account Management
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          System Access &amp; Accounts <span className="mx-1">›</span> Account Management
        </p>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Accounts" value={kpis.total} icon={Users} tone="primary" sublabel="All user accounts" />
        <StatCard
          label="Active Accounts"
          value={kpis.active}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Locked Accounts" value={kpis.locked} icon={Lock} tone="warning" sublabel="Awaiting reset" />
        <StatCard label="Disabled Accounts" value={kpis.disabled} icon={UserX} tone="critical" sublabel="Access revoked" />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role or department..."
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
              Filters{statusFilter !== "All" ? `: ${statusLabel[statusFilter]}` : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["All", "ACTIVE", "LOCKED", "DISABLED"] as StatusFilter[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                {statusLabel[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      {filteredUsers.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Users className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No accounts match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedUsers.map((user, index) => (
                  <tr key={user._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{user.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{user.email}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{user.role}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{user.departmentId?.name}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          statusToneClasses[user.status]
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClasses[user.status])} />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View"
                          onClick={() => {
                            setSelectedUser(user);
                            setMode("view");
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => {
                            setSelectedUser(user);
                            setMode("edit");
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Pencil className="h-4 w-4" />
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
              total={filteredUsers.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="accounts"
            />
          </div>
        </div>
      )}

      {selectedUser && (
        <AccountViewModal
          user={selectedUser}
          mode={mode}
          onClose={() => setSelectedUser(null)}
          onUpdated={fetchUsers}
        />
      )}
    </div>
  );
}
