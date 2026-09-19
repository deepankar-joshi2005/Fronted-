/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LogOut, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface Resignation {
  _id: string;
  employee: { name: string; employeeId?: string; departmentId?: { name: string } };
  resignationType: string;
  reasonCategory: string;
  expectedLastWorkingDay: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const statusStyles: Record<Resignation["status"], string> = {
  APPROVED: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  PENDING: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  REJECTED: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
};

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

export default function AuditorResignations() {
  const [list, setList] = useState<Resignation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/resignation/all`, { headers, params: { limit: 1000 } });
        setList(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => list.filter((r) => r.employee?.name?.toLowerCase().includes(search.toLowerCase())),
    [list, search]
  );

  useEffect(() => setPage(1), [search, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const summary = useMemo(
    () => ({
      total: list.length,
      approved: list.filter((r) => r.status === "APPROVED").length,
      pending: list.filter((r) => r.status === "PENDING").length,
      rejected: list.filter((r) => r.status === "REJECTED").length,
    }),
    [list]
  );

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Resignation & Exit Records
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Offboarding compliance across the organization</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Requests" value={summary.total} icon={LogOut} tone="primary" />
        <StatCard label="Approved" value={summary.approved} icon={CheckCircle2} tone="good" />
        <StatCard label="Pending" value={summary.pending} icon={Clock} tone="warning" />
        <StatCard label="Rejected" value={summary.rejected} icon={XCircle} tone="critical" />
      </div>

      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <LogOut className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No resignation records match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reason Category</th>
                  <th className="px-4 py-3">Last Working Day</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginated.map((r) => (
                  <tr key={r._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{r.employee?.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{r.employee?.departmentId?.name || "—"}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{r.resignationType}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{r.reasonCategory}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{formatDate(r.expectedLastWorkingDay)}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusStyles[r.status])}>
                        {r.status}
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
              total={filtered.length}
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
