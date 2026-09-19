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
  Award,
  CheckCircle2,
  Layers,
  CalendarPlus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import DesignationModal from "./DesignationModal";
import DeleteDesignationModal from "./DeleteDesignationModal";
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

type StatusFilter = "All" | "Active" | "Inactive";

export default function Designation() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ✅ DELETE MODAL STATES
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    const res = await axios.get(`${API_BASE}/designations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await axios.delete(`${API_BASE}/designations/${itemToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        type: "success",
        title: "Designation Deleted",
        message: `${itemToDelete.name} successfully removed.`,
      });

      setOpenDeleteModal(false);
      setItemToDelete(null);
      fetchData();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        message: error?.response?.data?.message || "Something went wrong.",
      });
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      sortOrder === "asc"
        ? (a.name || "").localeCompare(b.name || "")
        : (b.name || "").localeCompare(a.name || "")
    );
  }, [data, sortOrder]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedData.filter((d) => {
      const matchesStatus = statusFilter === "All" || d.status === statusFilter;
      const matchesSearch =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.departmentId?.name?.toLowerCase().includes(q) ||
        d.companyId?.name?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [sortedData, search, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const kpis = useMemo(() => {
    const total = data.length;
    const active = data.filter((d) => d.status === "Active").length;
    const departments = new Set(data.map((d) => d.departmentId?._id).filter(Boolean)).size;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyAdded = data.filter(
      (d) => d.createdAt && new Date(d.createdAt).getTime() >= thirtyDaysAgo
    ).length;
    return { total, active, departments, recentlyAdded };
  }, [data]);

  const handleExport = () => {
    const sheet = XLSXUtils.json_to_sheet(
      filteredData.map((d) => ({
        Designation: d.name,
        Department: d.departmentId?.name || "-",
        Company: d.companyId?.name || "-",
        Status: d.status,
        "Created On": d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "-",
      }))
    );
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, sheet, "Designations");
    writeXlsx(wb, `Designations-${new Date().toISOString().split("T")[0]}.xlsx`);
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
            Designation
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            System Configuration <span className="mx-1">›</span> Designation
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
          Add Designation
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Designations" value={kpis.total} icon={Award} tone="primary" sublabel="All designations" />
        <StatCard
          label="Active Designations"
          value={kpis.active}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Departments Covered" value={kpis.departments} icon={Layers} tone="violet" sublabel="Distinct departments" />
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
            placeholder="Search designations by name, department or company..."
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
      {filteredData.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Award className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No designations match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th
                    className="cursor-pointer select-none px-4 py-3"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Designation
                      {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginatedData.map((d, i) => (
                  <tr key={d._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{d.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{d.departmentId?.name || "-"}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{d.companyId?.name || "-"}</td>
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
                          onClick={() => {
                            setItemToDelete(d);
                            setOpenDeleteModal(true);
                          }}
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
              total={filteredData.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="designations"
            />
          </div>
        </div>
      )}

      <DesignationModal
        isOpen={openModal}
        mode={mode}
        designation={selected}
        onClose={() => {
          setOpenModal(false);
          fetchData();
        }}
      />

      <DeleteDesignationModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        designationName={itemToDelete?.name}
      />
    </div>
  );
}
