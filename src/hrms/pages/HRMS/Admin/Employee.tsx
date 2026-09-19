/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MoreVertical,
  LayoutGrid,
  Rows3,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
  SlidersHorizontal,
  X,
  Search,
  Eye,
  Plus,
  Upload,
  UsersRound,
  UserCheck,
  UserX,
  Clock,
  ArrowUpDown,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

interface Employee {
  _id: string;
  name: string;
  role: string;
  status: string;
  avatar?: string;
  profilePicture?: string;
  // Extended fields for List View
  employeeId?: string;
  email?: string;
  mobile?: string;
  gender?: string;
  companyId?: { _id: string; name: string };
  branchId?: { _id: string; name: string };
  departmentId?: { _id: string; name: string };
  designationId?: { _id: string; name: string };
  managerId?: { _id: string; name: string };
  costCenterId?: { _id: string; name: string; code: string };
  joiningDate?: string;
  probationEndDate?: string;
  confirmationDate?: string;
  terminationDate?: string;
  employmentType?: string;
  employmentStatus?: string;
  documents?: { status: string }[];
}

interface EmployeeLeave {
  _id: string;
  employee?: { _id: string; name: string };
  status: string;
  fromDate: string;
  toDate: string;
  createdAt?: string;
}

interface DepartmentOption {
  _id: string;
  name: string;
}

type SortKey = "name-asc" | "name-desc" | "doj-desc" | "doj-asc";

const SORT_LABELS: Record<SortKey, string> = {
  "name-asc": "Name (A–Z)",
  "name-desc": "Name (Z–A)",
  "doj-desc": "Joining Date (Newest)",
  "doj-asc": "Joining Date (Oldest)",
};

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  return initials || "?";
}

export default function Employee() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<{ _id: string; name: string }[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("name-asc");

  // Real, unpaginated data powering the KPI row (genuinely fetched — no fabricated numbers)
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allLeaves, setAllLeaves] = useState<EmployeeLeave[]>([]);

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);

  // Consolidated filter states
  const [filters, setFilters] = useState({
    name: "",
    designation: "",
    company: "",
    branch: "",
    department: "",
    costCenter: "",
    manager: "",
    doj: "",
    probation: "",
    confirmation: "",
    termination: "",
    empType: "",
    contact: "",
    gender: "",
    status: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Status toggle & Delete modal states
  const [statusModal, setStatusModal] = useState<{ open: boolean; emp: Employee | null }>({
    open: false,
    emp: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; emp: Employee | null }>({
    open: false,
    emp: null,
  });
  const [contactModal, setContactModal] = useState<{ emp: Employee } | null>(null);
  const [copied, setCopied] = useState(false);

  // 🔑 URL state
  const page = Number(searchParams.get("page")) || 1;

  const companyFilter = searchParams.get("companyId") || "";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  // Seed the name filter from a "q" query param (used by the global header search)
  useEffect(() => {
    const initialQuery = searchParams.get("q");
    if (initialQuery) {
      setFilters((prev) => ({ ...prev, name: initialQuery }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentCompany = searchParams.get("companyId") || "";
    if (companyFilter !== currentCompany) {
      setSearchParams({
        page: "1",
        companyId: companyFilter
      });
    }
  }, [companyFilter]);



  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      // Build query params from filters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        companyId: companyFilter,
        search: debouncedFilters.name,
        designation: debouncedFilters.designation,
        company: debouncedFilters.company,
        branch: debouncedFilters.branch,
        department: debouncedFilters.department,
        costCenter: debouncedFilters.costCenter,
        manager: debouncedFilters.manager,
        joiningDate: debouncedFilters.doj,
        probationEndDate: debouncedFilters.probation,
        confirmationDate: debouncedFilters.confirmation,
        terminationDate: debouncedFilters.termination,
        employmentType: debouncedFilters.empType,
        contact: debouncedFilters.contact,
        gender: debouncedFilters.gender,
        employmentStatus: debouncedFilters.status,
      });

      // Remove empty values
      for (const [key, value] of Array.from(params.entries())) {
        if (!value) params.delete(key);
      }

      const res = await axios.get(`${API_BASE}/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEmployees(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setTotalUsers(res.data.totalUsers || 0);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch employees", err);
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data);
    } catch (err) {
      console.error("Failed to fetch companies", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  // KPI + sparkline data — mirrors AdminDashboard.tsx's exact fetch patterns:
  // an unpaginated /users call and the /employee/leaves/all call.
  const fetchKpiData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, leavesRes] = await Promise.all([
        axios.get(`${API_BASE}/users`, { headers }),
        axios.get(`${API_BASE}/employee/leaves/all`, { headers }),
      ]);
      setAllEmployees(usersRes.data || []);
      setAllLeaves(leavesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch KPI data", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, debouncedFilters, companyFilter]);

  useEffect(() => {
    fetchCompanies();
    fetchDepartments();
    fetchKpiData();
  }, []);

  const handlePageChange = (p: number) => {
    setSearchParams({ page: p.toString(), companyId: companyFilter });
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.emp) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/users/${deleteModal.emp._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteModal({ open: false, emp: null });
      fetchEmployees();
      fetchKpiData();
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  const handleStatusToggle = async () => {
    if (!statusModal.emp) return;
    try {
      const token = localStorage.getItem("token");
      const newStatus = statusModal.emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await axios.patch(
        `${API_BASE}/users/${statusModal.emp._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusModal({ open: false, emp: null });
      fetchEmployees();
      fetchKpiData();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const getPaginationPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const current = page;
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const getDocCounts = (emp: any) => {
    return {
      uploaded: emp.documentCounts?.uploaded || 0,
      approved: emp.documentCounts?.verified || 0,
    };
  };

  // Clear all column filters
  const clearAllFilters = () => {
    setFilters({
      name: "",
      designation: "",
      company: "",
      branch: "",
      department: "",
      costCenter: "",
      manager: "",
      doj: "",
      probation: "",
      confirmation: "",
      termination: "",
      empType: "",
      contact: "",
      gender: "",
      status: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  // Client-side sort of the CURRENT page only — does not touch the
  // server-side pagination/filtering logic above.
  const sortedEmployees = useMemo(() => {
    const arr = [...employees];
    switch (sortBy) {
      case "name-asc":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "doj-desc":
        arr.sort(
          (a, b) => new Date(b.joiningDate || 0).getTime() - new Date(a.joiningDate || 0).getTime()
        );
        break;
      case "doj-asc":
        arr.sort(
          (a, b) => new Date(a.joiningDate || 0).getTime() - new Date(b.joiningDate || 0).getTime()
        );
        break;
    }
    return arr;
  }, [employees, sortBy]);

  /* ================= KPI + SPARKLINE DERIVATIONS (real data only) ================= */

  // Keep KPIs in sync with the Company filter already applied to the list.
  const kpiEmployees = useMemo(() => {
    if (!companyFilter) return allEmployees;
    return allEmployees.filter((e) => e.companyId?._id === companyFilter);
  }, [allEmployees, companyFilter]);

  const kpiIds = useMemo(() => new Set(kpiEmployees.map((e) => e._id)), [kpiEmployees]);

  const totalCount = kpiEmployees.length;
  const activeCount = useMemo(() => kpiEmployees.filter((e) => e.status === "ACTIVE").length, [kpiEmployees]);
  const inactiveCount = useMemo(() => kpiEmployees.filter((e) => e.status === "INACTIVE").length, [kpiEmployees]);

  // 6-point trend window: end of each of the last 5 months, then today — wider
  // than a 7-day window so genuine month-to-month movement (joins, status
  // changes) has a real chance to show up instead of a flat "no change" line.
  const trendDateStrs = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      if (i === 5) return toDateStr(now);
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0);
      return toDateStr(d);
    });
  }, []);

  // Real cumulative headcount at each trend point, from actual joining dates
  const totalSparkline = useMemo(
    () =>
      trendDateStrs.map(
        (dateStr) => kpiEmployees.filter((e) => !e.joiningDate || e.joiningDate.split("T")[0] <= dateStr).length
      ),
    [kpiEmployees, trendDateStrs]
  );

  const activeSparkline = useMemo(
    () =>
      trendDateStrs.map(
        (dateStr) =>
          kpiEmployees.filter(
            (e) => e.status === "ACTIVE" && (!e.joiningDate || e.joiningDate.split("T")[0] <= dateStr)
          ).length
      ),
    [kpiEmployees, trendDateStrs]
  );

  const inactiveSparkline = useMemo(
    () =>
      trendDateStrs.map(
        (dateStr) =>
          kpiEmployees.filter(
            (e) => e.status === "INACTIVE" && (!e.joiningDate || e.joiningDate.split("T")[0] <= dateStr)
          ).length
      ),
    [kpiEmployees, trendDateStrs]
  );

  // Real count of employees on an approved leave that covers each trend point
  const onLeaveSparkline = useMemo(
    () =>
      trendDateStrs.map(
        (dateStr) =>
          allLeaves.filter((lv) => {
            if (lv.status !== "APPROVED") return false;
            if (lv.employee && !kpiIds.has(lv.employee._id)) return false;
            const from = lv.fromDate?.split("T")[0];
            const to = lv.toDate?.split("T")[0];
            return !!from && !!to && from <= dateStr && to >= dateStr;
          }).length
      ),
    [allLeaves, kpiIds, trendDateStrs]
  );

  // "On Leave" KPI = today's value from the real, date-range-derived sparkline above
  const onLeaveCount = onLeaveSparkline[onLeaveSparkline.length - 1] ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">Employee</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Dashboard <span className="mx-1">›</span> Employee
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/hrms/SuperAdmin/addUser")}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={() => navigate("/hrms/SuperAdmin/addUser")}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* KPI ROW — real data only: unpaginated /users + /employee/leaves/all */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Employees"
          value={totalCount}
          icon={UsersRound}
          tone="primary"
          sparklineData={totalSparkline}
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon={UserCheck}
          tone="good"
          sublabel={`${totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% of total`}
          sparklineData={activeSparkline}
        />
        <StatCard
          label="Inactive"
          value={inactiveCount}
          icon={UserX}
          tone="critical"
          sparklineData={inactiveSparkline}
        />
        <StatCard
          label="On Leave"
          value={onLeaveCount}
          icon={Clock}
          tone="warning"
          sublabel="Approved leave covering today"
          sparklineData={onLeaveSparkline}
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          {viewMode === "grid" && (
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Search Employee..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Company Filter */}
          <div className="relative min-w-[180px]">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <select
              value={companyFilter}
              onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), companyId: e.target.value, page: "1" })}
              className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="">All Companies</option>
              {companies.map(comp => (
                <option key={comp._id} value={comp._id}>{comp.name}</option>
              ))}
            </select>
          </div>

          {/* Sort — client-side sort of the current page only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuItem key={key} onClick={() => setSortBy(key)}>
                  {SORT_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Button - only show in list mode */}
          {viewMode === "list" && (
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors",
                showFilters || hasActiveFilters
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
              title="Toggle Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold leading-none text-[var(--primary)]">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid view"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-[var(--muted)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List view"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-[var(--muted)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Big Inline Filter Panel ── */}
      {viewMode === "list" && showFilters && (
        <div className="card-premium shadow-premium-sm p-5">
          {/* Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Employee Name / ID</p>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Name or ID"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Designation</p>
              <input
                type="text"
                value={filters.designation}
                onChange={(e) => setFilters(prev => ({ ...prev, designation: e.target.value }))}
                placeholder="Designation"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Company</p>
              <input
                type="text"
                value={filters.company}
                onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Company"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Branch</p>
              <input
                type="text"
                value={filters.branch}
                onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                placeholder="Branch"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Department</p>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Cost Center</p>
              <input
                type="text"
                value={filters.costCenter}
                onChange={(e) => setFilters(prev => ({ ...prev, costCenter: e.target.value }))}
                placeholder="Cost Center"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Reporting Manager</p>
              <input
                type="text"
                value={filters.manager}
                onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}
                placeholder="Manager"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">DOJ</p>
              <input
                type="text"
                value={filters.doj}
                onChange={(e) => setFilters(prev => ({ ...prev, doj: e.target.value }))}
                placeholder="e.g. 01/2024"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Probation Ends</p>
              <input
                type="text"
                value={filters.probation}
                onChange={(e) => setFilters(prev => ({ ...prev, probation: e.target.value }))}
                placeholder="e.g. 06/2024"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Confirmation Date</p>
              <input
                type="text"
                value={filters.confirmation}
                onChange={(e) => setFilters(prev => ({ ...prev, confirmation: e.target.value }))}
                placeholder="e.g. 09/2024"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Termination / Resigned Date</p>
              <input
                type="text"
                value={filters.termination}
                onChange={(e) => setFilters(prev => ({ ...prev, termination: e.target.value }))}
                placeholder="e.g. 12/2024"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Employment Type</p>
              <input
                type="text"
                value={filters.empType}
                onChange={(e) => setFilters(prev => ({ ...prev, empType: e.target.value }))}
                placeholder="e.g. Full Time"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Contact (Email / Phone)</p>
              <input
                type="text"
                value={filters.contact}
                onChange={(e) => setFilters(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="Email or Phone"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Gender</p>
              <select
                value={filters.gender}
                onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] cursor-pointer"
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--foreground)] mb-1">Status</p>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROBATION">Probation</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--muted-foreground)]">
              Showing <span className="font-semibold text-[var(--foreground)]">{employees.length}</span> of <span className="font-semibold text-[var(--foreground)]">{totalUsers}</span> employees
            </span>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--status-critical)] border border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)] hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] px-3 py-1.5 rounded-lg transition-colors"
            >
              <X size={12} /> Clear All
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div>
          <Loader />
        </div>
      )}

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {sortedEmployees.map((emp) => (
            <div key={emp._id} className="card-premium card-hover shadow-premium-sm p-4">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    emp.status === "ACTIVE"
                      ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                      : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      emp.status === "ACTIVE" ? "bg-[var(--status-good)]" : "bg-[var(--status-critical)]"
                    )}
                  />
                  {emp.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/hrms/SuperAdmin/employees/profile/${emp._id}`)}>
                      <Eye className="mr-2 h-3.5 w-3.5" /> View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusModal({ open: true, emp })}
                      className={emp.status === "ACTIVE" ? "text-[var(--status-critical)]" : "text-[var(--status-good)]"}
                    >
                      {emp.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteModal({ open: true, emp })}
                      className="text-[var(--status-critical)]"
                    >
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {emp.profilePicture || emp.avatar ? (
                  <img
                    src={emp.profilePicture
                      ? (emp.profilePicture.startsWith('http') ? emp.profilePicture : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${emp.profilePicture}`)
                      : emp.avatar
                    }
                    alt={emp.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]">
                    <span className="text-sm font-semibold text-[var(--primary)]">{getInitials(emp.name)}</span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[var(--foreground)] font-semibold text-base" title={emp.name}>
                    {emp.name}
                  </h3>
                  <p className="truncate text-[var(--primary)] text-xs mt-0.5">{emp.role}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-[var(--muted-foreground)]">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{emp.departmentId?.name || emp.companyId?.name || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{emp.email || "—"}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3">
                <span
                  title={emp.mobile || "No mobile number"}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium",
                    emp.mobile ? "text-[var(--muted-foreground)]" : "text-[var(--muted-foreground)]/40"
                  )}
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{emp.mobile || "—"}</span>
                </span>
                <button
                  disabled={!emp.email}
                  title={emp.email || "No email address"}
                  onClick={() => setContactModal({ emp })}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
                    emp.email
                      ? "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                      : "cursor-not-allowed text-[var(--muted-foreground)]/40"
                  )}
                >
                  <Mail className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {sortedEmployees.length === 0 && !loading && (
            <div className="col-span-full card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
              <Users className="h-8 w-8 text-[var(--muted-foreground)]" />
              <p className="text-sm text-[var(--muted-foreground)]">No employees match the current filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 px-4 py-3 bg-[color-mix(in_oklab,var(--primary)_6%,transparent)] border-b border-[var(--border)]">
              {filters.name && <FilterTag label="Name/ID" value={filters.name} onClear={() => setFilters(prev => ({ ...prev, name: "" }))} />}
              {filters.designation && <FilterTag label="Designation" value={filters.designation} onClear={() => setFilters(prev => ({ ...prev, designation: "" }))} />}
              {filters.company && <FilterTag label="Company" value={filters.company} onClear={() => setFilters(prev => ({ ...prev, company: "" }))} />}
              {filters.branch && <FilterTag label="Branch" value={filters.branch} onClear={() => setFilters(prev => ({ ...prev, branch: "" }))} />}
              {filters.department && <FilterTag label="Department" value={filters.department} onClear={() => setFilters(prev => ({ ...prev, department: "" }))} />}
              {filters.costCenter && <FilterTag label="Cost Center" value={filters.costCenter} onClear={() => setFilters(prev => ({ ...prev, costCenter: "" }))} />}
              {filters.manager && <FilterTag label="Manager" value={filters.manager} onClear={() => setFilters(prev => ({ ...prev, manager: "" }))} />}
              {filters.doj && <FilterTag label="DOJ" value={filters.doj} onClear={() => setFilters(prev => ({ ...prev, doj: "" }))} />}
              {filters.probation && <FilterTag label="Probation" value={filters.probation} onClear={() => setFilters(prev => ({ ...prev, probation: "" }))} />}
              {filters.confirmation && <FilterTag label="Confirmation" value={filters.confirmation} onClear={() => setFilters(prev => ({ ...prev, confirmation: "" }))} />}
              {filters.termination && <FilterTag label="Termination" value={filters.termination} onClear={() => setFilters(prev => ({ ...prev, termination: "" }))} />}
              {filters.empType && <FilterTag label="Emp. Type" value={filters.empType} onClear={() => setFilters(prev => ({ ...prev, empType: "" }))} />}
              {filters.contact && <FilterTag label="Contact" value={filters.contact} onClear={() => setFilters(prev => ({ ...prev, contact: "" }))} />}
              {filters.gender && <FilterTag label="Gender" value={filters.gender} onClear={() => setFilters(prev => ({ ...prev, gender: "" }))} />}
              {filters.status && <FilterTag label="Status" value={filters.status} onClear={() => setFilters(prev => ({ ...prev, status: "" }))} />}
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-[var(--status-critical)] font-semibold px-2 py-1 rounded-full border border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)] hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] transition-colors"
              >
                <X size={10} /> Clear All
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1600px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="p-4">Employee Name</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Company</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Cost Center</th>
                  <th className="p-4">Reporting Manager</th>
                  <th className="p-4">DOJ</th>
                  <th className="p-4">Probation Ends</th>
                  <th className="p-4">Confirmation Date</th>
                  <th className="p-4 text-[var(--status-critical)]">Termination / Resigned Date</th>
                  <th className="p-4">Employment Type</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Docs</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedEmployees.map((emp) => {
                  const docs = getDocCounts(emp);
                  return (
                    <tr key={emp._id} className="hover:bg-[var(--muted)] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {emp.profilePicture || emp.avatar ? (
                            <img
                              src={emp.profilePicture
                                ? (emp.profilePicture.startsWith('http') ? emp.profilePicture : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${emp.profilePicture}`)
                                : emp.avatar
                              }
                              alt={emp.name}
                              className="w-10 h-10 rounded-full object-cover border border-[var(--border)]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--muted)] flex items-center justify-center">
                              <User size={18} className="text-[var(--muted-foreground)]" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[var(--foreground)]">{emp.name}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{emp.employeeId || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[var(--muted-foreground)]">{emp.designationId?.name || "—"}</td>
                      <td className="p-4 text-[var(--muted-foreground)]">{emp.companyId?.name || "—"}</td>
                      <td className="p-4 text-[var(--muted-foreground)]">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[var(--muted-foreground)]" />
                          {emp.branchId?.name || "—"}
                        </div>
                      </td>
                      <td className="p-4 text-[var(--muted-foreground)]">{emp.departmentId?.name || "—"}</td>
                      <td className="p-4 text-[var(--muted-foreground)]">
                        {emp.costCenterId ? (
                          <div className="text-xs">
                            <div className="font-medium text-[var(--foreground)]">{emp.costCenterId.name}</div>
                            <div className="text-[10px] text-[var(--muted-foreground)]">{emp.costCenterId.code}</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="p-4 text-[var(--muted-foreground)]">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-[var(--muted-foreground)]" />
                          {emp.managerId?.name || "—"}
                        </div>
                      </td>
                      <td className="p-4 text-[var(--muted-foreground)]">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "—"}</td>
                      <td className="p-4 text-[var(--muted-foreground)]">{emp.probationEndDate ? new Date(emp.probationEndDate).toLocaleDateString() : "—"}</td>
                      <td className="p-4 text-[var(--muted-foreground)]">{emp.confirmationDate ? new Date(emp.confirmationDate).toLocaleDateString() : "—"}</td>
                      <td className="p-4">
                        {emp.terminationDate ? (
                          <span className="text-[var(--status-critical)] font-medium">{new Date(emp.terminationDate).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                      <td className="p-4 text-[var(--muted-foreground)]">{emp.employmentType || "—"}</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                            <Mail size={12} className="text-[var(--muted-foreground)]" /> {emp.email || "—"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                            <Phone size={12} className="text-[var(--muted-foreground)]" /> {emp.mobile || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[var(--muted-foreground)]">{emp.gender || "—"}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                            emp.employmentStatus === "CONFIRMED"
                              ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                              : emp.employmentStatus === "TERMINATED"
                                ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                                : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                          )}
                        >
                          {emp.employmentStatus || "PROBATION"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-bold text-nowrap">Uploaded: {docs.uploaded}/4</div>
                          <div className={cn("text-[10px] uppercase font-bold text-nowrap", docs.approved === 4 ? "text-[var(--status-good)]" : "text-[var(--status-warning)]")}>
                            Approved: {docs.approved}/4
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => navigate(`/hrms/SuperAdmin/employees/profile/${emp._id}`)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                            title="View Profile"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedEmployees.length === 0 && (
                  <tr>
                    <td colSpan={17} className="p-8 text-center text-[var(--muted-foreground)] text-sm">
                      No employees match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalUsers > 15 && totalPages > 1 && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2 card-premium shadow-premium-sm px-4 py-3">
            {getPaginationPages().map((p, index) =>
              p === "..." ? (
                <span key={index} className="px-3 py-2 text-[var(--muted-foreground)] text-sm">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p as number)}
                  className={cn(
                    "min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all duration-200",
                    page === p
                      ? "bg-[var(--primary)] text-white shadow-premium-sm"
                      : "bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)] hover:bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
                  )}
                >
                  {p}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Status Toggle Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="card-premium shadow-premium-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-2 text-[var(--foreground)]">
              {statusModal.emp?.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Are you sure you want to {statusModal.emp?.status === "ACTIVE" ? "deactivate" : "activate"}{" "}
              <span className="font-semibold text-[var(--foreground)]">{statusModal.emp?.name}</span>'s account?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStatusModal({ open: false, emp: null })}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-md text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusToggle}
                className={cn(
                  "px-4 py-2 text-sm text-white rounded-md shadow-premium-sm transition-all active:scale-95",
                  statusModal.emp?.status === "ACTIVE"
                    ? "bg-[var(--status-critical)] hover:opacity-90"
                    : "bg-[var(--status-good)] hover:opacity-90"
                )}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="card-premium shadow-premium-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-2 text-[var(--status-critical)]">Delete User Account</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete <span className="font-semibold text-[var(--foreground)]">{deleteModal.emp?.name}</span>? This action is permanent.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, emp: null })}
                className="px-4 py-2 text-sm border border-[var(--border)] rounded-md text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-[var(--status-critical)] rounded-md shadow-premium-sm hover:opacity-90 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call / Message Contact Modal */}
      {contactModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]"
          onClick={() => setContactModal(null)}
        >
          <div
            className="card-premium shadow-premium-lg p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {contactModal.emp.profilePicture || contactModal.emp.avatar ? (
                  <img
                    src={contactModal.emp.profilePicture
                      ? (contactModal.emp.profilePicture.startsWith('http') ? contactModal.emp.profilePicture : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${contactModal.emp.profilePicture}`)
                      : contactModal.emp.avatar
                    }
                    alt={contactModal.emp.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]">
                    <span className="text-xs font-semibold text-[var(--primary)]">{getInitials(contactModal.emp.name)}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{contactModal.emp.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{contactModal.emp.role}</p>
                </div>
              </div>
              <button
                onClick={() => setContactModal(null)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-1.5">
              Email Address
            </p>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3.5 py-3 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {contactModal.emp.email}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(contactModal.emp.email || "")}
                title="Copy"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] hover:text-[var(--primary)]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[var(--status-good)]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <button
              onClick={() => setContactModal(null)}
              className="w-full px-4 py-2 text-sm border border-[var(--border)] rounded-md text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Filter Tag Component
function FilterTag({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)] text-xs font-semibold px-2.5 py-1 rounded-full">
      <span className="opacity-70">{label}:</span> {value}
      <button onClick={onClear} className="ml-1 hover:opacity-70 transition-opacity">
        <X size={10} />
      </button>
    </span>
  );
}
