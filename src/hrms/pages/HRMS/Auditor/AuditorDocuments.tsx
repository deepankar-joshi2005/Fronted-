/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FileStack, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface DocumentItem {
  _id: string;
  user: { name: string; employeeId?: string; email: string; role: string };
  documentType: string;
  documentName: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

const statusStyles: Record<DocumentItem["status"], string> = {
  VERIFIED: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  PENDING: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  REJECTED: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
};

const statusDot: Record<DocumentItem["status"], string> = {
  VERIFIED: "bg-[var(--status-good)]",
  PENDING: "bg-[var(--status-warning)]",
  REJECTED: "bg-[var(--status-critical)]",
};

const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

export default function AuditorDocuments() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | DocumentItem["status"]>("ALL");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/documents/all`, { headers });
        setDocs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      docs
        .filter((d) => (statusFilter === "ALL" ? true : d.status === statusFilter))
        .filter((d) => d.user?.name?.toLowerCase().includes(search.toLowerCase())),
    [docs, search, statusFilter]
  );

  useEffect(() => setPage(1), [search, statusFilter, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const summary = useMemo(
    () => ({
      total: docs.length,
      verified: docs.filter((d) => d.status === "VERIFIED").length,
      pending: docs.filter((d) => d.status === "PENDING").length,
      rejected: docs.filter((d) => d.status === "REJECTED").length,
    }),
    [docs]
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
            Document Verification
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">KYC & onboarding document compliance across the organization</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-52 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Documents" value={summary.total} icon={FileStack} tone="primary" />
        <StatCard label="Verified" value={summary.verified} icon={CheckCircle2} tone="good" />
        <StatCard label="Pending" value={summary.pending} icon={Clock} tone="warning" />
        <StatCard label="Rejected" value={summary.rejected} icon={XCircle} tone="critical" />
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <FileStack className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No documents match your filters</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Document Type</th>
                  <th className="px-4 py-3">Document Name</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3">Verified On</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginated.map((d) => (
                  <tr key={d._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[var(--foreground)]">{d.user?.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{d.user?.employeeId || d.user?.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{d.documentType}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{d.documentName}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{formatDate(d.createdAt)}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{formatDate(d.verifiedAt)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          statusStyles[d.status]
                        )}
                        title={d.status === "REJECTED" ? d.rejectionReason : undefined}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[d.status])} />
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[var(--border)] px-4 py-3.5">
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="documents"
            />
          </div>
        </div>
      )}
    </div>
  );
}
