/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FileText, ShieldCheck, FileCheck2, FileX2, Search, Download } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;
const IMG_BASE = API.replace("/api", "");

interface Policy {
  _id: string;
  no: number;
  name: string;
  requirements: string[];
  legalReference: string;
  documentUrl?: string;
  documentName?: string;
}

export default function AuditorPolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/hr-policies`, { headers });
        setPolicies(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      policies
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.no - b.no),
    [policies, search]
  );

  const summary = useMemo(
    () => ({
      total: policies.length,
      withDoc: policies.filter((p) => !!p.documentUrl).length,
      withoutDoc: policies.filter((p) => !p.documentUrl).length,
    }),
    [policies]
  );

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Company Policies
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Statutory & HR compliance policies on record
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Total Policies" value={summary.total} icon={ShieldCheck} tone="primary" />
        <StatCard label="Document Attached" value={summary.withDoc} icon={FileCheck2} tone="good" />
        <StatCard label="Missing Document" value={summary.withoutDoc} icon={FileX2} tone="warning" />
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <FileText className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No policies match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Policy Name</th>
                  <th className="px-4 py-3">Legal Reference</th>
                  <th className="px-4 py-3">Requirements</th>
                  <th className="px-4 py-3">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((p) => (
                  <tr key={p._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{p.no}</td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{p.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{p.legalReference || "—"}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {p.requirements?.length ? (
                        <span title={p.requirements.join(", ")}>
                          {p.requirements[0]}
                          {p.requirements.length > 1 && ` +${p.requirements.length - 1} more`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {p.documentUrl ? (
                        <a
                          href={`${IMG_BASE}${p.documentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {p.documentName || "View"}
                        </a>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                          )}
                        >
                          Not uploaded
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
