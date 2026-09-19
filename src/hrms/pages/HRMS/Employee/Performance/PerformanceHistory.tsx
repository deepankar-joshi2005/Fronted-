/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loader from "../../Loader";
import { Star, Award, MessageSquare, Search } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";

const API = import.meta.env.VITE_API_URL;

/* ⭐ Star Component */
const Stars = ({ value }: { value: number }) => {
  const full = Math.round(value || 0);
  return (
    <div className="flex items-center gap-1 text-amber-400 text-xs">
      {"★".repeat(full)}
      <span className="text-[var(--muted-foreground)] opacity-30">{"★".repeat(5 - full)}</span>
      <span className="ml-1 text-xs font-bold text-[var(--foreground)]">({value || 0}/5)</span>
    </div>
  );
};

export default function MyFeedback() {
  const token = localStorage.getItem("token");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFeedback = async () => {
    try {
      const res = await axios.get(`${API}/feedback/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch feedback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredList = useMemo(() =>
    list.filter((item) =>
      item.appraisal?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.managerFeedback?.reviewer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [list, searchTerm]
  );

  const avgOverallRating = useMemo(() => {
    if (!list.length) return "0";
    const sum = list.reduce((acc, item) => acc + (item.managerFeedback?.overallRating || 0), 0);
    return (sum / list.length).toFixed(1);
  }, [list]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">Performance History</h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
          View reviewer ratings, manager feedback, and past appraisal scores.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Appraisals Reviewed" value={list.length} icon={Award} tone="primary" />
        <StatCard label="Average Overall Score" value={`${avgOverallRating} / 5`} icon={Star} tone="good" />
        <StatCard label="Feedback Received" value={list.length} icon={MessageSquare} tone="violet" />
      </div>

      {/* PANEL & CARDS */}
      <DashboardPanel title="Appraisal Feedback Records" subtitle="Manager evaluations and ratings">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search by title or manager name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-xs">
            <Award className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No feedback records available</p>
            <p className="mt-1">Reviewed appraisals and manager feedback will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.map((item) => {
              const manager = item.managerFeedback;

              return (
                <div
                  key={item.selfAppraisalId}
                  className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 shadow-premium-sm hover:shadow-premium transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--foreground)]">{item.appraisal?.title}</h3>
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                          Reviewer: <span className="font-medium text-[var(--foreground)]">{manager?.reviewer?.name || "Manager"}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]">
                        {item.status || "REVIEWED"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)]">
                      <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-1">Overall Performance Score</p>
                      <Stars value={manager?.overallRating} />
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-[var(--border)] pt-3">
                      <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Manager Ratings</p>
                      <div className="flex justify-between items-center text-[var(--foreground)]">
                        <span>Goals Achievement</span>
                        <Stars value={manager?.managerRatings?.goals} />
                      </div>
                      <div className="flex justify-between items-center text-[var(--foreground)]">
                        <span>Skills</span>
                        <Stars value={manager?.managerRatings?.skills} />
                      </div>
                      <div className="flex justify-between items-center text-[var(--foreground)]">
                        <span>Behaviour</span>
                        <Stars value={manager?.managerRatings?.behaviour} />
                      </div>
                    </div>

                    {item.selfRatings?.skillsRating && (
                      <div className="space-y-1 text-xs border-t border-[var(--border)] pt-3">
                        <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Your Self Ratings</p>
                        <div className="flex justify-between items-center text-[var(--foreground)]">
                          <span>Technical</span>
                          <Stars value={item.selfRatings.skillsRating.technical} />
                        </div>
                        <div className="flex justify-between items-center text-[var(--foreground)]">
                          <span>Communication</span>
                          <Stars value={item.selfRatings.skillsRating.communication} />
                        </div>
                        <div className="flex justify-between items-center text-[var(--foreground)]">
                          <span>Teamwork</span>
                          <Stars value={item.selfRatings.skillsRating.teamwork} />
                        </div>
                        <div className="flex justify-between items-center text-[var(--foreground)]">
                          <span>Problem Solving</span>
                          <Stars value={item.selfRatings.skillsRating.problemSolving} />
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[var(--border)] pt-3">
                      <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Manager Feedback</p>
                      <p className="text-xs text-[var(--foreground)] italic bg-[var(--muted)]/40 p-2.5 rounded-xl border border-[var(--border)]">
                        "{manager?.feedback || "No feedback comments provided."}"
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-[var(--muted-foreground)] opacity-70 mt-4 text-right">
                    Reviewed on {manager?.reviewedAt ? new Date(manager.reviewedAt).toLocaleDateString("en-GB") : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
