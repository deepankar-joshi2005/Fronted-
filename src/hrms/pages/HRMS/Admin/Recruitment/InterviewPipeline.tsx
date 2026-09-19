/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Clock, Users, UserCheck, Trophy } from "lucide-react";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

interface Candidate {
  _id: string;
  name: string;
  applied: boolean;
  shortlisted: boolean;
  hrRound: boolean;
  techRound: boolean;
  offer: boolean;
  hired: boolean;
  status: string;
}

const StatusIcon = ({ value, status }: { value: boolean; status: string }) => {
  if (status === "Rejected" && !value)
    return <XCircle className="mx-auto h-5 w-5 text-[var(--status-critical)]" />;
  return value ? (
    <CheckCircle className="mx-auto h-5 w-5 text-[var(--status-good)]" />
  ) : (
    <div className="mx-auto h-5 w-5 rounded-full border-2 border-[var(--border)]" />
  );
};

const InterviewPipeline = () => {
  const token = localStorage.getItem("token");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/candidates`, {
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
  }, []);

  const totals = useMemo(() => {
    const inHrRound = candidates.filter((c) => c.hrRound && !c.techRound && c.status !== "Rejected").length;
    const inTechRound = candidates.filter((c) => c.techRound && !c.offer && c.status !== "Rejected").length;
    const hired = candidates.filter((c) => c.hired).length;
    return { total: candidates.length, inHrRound, inTechRound, hired };
  }, [candidates]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Interview Pipeline
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">Recruitment &gt; Interview Pipeline</p>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total in Pipeline" value={totals.total} icon={Users} tone="primary" />
        <StatCard label="In HR Round" value={totals.inHrRound} icon={UserCheck} tone="warning" />
        <StatCard label="In Tech Round" value={totals.inTechRound} icon={Clock} tone="violet" />
        <StatCard label="Hired" value={totals.hired} icon={Trophy} tone="good" />
      </div>

      {/* TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Candidate
                </th>
                {["Applied", "Shortlisted", "HR Round", "Tech Round", "Offer", "Hired"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {candidates.map((c) => (
                <tr key={c._id} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-4 text-left font-semibold text-[var(--foreground)]">
                    <div className="flex flex-col">
                      <span>{c.name}</span>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          c.status === "Rejected" ? "text-[var(--status-critical)]" : "text-[var(--muted-foreground)]"
                        )}
                      >
                        {c.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusIcon value={c.applied} status={c.status} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusIcon value={c.shortlisted} status={c.status} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusIcon value={c.hrRound} status={c.status} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusIcon value={c.techRound} status={c.status} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusIcon value={c.offer} status={c.status} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusIcon value={c.hired} status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {candidates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)]">
            <Clock className="mb-2 h-10 w-10 opacity-20" />
            <p>No candidates found in pipeline</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPipeline;
