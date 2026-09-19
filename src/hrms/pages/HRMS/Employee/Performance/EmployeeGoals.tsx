/** @format */
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import GoalModal from "./GoalModal";
import Loader from "../../Loader";
import { Target, CheckCircle2, Clock, AlertTriangle, TrendingUp, Search, CalendarClock } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

const priorityColor = (p: string) => {
  if (p === "HIGH") return "text-[var(--status-critical)]";
  if (p === "MEDIUM") return "text-[var(--status-warning)]";
  return "text-[var(--status-good)]";
};

const progressColor = (p: number) =>
  p >= 100 ? "bg-[var(--status-good)]" : p >= 50 ? "bg-[var(--primary)]" : "bg-[var(--status-warning)]";

const EmployeeGoals = () => {
  const token = localStorage.getItem("token");

  const [goals, setGoals] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/goals/my-assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(res.data || []);
    } catch (err) {
      console.error("Failed to fetch goals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredGoals = useMemo(() =>
    goals.filter((g) =>
      g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.status?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [goals, searchTerm]
  );

  const completedCount = useMemo(() => goals.filter((g) => g.status === "COMPLETED" || g.status === "Completed").length, [goals]);
  const inProgressCount = useMemo(() => goals.filter((g) => g.status === "IN_PROGRESS" || g.status === "In Progress").length, [goals]);
  const overdueCount = useMemo(() => goals.filter((g) => g.status === "OVERDUE").length, [goals]);
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0;

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">My Goals & OKRs</h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
          Track and update your assigned objectives and key results.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Goals" value={goals.length} icon={Target} tone="primary" />
        <StatCard label="In Progress" value={inProgressCount} icon={Clock} tone="warning" />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} tone="good" />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} icon={TrendingUp} tone="violet" />
      </div>

      {/* GOALS PANEL */}
      <DashboardPanel title="My Assigned Objectives" subtitle="Review progress and update goals">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by title, category or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-xs">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No goals assigned yet</p>
            <p className="mt-1">Your manager will assign objectives that appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGoals.map((g) => {
              const isOverdue = g.status === "OVERDUE";
              const isCompleted = g.status === "COMPLETED" || g.status === "Completed";
              return (
                <div key={g._id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-premium-sm hover:shadow-premium transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-[var(--foreground)] leading-snug">{g.title}</h3>
                      <span className={cn("text-[10px] font-bold uppercase", priorityColor(g.priority))}>{g.priority}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-3">{g.description}</p>
                    {g.category && (
                      <p className="text-[11px] text-[var(--muted-foreground)] mb-3">
                        Category: <span className="font-semibold text-[var(--foreground)]">{g.category}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-[var(--muted-foreground)]">Progress</span>
                        <span className="text-[var(--foreground)]">{g.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", progressColor(g.progress || 0))} style={{ width: `${g.progress || 0}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        isCompleted && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                        isOverdue && "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
                        !isCompleted && !isOverdue && "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]"
                      )}>
                        {g.status}
                      </span>

                      <div className="flex items-center gap-2">
                        {g.deadline && (
                          <span className={cn("flex items-center gap-1 text-[11px] font-medium", isOverdue ? "text-[var(--status-critical)]" : "text-[var(--muted-foreground)]")}>
                            <CalendarClock className="h-3 w-3" />
                            {new Date(g.deadline).toLocaleDateString("en-GB")}
                          </span>
                        )}
                        <button type="button" onClick={() => { setSelected(g); setOpen(true); }}
                          className="text-xs font-semibold text-[var(--primary)] hover:underline">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {overdueCount > 0 && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-[color-mix(in_oklab,var(--status-critical)_8%,transparent)] border border-[color-mix(in_oklab,var(--status-critical)_20%,transparent)] text-[var(--status-critical)] text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>You have {overdueCount} overdue goal{overdueCount > 1 ? "s" : ""}. Please update progress or contact your manager.</span>
          </div>
        )}
      </DashboardPanel>

      {open && <GoalModal open={open} data={selected} onClose={() => setOpen(false)} onSuccess={fetchGoals} />}
    </div>
  );
};

export default EmployeeGoals;
