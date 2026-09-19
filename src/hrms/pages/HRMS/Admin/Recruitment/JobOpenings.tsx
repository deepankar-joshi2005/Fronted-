/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Eye, Pencil, Ban, Plus, Briefcase, CheckCircle2, XCircle, Users } from "lucide-react";
import ViewEditJobModal from "./ViewEditJobModal";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

interface JobOpening {
  _id: string;
  jobTitle: string;
  department: string;
  location: string;
  openings: number;
  recruitingManager?: {
    _id: string;
    name: string;
  };
  jobDocument?: string;
  status: "Open" | "Closed";
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL;

const JobOpening = () => {
  const token = localStorage.getItem("token");

  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "add">("add");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/job-openings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const closeJob = async (id: string) => {
    await axios.patch(
      `${API_BASE}/job-openings/${id}/close`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchJobs();
  };

  const totals = useMemo(() => {
    const open = jobs.filter((j) => j.status === "Open").length;
    const closed = jobs.filter((j) => j.status === "Closed").length;
    const vacancies = jobs.reduce((s, j) => s + (j.openings || 0), 0);
    return { total: jobs.length, open, closed, vacancies };
  }, [jobs]);

  if (loading) {
    return (
      <div className="relative min-h-[300px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Job Openings
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Recruitment &gt; Job Openings</p>
        </div>

        <button
          onClick={() => {
            setMode("add");
            setSelectedJob(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Job Opening
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Job Postings" value={totals.total} icon={Briefcase} tone="primary" />
        <StatCard label="Open Positions" value={totals.open} icon={CheckCircle2} tone="good" />
        <StatCard label="Closed Positions" value={totals.closed} icon={XCircle} tone="critical" />
        <StatCard label="Total Vacancies" value={totals.vacancies} icon={Users} tone="violet" sublabel="Across open roles" />
      </div>

      {/* TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                {["No.", "Job Title", "Department", "Recruiting Manager", "JD", "Location", "Openings", "Status", "Posted On", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {jobs.map((job, i) => (
                <tr key={job._id} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--primary)]">{job.jobTitle}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{job.department}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{job.recruitingManager?.name || "—"}</td>
                  <td className="px-4 py-3">
                    {job.jobDocument ? (
                      <a
                        href={`${API_BASE.replace("/api", "")}/${job.jobDocument}`}
                        target="_blank"
                        rel="noreferrer"
                        title="View JD"
                        className="inline-flex text-[var(--primary)] hover:opacity-80"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="text-[var(--muted-foreground)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{job.location}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{job.openings}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        job.status === "Open"
                          ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                          : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {new Date(job.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        title="View"
                        onClick={() => {
                          setMode("view");
                          setSelectedJob(job);
                          setOpenModal(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => {
                          setMode("edit");
                          setSelectedJob(job);
                          setOpenModal(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {job.status === "Open" && (
                        <button
                          title="Close opening"
                          onClick={() => closeJob(job._id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--status-critical)]"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {jobs.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                    No job openings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViewEditJobModal
        isOpen={openModal}
        mode={mode}
        job={selectedJob}
        onClose={() => {
          setOpenModal(false);
          fetchJobs();
        }}
      />
    </div>
  );
};

export default JobOpening;
