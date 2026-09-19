/** @format */

import { useEffect, useState } from "react";
import axios from "axios";
import { Users, CheckCircle2, XCircle, Building2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

interface CommonRef {
  _id: string;
  name: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  employmentType?: string;
  employmentStatus?: string;
  profilePicture?: string | null;
  departmentId?: CommonRef;
  designationId?: CommonRef;
  managerId?: CommonRef;
}

const API_BASE = import.meta.env.VITE_API_URL;

export default function AutiorEmployee() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH EMPLOYEES ================= */
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params: any = { page };
      if (search.trim()) params.search = debouncedSearch;

      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // ✅ SAFELY HANDLE BOTH CASES
      if (Array.isArray(res.data?.data)) {
        setEmployees(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        setEmployees(res.data);
        setTotalPages(1);
      } else {
        setEmployees([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // new search → page reset
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  /* ================= INITIALS ================= */
  const getInitials = (name: string) => {
    const words = name.split(" ");
    return words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0][0];
  };

  /* ================= KPI SUMMARY (current page) ================= */
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const inactiveCount = employees.length - activeCount;
  const departmentCount = new Set(
    employees.map((e) => e.departmentId?.name).filter(Boolean)
  ).size;

  if (loading) return <Loader />;

  /* ================= UI ================= */
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Employee Records
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Auditor <span className="mx-1">›</span> Employee Records
          </p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Employees Shown"
          value={employees.length}
          icon={Users}
          tone="primary"
          sublabel={`Page ${page} of ${totalPages}`}
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${employees.length > 0 ? Math.round((activeCount / employees.length) * 100) : 0}% of shown`}
        />
        <StatCard label="Inactive" value={inactiveCount} icon={XCircle} tone="critical" sublabel="On this page" />
        <StatCard
          label="Departments"
          value={departmentCount}
          icon={Building2}
          tone="violet"
          sublabel="Represented here"
        />
      </div>

      {/* TOOLBAR */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // reset page on search
          }}
          className="w-full sm:w-80 rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* Cards */}
      {employees.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Users className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No employees found</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {employees.map((emp) => (
              <div key={emp._id} className="card-premium card-hover shadow-premium-sm relative p-5">
                {/* Status */}
                <span
                  className={cn(
                    "absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
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
                  {emp.status || "ACTIVE"}
                </span>

                {/* Avatar */}
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--primary)] to-[#7C3AED] text-xl font-semibold text-white">
                  {emp.profilePicture ? (
                    <img
                      src={emp.profilePicture}
                      alt={emp.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(emp.name)
                  )}
                </div>

                {/* Name */}
                <h3 className="text-base font-semibold text-[var(--foreground)]">{emp.name}</h3>
                <p className="mb-3 truncate text-sm text-[var(--muted-foreground)]">{emp.email}</p>

                {/* Info */}
                <div className="space-y-1.5 text-sm text-[var(--muted-foreground)]">
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Role:</span> {emp.role}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Type:</span>{" "}
                    {emp.employmentType || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Department:</span>{" "}
                    {emp.departmentId?.name || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--foreground)]">Manager:</span>{" "}
                    {emp.managerId?.name || "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION (ONLY WHEN > 1 PAGE) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-sm font-medium text-[var(--foreground)]">
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
