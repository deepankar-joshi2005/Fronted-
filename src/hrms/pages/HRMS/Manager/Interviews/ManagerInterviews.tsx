/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { User, Briefcase, Calendar, MessageSquare, CheckCircle, Clock, GitBranch, Search } from "lucide-react";
import InterviewFeedbackModal from "./InterviewFeedbackModal";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

interface Candidate {
  _id: string;
  name: string;
  email: string;
  jobTitle: string;
  mobile: string;
  status: string;
  applied: boolean;
  shortlisted: boolean;
  hrRound: boolean;
  techRound: boolean;
  offer: boolean;
  hired: boolean;
  feedback?: string;
  createdAt: string;
}

const ManagerInterviews = () => {
  const token = localStorage.getItem("token");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/candidates/manager/interviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(res.data || []);
    } catch (error) {
      console.error("Failed to fetch candidates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openFeedbackModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsModalOpen(true);
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || c.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [candidates, searchTerm, statusFilter]);

  const shortlistedCount = useMemo(() => candidates.filter((c) => c.shortlisted).length, [candidates]);
  const techRoundCount = useMemo(() => candidates.filter((c) => c.techRound).length, [candidates]);
  const hiredCount = useMemo(() => candidates.filter((c) => c.hired || c.status === "Hired").length, [candidates]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-[var(--primary)]" />
            Interview Feedback
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Evaluate interview candidates and record stage feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] text-xs font-semibold">
            {candidates.length} Total Candidates
          </span>
        </div>
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Interview Pipeline"
          value={candidates.length}
          icon={GitBranch}
          tone="primary"
        />
        <StatCard
          label="Shortlisted Stage"
          value={shortlistedCount}
          icon={User}
          tone="warning"
        />
        <StatCard
          label="Tech Round Stage"
          value={techRoundCount}
          icon={Clock}
          tone="violet"
        />
        <StatCard
          label="Hired Candidates"
          value={hiredCount}
          icon={CheckCircle}
          tone="good"
        />
      </div>

      {/* ================= PANEL & CARDS ================= */}
      <DashboardPanel title="Candidate Pipeline List" subtitle="Search and manage interview rounds">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search candidate name or job title..."
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
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewing">Interviewing</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted-foreground)] text-xs">
            <User className="h-10 w-10 mx-auto mb-2 opacity-50 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No candidates assigned for interview</p>
            <p className="text-xs mt-1">Candidates assigned to your openings will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate._id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-premium-sm hover:shadow-premium transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* HEADER */}
                <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">
                        <User size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--foreground)]">{candidate.name}</h3>
                        <div className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)] mt-0.5">
                          <Briefcase size={12} />
                          <span>{candidate.jobTitle}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        candidate.status === "Hired"
                          ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                          : candidate.status === "Rejected"
                          ? "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                          : "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]"
                      )}
                    >
                      {candidate.status}
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-4 space-y-4 flex-grow">
                  {/* PROGRESS TRACKER */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
                      Pipeline Stage
                    </p>
                    <div className="flex items-center justify-between">
                      <RoundIndicator label="Shortlisted" active={candidate.shortlisted} />
                      <div className="h-px bg-[var(--border)] flex-grow mx-1" />
                      <RoundIndicator label="HR Round" active={candidate.hrRound} />
                      <div className="h-px bg-[var(--border)] flex-grow mx-1" />
                      <RoundIndicator label="Tech Round" active={candidate.techRound} />
                    </div>
                  </div>

                  {/* FEEDBACK SUMMARY */}
                  {candidate.feedback && (
                    <div className="bg-[var(--muted)]/60 p-3 rounded-xl border border-[var(--border)]">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">
                        <MessageSquare size={12} />
                        <span>Recent Feedback</span>
                      </div>
                      <p className="text-xs text-[var(--foreground)] line-clamp-2 italic">"{candidate.feedback}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Applied {new Date(candidate.createdAt).toLocaleDateString("en-GB")}</span>
                    </div>
                  </div>
                </div>

                {/* ACTION */}
                <div className="p-3 bg-[var(--muted)]/50 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => openFeedbackModal(candidate)}
                    className="w-full py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-premium-xs"
                  >
                    <Clock size={14} />
                    Manage Interview & Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      {selectedCandidate && (
        <InterviewFeedbackModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCandidate(null);
          }}
          candidate={selectedCandidate}
          onSuccess={fetchCandidates}
        />
      )}
    </div>
  );
};

const RoundIndicator = ({ label, active }: { label: string; active: boolean }) => (
  <div className="flex flex-col items-center gap-1 group">
    {active ? (
      <CheckCircle size={16} className="text-[var(--status-good)]" />
    ) : (
      <div className="w-4 h-4 rounded-full border-2 border-[var(--border)]" />
    )}
    <span className={cn("text-[9px] font-bold tracking-tight", active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]")}>
      {label}
    </span>
  </div>
);

export default ManagerInterviews;
