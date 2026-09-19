/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  X,
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  Ban,
  CalendarClock,
  SlidersHorizontal,
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
type UserType = {
  _id: string;
  name: string;
  email: string;
};

type AssignmentType = {
  _id: string;
  user: UserType;
  software: string;
  licenseKey?: string;
  assignedAt: string;
  expiryDate?: string;
  status: "ACTIVE" | "REVOKED";
};

type StatusFilter = "All" | "ACTIVE" | "REVOKED";

/* ---------------- MAIN PAGE ---------------- */
export default function SoftwareAndLicenseAssignment() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* Fetch Users */
  const fetchUsers = async () => {
    const res = await axios.get(`${API}/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setUsers(res.data);
  };

  /* Fetch Assigned Software */
  const fetchAssignments = async () => {
    const res = await axios.get(`${API}/license/assigned`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setAssignments(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchAssignments();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  /* Revoke */
  const revokeLicense = async (id: string) => {
    await axios.patch(`${API}/license/revoke/${id}`);
    fetchAssignments();
  };

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      const matchesSearch =
        !q ||
        a.user?.name?.toLowerCase().includes(q) ||
        a.user?.email?.toLowerCase().includes(q) ||
        a.software?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [assignments, search, statusFilter]);

  const paginatedAssignments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, page, pageSize]);

  const kpis = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter((a) => a.status === "ACTIVE").length;
    const revoked = assignments.filter((a) => a.status === "REVOKED").length;
    const now = Date.now();
    const in30Days = now + 30 * 24 * 60 * 60 * 1000;
    const expiringSoon = assignments.filter((a) => {
      if (a.status !== "ACTIVE" || !a.expiryDate) return false;
      const t = new Date(a.expiryDate).getTime();
      return t >= now && t <= in30Days;
    }).length;
    return { total, active, revoked, expiringSoon };
  }, [assignments]);

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
            Software & License Assignment
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            System Access & Accounts <span className="mx-1">›</span> Software & License Assignment
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Assign Software & License
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Assignments"
          value={kpis.total}
          icon={ShieldCheck}
          tone="primary"
          sublabel="All license assignments"
        />
        <StatCard
          label="Active Licenses"
          value={kpis.active}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Revoked Licenses" value={kpis.revoked} icon={Ban} tone="critical" sublabel="No longer in use" />
        <StatCard
          label="Expiring Soon"
          value={kpis.expiringSoon}
          icon={CalendarClock}
          tone="warning"
          sublabel="Within next 30 days"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email or software..."
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
              Filters{statusFilter !== "All" ? `: ${statusFilter === "ACTIVE" ? "Active" : "Revoked"}` : ""}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("All")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("REVOKED")}>Revoked</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLE */}
      {filteredAssignments.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ShieldCheck className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No software assigned yet</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Software</th>
                  <th className="px-4 py-3">Assigned On</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedAssignments.map((item, index) => (
                  <tr key={item._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[var(--foreground)]">{item.user?.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{item.user?.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{item.software}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(item.assignedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {item.expiryDate
                        ? new Date(item.expiryDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          item.status === "ACTIVE"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            item.status === "ACTIVE" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                          )}
                        />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end">
                        {item.status === "ACTIVE" ? (
                          <button
                            title="Revoke"
                            onClick={() => revokeLicense(item._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">—</span>
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
              total={filteredAssignments.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="assignments"
            />
          </div>
        </div>
      )}

      {/* MODAL */}
      {open && (
        <AssignSoftwareModal
          users={users}
          onClose={() => setOpen(false)}
          onSuccess={fetchAssignments}
        />
      )}
    </div>
  );
}

/* ---------------- MODAL ---------------- */
function AssignSoftwareModal({
  users,
  onClose,
  onSuccess,
}: {
  users: UserType[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    userId: "",
    software: "",
    licenseKey: "",
    expiryDate: "",
    remarks: "",
  });

  const handleAssign = async () => {
    try {
      await axios.post(`${API}/license/assign`, form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Assign failed", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] px-4">
      <div className="card-premium w-full max-w-lg p-6 shadow-premium-sm">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Assign Software & License</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--foreground)]">User</label>
            <select
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--foreground)]">Software Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
              placeholder="e.g. MS Office, Figma"
              onChange={(e) => setForm({ ...form, software: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--foreground)]">License Key</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
              placeholder="Optional"
              onChange={(e) => setForm({ ...form, licenseKey: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--foreground)]">Expiry Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--foreground)]">Remarks</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
              placeholder="Optional remarks"
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
