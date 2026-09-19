/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Eye, Pencil, Trash2, Plus, Users, CheckCircle2, UserCheck, XCircle } from "lucide-react";
import ViewEditCandidateModal from "./ViewEditCandidateModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";

const API_BASE = import.meta.env.VITE_API_URL;

interface Candidate {
  _id: string;
  name: string;
  email: string;
  jobTitle: string;
  recruitingManager?: string;
  mobile: string;
  resumeUrl: string;
  status: string;
  hiringDate?: string;
  joiningDate?: string;
  createdAt: string;
}

const Candidates = () => {
  const token = localStorage.getItem("token");
  const [list, setList] = useState<Candidate[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [mode, setMode] = useState<"add" | "view" | "edit">("add");

  const [deleteModal, setDeleteModal] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setList(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await axios.patch(
      `${API_BASE}/candidates/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchCandidates();
  };

  const handleDeleteConfirm = async () => {
    if (!candidateToDelete) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_BASE}/candidates/${candidateToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCandidates();
      setDeleteModal(false);
      setCandidateToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totals = useMemo(() => {
    const shortlisted = list.filter((c) => c.status === "Shortlisted").length;
    const hired = list.filter((c) => c.status === "Hired").length;
    const rejected = list.filter((c) => c.status === "Rejected").length;
    return { total: list.length, shortlisted, hired, rejected };
  }, [list]);

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
            Candidates
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Recruitment &gt; Candidates</p>
        </div>

        <button
          onClick={() => {
            setMode("add");
            setSelectedCandidate(null);
            setOpenModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white shadow-premium-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Candidate
        </button>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Candidates" value={totals.total} icon={Users} tone="primary" />
        <StatCard label="Shortlisted" value={totals.shortlisted} icon={UserCheck} tone="warning" />
        <StatCard label="Hired" value={totals.hired} icon={CheckCircle2} tone="good" />
        <StatCard label="Rejected" value={totals.rejected} icon={XCircle} tone="critical" />
      </div>

      {/* TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                {[
                  "No.",
                  "Candidate",
                  "Contact No.",
                  "Email",
                  "Job Title",
                  "Recruiting Manager",
                  "Resume",
                  "Status",
                  "Hiring Date",
                  "Joining Date",
                  "Applied On",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {list.map((c, i) => (
                <tr key={c._id} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.mobile || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.email}</td>
                  <td className="px-4 py-3 font-medium text-[var(--primary)]">{c.jobTitle}</td>
                  <td className="px-4 py-3 text-[var(--foreground)]">{c.recruitingManager || "—"}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`${API_BASE.replace("/api", "")}${c.resumeUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      title="View Resume"
                      className="inline-flex text-[var(--primary)] hover:opacity-80"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      onChange={(e) => updateStatus(c._id, e.target.value)}
                      className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Hired">Hired</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatDate(c.hiringDate)}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{formatDate(c.joiningDate)}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        title="View"
                        onClick={() => {
                          setMode("view");
                          setSelectedCandidate(c);
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
                          setSelectedCandidate(c);
                          setOpenModal(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => {
                          setCandidateToDelete(c._id);
                          setDeleteModal(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--status-critical)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {list.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViewEditCandidateModal
        isOpen={openModal}
        mode={mode}
        candidate={selectedCandidate}
        onClose={() => setOpenModal(false)}
        onSuccess={fetchCandidates}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal}
        loading={deleting}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default Candidates;
