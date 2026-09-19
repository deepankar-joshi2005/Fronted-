/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import SelfAppraisalModal from "./SelfAppraisalModal";
import Loader from "../../Loader";
import { ClipboardList, CheckCircle2, Clock, Calendar, Search, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

interface Appraisal {
  _id: string;
  title: string;
  type: "MID_YEAR" | "ANNUAL";
  status: "ACTIVE" | "CLOSED";
  startDate: string;
  endDate: string;
  isSubmitted: boolean;
  submittedAt: string | null;
  selfAppraisalId: string | null;
}

export default function MyAppraisals() {
  const token = localStorage.getItem("token");

  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMyAppraisals = async () => {
    try {
      const res = await axios.get(`${API_BASE}/self-appraisals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppraisals(res.data || []);
    } catch (err) {
      console.error("Failed to fetch appraisals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAppraisals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAppraisals = useMemo(() =>
    appraisals.filter((a) =>
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [appraisals, searchTerm]
  );

  const submittedCount = useMemo(() => appraisals.filter((a) => a.isSubmitted).length, [appraisals]);
  const pendingCount = appraisals.length - submittedCount;

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">Self Appraisal</h1>
        <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
          Submit self-evaluations for active performance appraisal cycles.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Appraisal Rounds" value={appraisals.length} icon={ClipboardList} tone="primary" />
        <StatCard label="Pending Self-Evaluation" value={pendingCount} icon={Clock} tone="warning" />
        <StatCard label="Submitted Appraisals" value={submittedCount} icon={CheckCircle2} tone="good" />
      </div>

      {/* PANEL & LIST */}
      <DashboardPanel title="Appraisal Cycles" subtitle="Active and completed appraisal rounds">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search appraisal title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredAppraisals.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-xs">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No appraisals available</p>
            <p className="mt-1">New evaluation cycles will appear here when published.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppraisals.map((a) => (
              <div
                key={a._id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-premium-sm hover:shadow-premium transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-[var(--foreground)]">{a.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--muted)] text-[var(--muted-foreground)]">
                      {a.type === "MID_YEAR" ? "Mid-Year Review" : "Annual Appraisal"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Duration: {new Date(a.startDate).toLocaleDateString("en-GB")} – {new Date(a.endDate).toLocaleDateString("en-GB")}
                    </span>

                    {a.isSubmitted && a.submittedAt && (
                      <span className="text-[var(--status-good)] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Submitted on {new Date(a.submittedAt).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      a.isSubmitted
                        ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                        : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                    )}
                  >
                    {a.isSubmitted ? "Submitted" : "Pending"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedAppraisal(a)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-premium-xs",
                      a.isSubmitted
                        ? "bg-[var(--muted-foreground)] hover:opacity-90"
                        : "bg-[var(--primary)] hover:opacity-90"
                    )}
                  >
                    <span>{a.isSubmitted ? "View Self Appraisal" : "Start Self Appraisal"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {/* MODAL */}
      {selectedAppraisal && (
        <SelfAppraisalModal
          open={true}
          onClose={() => {
            setSelectedAppraisal(null);
            fetchMyAppraisals();
          }}
          appraisalId={selectedAppraisal._id}
          selfAppraisalId={selectedAppraisal.selfAppraisalId}
          readOnly={selectedAppraisal.isSubmitted}
        />
      )}
    </div>
  );
}
