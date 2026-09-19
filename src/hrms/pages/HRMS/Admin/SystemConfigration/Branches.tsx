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
  LayoutGrid,
  Rows3,
  Plus,
  Building2,
  CheckCircle2,
  Landmark,
  CalendarPlus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import BranchModal from "./BranchModal";
import DeleteBranchModal from "./DeleteBranchModal";
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

export interface Company {
  _id: string;
  name: string;
}

export interface Branch {
  _id: string;
  companyId: string | { _id: string; name: string };
  companyName?: string;
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  address: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

type StatusFilter = "All" | "Active" | "Inactive";

export default function Branch() {
  const token = localStorage.getItem("token");

  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCompanies = async () => {
    const res = await axios.get(`${API_BASE}/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCompanies(res.data);
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_BASE}/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchBranches();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;

    try {
      await axios.delete(`${API_BASE}/branches/${branchToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        type: "success",
        title: "Branch Deleted",
        message: `${branchToDelete.name} successfully removed.`,
      });

      setOpenDeleteModal(false);
      setBranchToDelete(null);
      fetchBranches();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        message: error?.response?.data?.message || "Something went wrong.",
      });
    }
  };

  const getCompanyName = (companyId: any) => {
    if (typeof companyId === "object" && companyId?.name) return companyId.name;
    const id = typeof companyId === "string" ? companyId : companyId?._id;
    const company = companies.find((c) => c._id === id);
    return company ? company.name : "-";
  };

  const sortedBranches = useMemo(() => {
    return [...branches].sort((a, b) => {
      const nameA = getCompanyName(a.companyId).toLowerCase();
      const nameB = getCompanyName(b.companyId).toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
  }, [branches, companies, sortOrder]);

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedBranches.filter((b) => {
      const matchesStatus = statusFilter === "All" || b.status === statusFilter;
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        getCompanyName(b.companyId).toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    });
  }, [sortedBranches, search, statusFilter, companies]);

  const paginatedBranches = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBranches.slice(start, start + pageSize);
  }, [filteredBranches, page, pageSize]);

  const kpis = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.status === "Active").length;
    const cities = new Set(branches.map((b) => b.city).filter(Boolean)).size;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyAdded = branches.filter((b) => new Date(b.createdAt).getTime() >= thirtyDaysAgo).length;
    return { total, active, cities, recentlyAdded };
  }, [branches]);

  const handleExport = () => {
    const sheet = XLSXUtils.json_to_sheet(
      filteredBranches.map((b) => ({
        Company: getCompanyName(b.companyId),
        Branch: b.name,
        Code: b.code,
        City: b.city,
        State: b.state,
        Status: b.status,
        "Created On": new Date(b.createdAt).toLocaleDateString(),
      }))
    );
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, sheet, "Branches");
    writeXlsx(wb, `Branches-${new Date().toISOString().split("T")[0]}.xlsx`);
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
            Branches
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            System Configuration <span className="mx-1">›</span> Branches
          </p>
        </div>

        <button
          onClick={() => {
            setMode("add");
            setSelectedBranch(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Branch
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Branches" value={kpis.total} icon={Building2} tone="primary" sublabel="Active branches" />
        <StatCard
          label="Active Branches"
          value={kpis.active}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Total Cities" value={kpis.cities} icon={Landmark} tone="violet" sublabel="Across all branches" />
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
            placeholder="Search branches by name, code or city..."
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

          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                viewMode === "table"
                  ? "bg-[var(--muted)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Rows3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              title="Grid view"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--muted)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {filteredBranches.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Building2 className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No branches match your search</p>
        </div>
      ) : viewMode === "table" ? (
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
                      Company Name
                      {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </th>
                  <th className="px-4 py-3">Branch Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedBranches.map((branch, i) => (
                  <tr key={branch._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">
                      {getCompanyName(branch.companyId)}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{branch.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
                        {branch.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{branch.city}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{branch.state}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          branch.status === "Active"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            branch.status === "Active" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                          )}
                        />
                        {branch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(branch.createdAt).toLocaleDateString("en-IN", {
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
                            setSelectedBranch(branch);
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
                            setSelectedBranch(branch);
                            setOpenModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => {
                            setBranchToDelete(branch);
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
              total={filteredBranches.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="branches"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {paginatedBranches.map((branch) => (
              <div key={branch._id} className="card-premium card-hover shadow-premium-sm p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">{getCompanyName(branch.companyId)}</p>
                    <h3 className="mt-0.5 text-base font-semibold text-[var(--foreground)]">{branch.name}</h3>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      branch.status === "Active"
                        ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                        : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        branch.status === "Active" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                      )}
                    />
                    {branch.status}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-[var(--muted-foreground)]">
                  <p>
                    Code: <span className="font-medium text-[var(--foreground)]">{branch.code}</span>
                  </p>
                  <p>
                    Location:{" "}
                    <span className="font-medium text-[var(--foreground)]">
                      {branch.city}, {branch.state}
                    </span>
                  </p>
                  <p>
                    Created:{" "}
                    {new Date(branch.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3">
                  <button
                    onClick={() => {
                      setMode("view");
                      setSelectedBranch(branch);
                      setOpenModal(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => {
                      setMode("edit");
                      setSelectedBranch(branch);
                      setOpenModal(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setBranchToDelete(branch);
                      setOpenDeleteModal(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)] hover:text-[var(--status-critical)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filteredBranches.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="branches"
          />
        </>
      )}

      <BranchModal
        isOpen={openModal}
        mode={mode}
        branch={selectedBranch}
        onClose={() => {
          setOpenModal(false);
          fetchBranches();
        }}
      />

      <DeleteBranchModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setBranchToDelete(null);
        }}
        onConfirm={handleDeleteBranch}
        branchName={branchToDelete?.name}
      />
    </div>
  );
}
