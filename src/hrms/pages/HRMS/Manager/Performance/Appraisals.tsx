/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BarChart3, Plus, Search, Calendar, Eye, Pencil, Trash2, CheckCircle2, Clock } from "lucide-react";
import AddAppraisalModal from "./AddAppraisalModal";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import SelfAppraisalViewModal from "./SelfAppraisalViewModal";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

type Appraisal = {
  _id: string;
  title: string;
  type: "MID_YEAR" | "ANNUAL";
  startDate: string;
  endDate: string;
  applicableFor: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  progress: number;
};

export default function Appraisals() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState<Appraisal[]>([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<Appraisal | null>(null);
  const [openView, setOpenView] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAppraisals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/appraisals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data || []);
    } catch (err) {
      console.error("Failed to fetch appraisals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppraisals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await axios.delete(`${API_BASE}/appraisals/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        type: "success",
        title: "Appraisal Deleted",
        message: res.data?.message || "Appraisal deleted successfully.",
      });

      setDeleteId(null);
      fetchAppraisals();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Delete Failed",
        message:
          error?.response?.data?.message ||
          "Unable to delete appraisal. Please try again.",
      });
    }
  };

  const filteredAppraisals = useMemo(() => {
    return data.filter((a) => {
      const matchesSearch =
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.applicableFor?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || a.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  const activeCount = useMemo(() => data.filter((a) => a.status === "ACTIVE").length, [data]);
  const draftCount = useMemo(() => data.filter((a) => a.status === "DRAFT").length, [data]);
  const closedCount = useMemo(() => data.filter((a) => a.status === "CLOSED").length, [data]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Appraisal Cycles
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Manage annual and mid-year performance evaluation cycles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditData(null);
            setOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs shadow-premium-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Appraisal Cycle
        </button>
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cycles"
          value={data.length}
          icon={BarChart3}
          tone="primary"
        />
        <StatCard
          label="Active Cycles"
          value={activeCount}
          icon={Clock}
          tone="good"
        />
        <StatCard
          label="Draft Cycles"
          value={draftCount}
          icon={Calendar}
          tone="warning"
        />
        <StatCard
          label="Closed Cycles"
          value={closedCount}
          icon={CheckCircle2}
          tone="violet"
        />
      </div>

      {/* ================= PANEL & CARDS ================= */}
      <DashboardPanel title="Appraisal Cycles Overview" subtitle="Search and manage evaluation rounds">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by title or target employees..."
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
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {filteredAppraisals.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-xs">
            <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No appraisals found</p>
            <p className="text-xs mt-1">Create an appraisal cycle to start reviewing performance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAppraisals.map((a) => (
              <div
                key={a._id}
                className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 shadow-premium-sm hover:shadow-premium transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-bold text-[var(--foreground)]">{a.title}</h3>
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        a.status === "ACTIVE" && "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]",
                        a.status === "CLOSED" && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                        a.status === "DRAFT" && "bg-[var(--muted)] text-[var(--muted-foreground)]"
                      )}
                    >
                      {a.status}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--muted-foreground)] space-y-1.5 mb-4">
                    <p>
                      <strong className="text-[var(--foreground)]">Cycle Type:</strong> {a.type === "MID_YEAR" ? "Mid-Year Review" : "Annual Appraisal"}
                    </p>
                    <p>
                      <strong className="text-[var(--foreground)]">Duration:</strong>{" "}
                      {new Date(a.startDate).toLocaleDateString("en-GB")} –{" "}
                      {new Date(a.endDate).toLocaleDateString("en-GB")}
                    </p>
                    <p>
                      <strong className="text-[var(--foreground)]">Applicable For:</strong> {a.applicableFor}
                    </p>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="mt-4 pt-3 border-t border-[var(--border)]">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[var(--muted-foreground)]">Cycle Progress</span>
                      <span className="text-[var(--foreground)]">{a.progress}%</span>
                    </div>
                    <div className="w-full bg-[var(--muted)] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => {
                      setViewData(a);
                      setOpenView(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditData(a);
                      setOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>

                  {a.status !== "CLOSED" && (
                    <button
                      type="button"
                      onClick={() => setDeleteId(a._id)}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)] text-xs font-semibold text-[var(--status-critical)] hover:bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {/* MODALS */}
      {open && (
        <AddAppraisalModal
          open={open}
          onClose={() => setOpen(false)}
          data={editData}
          onSuccess={fetchAppraisals}
        />
      )}

      {openView && (
        <SelfAppraisalViewModal
          open={openView}
          onClose={() => setOpenView(false)}
          data={viewData}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl w-full max-w-sm shadow-premium-lg">
            <h3 className="font-bold text-base text-[var(--foreground)] mb-2">Delete Appraisal?</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-6">
              This action cannot be undone. All responses under this cycle will be affected.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
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
