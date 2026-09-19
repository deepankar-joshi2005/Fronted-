/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { utils as XLSXUtils, writeFile as writeXlsx } from "xlsx";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  Layers,
  CheckCircle2,
  GitBranch,
  CalendarPlus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import DepartmentModal from "./DepartmentModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
const API_BASE = import.meta.env.VITE_API_URL;

export interface Department {
  _id: string;
  name: string;
  companyId: { _id: string; name: string };
  branchId: { _id: string; name: string };
  headEmployeeId?: { _id: string; name: string };
  status: "Active" | "Inactive";
  createdAt: string;
}

type StatusFilter = "All" | "Active" | "Inactive";

export default function DepartmentPage() {
  const token = localStorage.getItem("token");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [selected, setSelected] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchDepartments = async () => {
    const res = await axios.get(`${API_BASE}/departments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDepartments(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const deleteDepartment = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    await axios.delete(`${API_BASE}/departments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast({
      type: "success",
      title: "Department Deleted",
      message: "The branch has been deleted successfully.",
    });
    fetchDepartments();
  };

  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) =>
      sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [departments, sortOrder]);

  const filteredDepartments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedDepartments.filter((d) => {
      const matchesStatus = statusFilter === "All" || d.status === statusFilter;
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.companyId?.name?.toLowerCase().includes(q) ||
        d.branchId?.name?.toLowerCase().includes(q) ||
        d.headEmployeeId?.name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [sortedDepartments, search, statusFilter]);

  const paginatedDepartments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDepartments.slice(start, start + pageSize);
  }, [filteredDepartments, page, pageSize]);

  const kpis = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.status === "Active").length;
    const branches = new Set(departments.map((d) => d.branchId?._id).filter(Boolean)).size;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyAdded = departments.filter(
      (d) => new Date(d.createdAt).getTime() >= thirtyDaysAgo
    ).length;
    return { total, active, branches, recentlyAdded };
  }, [departments]);

  const handleExport = () => {
    const sheet = XLSXUtils.json_to_sheet(
      filteredDepartments.map((d) => ({
        Department: d.name,
        Company: d.companyId?.name || "-",
        Branch: d.branchId?.name || "-",
        Head: d.headEmployeeId?.name || "-",
        Status: d.status,
        "Created On": new Date(d.createdAt).toLocaleDateString(),
      }))
    );
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, sheet, "Departments");
    writeXlsx(wb, `Departments-${new Date().toISOString().split("T")[0]}.xlsx`);
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
            Departments
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            System Configuration <span className="mx-1">›</span> Department
          </p>
        </div>

        <button
          onClick={() => {
            setMode("add");
            setSelected(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Departments" value={kpis.total} icon={Layers} tone="primary" sublabel="All departments" />
        <StatCard
          label="Active Departments"
          value={kpis.active}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Branches Covered" value={kpis.branches} icon={GitBranch} tone="violet" sublabel="Distinct branches" />
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
            placeholder="Search departments by name, company, branch or head..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]",
                  statusFilter !== "All" && "border-[var(--primary)] text-[var(--primary)]"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters{statusFilter !== "All" ? `: ${statusFilter}` : ""}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["All", "Active", "Inactive"] as StatusFilter[]).map((s) => (
                <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
      {filteredDepartments.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Layers className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No departments match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th
                    className="cursor-pointer select-none px-4 py-3"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Department
                      {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Head</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedDepartments.map((d, i) => (
                  <tr key={d._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{d.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{d.companyId?.name || "-"}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{d.branchId?.name || "-"}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{d.headEmployeeId?.name || "-"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          d.status === "Active"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            d.status === "Active" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                          )}
                        />
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(d.createdAt).toLocaleDateString("en-IN", {
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
                            setSelected(d);
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
                            setSelected(d);
                            setOpenModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => deleteDepartment(d._id)}
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
              total={filteredDepartments.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="departments"
            />
          </div>
        </div>
      )}

      <DepartmentModal
        isOpen={openModal}
        mode={mode}
        department={selected}
        onClose={() => {
          setOpenModal(false);
          fetchDepartments();
        }}
      />
    </div>
  );
}
