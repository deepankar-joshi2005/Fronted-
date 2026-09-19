/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Mail,
  ListChecks,
} from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

// ================= TYPES =================
type StatusType = "PENDING" | "COMPLETED";

interface IUser {
  _id: string;
  name: string;
  email: string;
}

interface IDepartment {
  _id: string;
  name: string;
}

interface IOnboardingTask {
  _id: string;
  employee: IUser;
  department: IDepartment;
  assignedTo: IUser;
  task: string;
  status: StatusType;
  createdAt: string;
}

const statusPillClass: Record<StatusType, string> = {
  COMPLETED:
    "border-transparent bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  PENDING:
    "border-[var(--status-warning)] bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)]",
};

// ================= COMPONENT =================
export default function EmployeeOnboardingTask() {
  const [tasks, setTasks] = useState<IOnboardingTask[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ================= FETCH TASKS =================
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/onboarding-tasks`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setTasks(res.data);
    } catch (error) {
      console.error("Failed to load onboarding tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  // ================= STATUS CHANGE =================
  const handleStatusChange = async (taskId: string, status: StatusType) => {
    try {
      await axios.patch(
        `${API}/onboarding-tasks/${taskId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? { ...task, status } : task))
      );
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  // ================= KPIs =================
  const kpis = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;
    const departments = new Set(tasks.map((t) => t.department?._id)).size;
    return { total, completed, pending, departments };
  }, [tasks]);

  // ================= FILTER =================
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.employee?.name?.toLowerCase().includes(q) ||
        t.employee?.email?.toLowerCase().includes(q) ||
        t.department?.name?.toLowerCase().includes(q) ||
        t.task?.toLowerCase().includes(q) ||
        t.assignedTo?.name?.toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, page, pageSize]);

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Employee IT Onboarding Tasks
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Onboarding <span className="mx-1">›</span> IT Tasks
          </p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Tasks"
          value={kpis.total}
          icon={ClipboardList}
          tone="primary"
          sublabel="All onboarding tasks"
        />
        <StatCard
          label="Completed"
          value={kpis.completed}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.completed / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard
          label="Pending"
          value={kpis.pending}
          icon={Clock}
          tone="warning"
          sublabel="Awaiting completion"
        />
        <StatCard
          label="Departments"
          value={kpis.departments}
          icon={Building2}
          tone="violet"
          sublabel="Covered by tasks"
        />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, department, task or assignee..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* TABLE */}
      {filteredTasks.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <ListChecks className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No onboarding tasks found</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3 min-w-[220px]">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedTasks.map((task) => (
                  <tr key={task._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-sm font-semibold text-[var(--primary)]">
                          {task.employee?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{task.employee?.name}</p>
                          <p className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                            <Mail className="h-3 w-3" /> {task.employee?.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{task.department?.name}</td>

                    <td className="px-4 py-3.5 text-[var(--foreground)]">{task.task}</td>

                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{task.assignedTo?.name}</td>

                    <td className="px-4 py-3.5">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value as StatusType)
                        }
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors focus:border-[var(--primary)]",
                          statusPillClass[task.status]
                        )}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>

                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(task.createdAt).toLocaleDateString()}
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
              total={filteredTasks.length}
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
