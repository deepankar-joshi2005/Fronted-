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
  Building2,
  CheckCircle2,
  Briefcase,
  CalendarPlus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import CompanyModal from "./CompanyModal";
import DeleteCompanyModal from "./DeleteCompanyModel";
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
  companyId: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

type StatusFilter = "All" | "Active" | "Inactive";

export default function Company() {
  const token = localStorage.getItem("token");

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [mode, setMode] = useState<"add" | "view" | "edit">("add");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  // ✅ ACTUAL DELETE API
  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    try {
      await axios.delete(`${API_BASE}/companies/${companyToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        type: "success",
        title: "Company Deleted",
        message: `${companyToDelete.name} successfully removed`,
      });

      setOpenDeleteModal(false);
      setCompanyToDelete(null);
      fetchCompanies();
    } catch (error) {
      toast({
        type: "error",
        title: "Delete Failed",
        message: "Company deleted Sucessfully",
      });
    }
  };

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) =>
      sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
  }, [companies, sortOrder]);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedCompanies.filter((c) => {
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.companyId?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [sortedCompanies, search, statusFilter]);

  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, page, pageSize]);

  const kpis = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === "Active").length;
    const industries = new Set(companies.map((c) => c.industry).filter(Boolean)).size;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyAdded = companies.filter(
      (c) => new Date(c.createdAt).getTime() >= thirtyDaysAgo
    ).length;
    return { total, active, industries, recentlyAdded };
  }, [companies]);

  const handleExport = () => {
    const sheet = XLSXUtils.json_to_sheet(
      filteredCompanies.map((c) => ({
        "Company ID": c.companyId,
        Company: c.name,
        Email: c.email,
        Phone: c.phone,
        Industry: c.industry,
        City: c.city,
        State: c.state,
        Status: c.status,
        "Created On": new Date(c.createdAt).toLocaleDateString(),
      }))
    );
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, sheet, "Companies");
    writeXlsx(wb, `Companies-${new Date().toISOString().split("T")[0]}.xlsx`);
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
            Companies
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            System Configuration <span className="mx-1">›</span> Company
          </p>
        </div>

        <button
          onClick={() => {
            setMode("add");
            setSelectedCompany(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Companies" value={kpis.total} icon={Building2} tone="primary" sublabel="All companies" />
        <StatCard
          label="Active Companies"
          value={kpis.active}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.active / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard label="Industries" value={kpis.industries} icon={Briefcase} tone="violet" sublabel="Distinct industries" />
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
            placeholder="Search companies by name, email, industry or city..."
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
      {filteredCompanies.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Building2 className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No companies match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Company ID</th>
                  <th
                    className="cursor-pointer select-none px-4 py-3"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Company Name
                      {sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created On</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedCompanies.map((company, i) => (
                  <tr key={company._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
                        {company.companyId}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{company.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{company.email}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{company.phone}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{company.industry}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{company.city}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{company.state}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          company.status === "Active"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            company.status === "Active" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                          )}
                        />
                        {company.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(company.createdAt).toLocaleDateString("en-IN", {
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
                            setSelectedCompany(company);
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
                            setSelectedCompany(company);
                            setOpenModal(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => {
                            setCompanyToDelete(company);
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
              total={filteredCompanies.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="companies"
            />
          </div>
        </div>
      )}

      {/* ADD / VIEW / EDIT MODAL */}
      <CompanyModal
        isOpen={openModal}
        mode={mode}
        company={selectedCompany}
        onClose={() => {
          setOpenModal(false);
          fetchCompanies();
        }}
      />

      {/* DELETE CONFIRM MODAL */}
      <DeleteCompanyModal
        isOpen={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setCompanyToDelete(null);
        }}
        onConfirm={handleDeleteCompany}
        companyName={companyToDelete?.name}
      />
    </div>
  );
}
