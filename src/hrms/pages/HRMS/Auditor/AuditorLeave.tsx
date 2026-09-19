/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Users, ClipboardList, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface LeaveItem {
  _id: string;
  employee: Employee;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

const getCurrentMonth = () => {
  const d = new Date();
  return d.toISOString().slice(0, 7); // YYYY-MM
};

const statusStyles: Record<LeaveItem["status"], string> = {
  APPROVED: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  PENDING: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  REJECTED: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
};

const statusDot: Record<LeaveItem["status"], string> = {
  APPROVED: "bg-[var(--status-good)]",
  PENDING: "bg-[var(--status-warning)]",
  REJECTED: "bg-[var(--status-critical)]",
};

export default function AuditorLeave() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  /* ================= FETCH ALL LEAVES ================= */
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/employee/leaves/all`, { headers });
        setLeaves(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= MONTH FILTER (FRONTEND) ================= */
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const fromMonth = l.fromDate.slice(0, 7);
      const toMonth = l.toDate.slice(0, 7);

      const matchMonth = fromMonth === month || toMonth === month;

      const matchSearch = l.employee.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchMonth && matchSearch;
    });
  }, [leaves, month, search]);

  /* ================= PAGE RESET ON FILTER CHANGE ================= */
  useEffect(() => {
    setPage(1);
  }, [month, search, pageSize]);

  /* ================= CLIENT PAGINATION (PRESENTATION ONLY) ================= */
  const paginatedLeaves = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeaves.slice(start, start + pageSize);
  }, [filteredLeaves, page, pageSize]);

  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    const totalEmployees = new Set(filteredLeaves.map((l) => l.employee._id))
      .size;

    const totalLeaves = filteredLeaves.length;
    const approved = filteredLeaves.filter(
      (l) => l.status === "APPROVED"
    ).length;
    const pending = filteredLeaves.filter((l) => l.status === "PENDING").length;
    const rejected = filteredLeaves.filter(
      (l) => l.status === "REJECTED"
    ).length;

    return {
      totalEmployees,
      totalLeaves,
      approved,
      pending,
      rejected,
    };
  }, [filteredLeaves]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Leave Records
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">{monthLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-52 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        <StatCard label="Employees" value={summary.totalEmployees} icon={Users} tone="primary" sublabel="With leave activity" />
        <StatCard label="Total Leaves" value={summary.totalLeaves} icon={ClipboardList} tone="violet" sublabel={monthLabel} />
        <StatCard label="Approved" value={summary.approved} icon={CheckCircle2} tone="good" />
        <StatCard label="Pending" value={summary.pending} icon={Clock} tone="warning" />
        <StatCard label="Rejected" value={summary.rejected} icon={XCircle} tone="critical" />
      </div>

      {/* ================= TABLE ================= */}
      {filteredLeaves.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ClipboardList className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No leave records found for this month</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedLeaves.map((l) => (
                  <tr key={l._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{l.employee.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{l.employee.role}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{l.leaveType}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{l.fromDate.slice(0, 10)}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{l.toDate.slice(0, 10)}</td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--foreground)]">{l.totalDays}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          statusStyles[l.status]
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[l.status])} />
                        {l.status}
                      </span>
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
              total={filteredLeaves.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="records"
            />
          </div>
        </div>
      )}
    </div>
  );
}
