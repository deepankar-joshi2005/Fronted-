/** @format */

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "@/pages/HRMS/Alert/Toast";
import { ArrowLeft, Search } from "lucide-react";

const STATUS_OPTIONS = ["In-Training", "Pending_2nd_Attempt", "Passed", "Failed", "Completed_Onboarding"];

const STATUS_BADGE: Record<string, string> = {
  "In-Training": "bg-blue-100 text-blue-700",
  Pending_2nd_Attempt: "bg-amber-100 text-amber-700",
  Passed: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
  Completed_Onboarding: "bg-slate-200 text-slate-700",
};

const selectClass = "h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

interface Profile {
  _id: string;
  user: { _id: string; name: string; email: string; employeeId?: string };
  departmentId?: { _id: string; name: string } | null;
  assignedModules: string[];
  status: string;
  isEligible: boolean;
}

export default function Trainees() {
  const location = useLocation();
  const rolePrefix = location.pathname.split("/")[2] || "SuperAdmin";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([]);
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTrainees = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (departmentId) params.departmentId = departmentId;
    if (search) params.search = search;
    axiosInstance
      .get("/training/trainees", { params })
      .then((res) => setProfiles(res.data))
      .catch(() => toast({ type: "error", title: "Error", message: "Failed to load trainees." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    axiosInstance.get("/departments").then((res) => setDepartments(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchTrainees, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, departmentId, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <Link to={`/hrms/${rolePrefix}/training/modules`} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to Training Modules
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">Trainees</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Review progress and test results, then complete onboarding.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${selectClass} w-full pl-9`}
          />
        </div>
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select className={selectClass} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Modules</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--muted-foreground)]">Loading…</td></tr>
              )}
              {!loading && profiles.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--muted-foreground)]">No trainees found.</td></tr>
              )}
              {!loading && profiles.map((p) => (
                <tr key={p._id} className="hover:bg-[var(--muted)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--foreground)]">{p.user?.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{p.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.departmentId?.name || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{p.assignedModules?.length || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[p.status] || ""}`}>
                      {p.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/hrms/${rolePrefix}/training/trainees/${p._id}`} className="text-xs font-semibold text-[var(--primary)] hover:underline">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
