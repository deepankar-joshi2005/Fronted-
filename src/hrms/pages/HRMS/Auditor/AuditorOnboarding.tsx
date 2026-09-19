/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ClipboardList, CheckCircle2, Clock, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface OnboardingTask {
  _id: string;
  employee: { name: string; email: string };
  department: { name: string };
  assignedTo: { name: string };
  task: string;
  status: "PENDING" | "COMPLETED";
  createdAt: string;
}

export default function AuditorOnboarding() {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/onboarding-tasks`, { headers });
        setTasks(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => tasks.filter((t) => t.employee?.name?.toLowerCase().includes(search.toLowerCase())),
    [tasks, search]
  );

  useEffect(() => setPage(1), [search, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const summary = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "COMPLETED").length,
      pending: tasks.filter((t) => t.status === "PENDING").length,
    }),
    [tasks]
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
            Onboarding Tasks
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">New-joiner onboarding checklist completion</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Total Tasks" value={summary.total} icon={ClipboardList} tone="primary" />
        <StatCard label="Completed" value={summary.completed} icon={CheckCircle2} tone="good" />
        <StatCard label="Pending" value={summary.pending} icon={Clock} tone="warning" />
      </div>

      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ClipboardList className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No onboarding tasks match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginated.map((t) => (
                  <tr key={t._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{t.employee?.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{t.department?.name || "—"}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{t.task}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{t.assignedTo?.name || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          t.status === "COMPLETED"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}
                      >
                        {t.status}
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
              itemLabel="tasks"
            />
          </div>
        </div>
      )}
    </div>
  );
}
