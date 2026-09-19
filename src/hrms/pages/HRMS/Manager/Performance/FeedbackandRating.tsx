/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Star, Search, Clock, CheckCircle2, MessageSquare, Eye } from "lucide-react";
import FeedbackModal from "./FeedbackModal";
import SelfAppraisalViewModal from "./SelfAppraisalViewModal";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

/* ⭐ Overall Rating Calculate */
const calculateOverallRating = (item: any) => {
  const total =
    (item.goalsRating || 0) +
    (item.skillsRating?.technical || 0) +
    (item.skillsRating?.communication || 0) +
    (item.skillsRating?.teamwork || 0) +
    (item.skillsRating?.problemSolving || 0);

  return Number((total / 5).toFixed(1));
};

/* ⭐ Star Component */
const StarRating = ({ rating }: { rating: number }) => {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1 text-amber-400 text-xs">
      {"★".repeat(full)}
      <span className="text-[var(--muted-foreground)] opacity-30">{"★".repeat(5 - full)}</span>
      <span className="ml-1 text-xs font-bold text-[var(--foreground)]">({rating}/5)</span>
    </div>
  );
};

export default function FeedbackAndRatings() {
  const token = localStorage.getItem("token");

  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [viewSelf, setViewSelf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchList = async () => {
    try {
      const res = await axios.get(`${API}/feedback/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch feedback list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const matchesSearch =
        item.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.appraisal?.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || item.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [list, searchTerm, statusFilter]);

  const reviewedCount = useMemo(() => list.filter((i) => i.status === "REVIEWED").length, [list]);
  const pendingCount = list.length - reviewedCount;

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Feedback & Ratings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Evaluate team self-appraisals and submit manager ratings.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)] text-[var(--status-warning)] border border-[color-mix(in_oklab,var(--status-warning)_25%,transparent)] text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            <span>{pendingCount} Feedback Pending</span>
          </div>
        )}
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Appraisals Submitted"
          value={list.length}
          icon={Star}
          tone="primary"
        />
        <StatCard
          label="Pending Manager Review"
          value={pendingCount}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Reviewed Appraisals"
          value={reviewedCount}
          icon={CheckCircle2}
          tone="good"
        />
      </div>

      {/* ================= PANEL & CARDS ================= */}
      <DashboardPanel title="Self-Appraisal Submissions" subtitle="Search and provide feedback">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by employee name or title..."
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
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
            </select>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-xs">
            <Star className="h-10 w-10 mx-auto mb-2 opacity-50 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No appraisals found</p>
            <p className="text-xs mt-1">Pending self-appraisals from team members will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredList.map((item) => {
              const overallRating = calculateOverallRating(item);
              const isReviewed = item.status === "REVIEWED";

              return (
                <div
                  key={item.selfAppraisalId}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-premium-sm hover:shadow-premium transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--foreground)]">{item.employee?.name}</h3>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          Appraisal: <span className="font-medium text-[var(--foreground)]">{item.appraisal?.title}</span>
                        </p>
                      </div>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          isReviewed
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="pt-1">
                      <StarRating rating={overallRating} />
                    </div>

                    {item.summary && (
                      <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 italic bg-[var(--muted)]/60 p-2 rounded-lg">
                        "{item.summary}"
                      </p>
                    )}

                    <p className="text-[11px] text-[var(--muted-foreground)] pt-1">
                      Submitted on {new Date(item.submittedAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>

                  {/* BOTTOM BUTTONS */}
                  <div className="mt-5 flex gap-2 pt-3 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setViewSelf(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Self
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl text-white transition-colors shadow-premium-xs",
                        isReviewed
                          ? "bg-[var(--primary)] hover:opacity-90"
                          : "bg-[var(--status-good)] hover:opacity-90"
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {isReviewed ? "View Feedback" : "Give Feedback"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardPanel>

      {/* MODALS */}
      {viewSelf && (
        <SelfAppraisalViewModal
          open={true}
          data={viewSelf}
          onClose={() => setViewSelf(null)}
        />
      )}

      {selected && (
        <FeedbackModal
          open={true}
          onClose={() => {
            setSelected(null);
            fetchList();
          }}
          selfAppraisalId={selected.selfAppraisalId}
          readOnly={selected.status === "REVIEWED"}
        />
      )}
    </div>
  );
}
