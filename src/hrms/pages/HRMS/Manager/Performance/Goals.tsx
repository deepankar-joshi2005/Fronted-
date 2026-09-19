/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  MoreVertical,
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  ListChecks,
  Pencil,
  Trash2,
  Search,
  CalendarClock,
} from "lucide-react";
import AddGoalModal from "./AddGoalModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

interface Goal {
  _id: string;
  title: string;
  description: string;
  progress: number;
  status: "Not Started" | "In Progress" | "Completed";
  deadline?: string;
  assignedTo?: {
    _id: string;
    name: string;
    employeeId: string;
  };
}

const progressColor = (p: number) =>
  p >= 100 ? "bg-[var(--status-good)]" : p >= 50 ? "bg-[var(--primary)]" : "bg-[var(--status-warning)]";

export default function Goals() {
  const token = localStorage.getItem("token");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/goals/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(res.data || []);
    } catch (err) {
      console.error("Failed to fetch goals", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await axios.delete(`${API_BASE}/goals/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        type: "success",
        title: "Goal Deleted",
        message: res.data?.message || "Goal deleted successfully",
      });

      setOpenDelete(false);
      setDeleteId(null);
      fetchGoals();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        message:
          error?.response?.data?.message || "Delete failed, please try again",
      });
      console.error("Delete failed", error);
    }
  };

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const matchesSearch =
        g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || g.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [goals, searchTerm, statusFilter]);

  const total = goals.length;
  const completedCount = useMemo(() => goals.filter((g) => g.status === "Completed").length, [goals]);
  const inProgressCount = useMemo(() => goals.filter((g) => g.status === "In Progress").length, [goals]);
  const avgProgress = total
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / total)
    : 0;

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Goals & OKRs
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Track key objectives and team performance progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditGoal(null);
            setOpenAdd(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add New Goal
        </button>
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Goals Assigned"
          value={total}
          icon={Target}
          tone="primary"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={ListChecks}
          tone="warning"
        />
        <StatCard
          label="Completed Objectives"
          value={completedCount}
          icon={CheckCircle2}
          tone="good"
        />
        <StatCard
          label="Average Progress"
          value={`${avgProgress}%`}
          icon={TrendingUp}
          tone="violet"
        />
      </div>

      {/* ================= DASHBOARD PANEL ================= */}
      <DashboardPanel title="Objective Tracking Cards" subtitle="Search and manage team OKRs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search goal title or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="not started">Not Started</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {filteredGoals.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-xs">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-50 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No goals found</p>
            <p className="text-xs mt-1">Create a goal to start tracking team progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGoals.map((goal) => {
              const isOverdue =
                goal.status !== "Completed" &&
                goal.deadline &&
                new Date(goal.deadline) < new Date();

              return (
                <div
                  key={goal._id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-premium-sm hover:shadow-premium transition-all flex flex-col justify-between relative group"
                >
                  {/* CARD HEADER */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          goal.status === "Completed" && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                          goal.status === "In Progress" && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
                          goal.status === "Not Started" && "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        )}
                      >
                        {goal.status}
                      </span>

                      {/* DROPDOWN MENU */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenu(openMenu === goal._id ? null : goal._id)}
                          className="p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openMenu === goal._id && (
                          <div
                            className="absolute right-0 top-6 w-36 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-premium-lg py-1 z-30 text-xs"
                            onClick={() => setOpenMenu(null)}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditGoal(goal);
                                setOpenAdd(true);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[var(--muted)] flex items-center gap-2 text-[var(--foreground)]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Goal
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteId(goal._id);
                                setOpenDelete(true);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] flex items-center gap-2 text-[var(--status-critical)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete Goal
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="font-bold text-sm text-[var(--foreground)] mb-1 leading-snug">{goal.title}</h3>
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-4">{goal.description}</p>
                  </div>

                  {/* PROGRESS & FOOTER */}
                  <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-semibold">
                        <span className="text-[var(--muted-foreground)]">Progress</span>
                        <span className="text-[var(--foreground)]">{goal.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", progressColor(goal.progress))}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] pt-1">
                      <span className="font-medium truncate max-w-[140px]">
                        Assignee: <span className="text-[var(--foreground)] font-semibold">{goal.assignedTo?.name || "Unassigned"}</span>
                      </span>

                      {goal.deadline && (
                        <span className={cn("inline-flex items-center gap-1 font-semibold", isOverdue ? "text-[var(--status-critical)]" : "text-[var(--muted-foreground)]")}>
                          <CalendarClock className="h-3 w-3" />
                          {new Date(goal.deadline).toLocaleDateString("en-GB")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardPanel>

      {/* ADD / EDIT MODAL */}
      {openAdd && (
        <AddGoalModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          editGoal={editGoal}
          onSuccess={fetchGoals}
        />
      )}

      {/* DELETE DIALOG */}
      {openDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-premium-lg">
            <h3 className="font-bold text-base text-[var(--foreground)] mb-2">Delete Goal?</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenDelete(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--status-critical)] text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
