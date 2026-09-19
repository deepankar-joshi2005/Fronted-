/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plane, Search, Eye, Clock, CheckCircle2, XCircle } from "lucide-react";
import Loader from "../../Loader";
import { toast } from "../../Alert/Toast";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)]",
    text: "text-[var(--status-warning)]",
    dot: "bg-[var(--status-warning)]",
  },
  APPROVED: {
    bg: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)]",
    text: "text-[var(--status-good)]",
    dot: "bg-[var(--status-good)]",
  },
  REJECTED: {
    bg: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)]",
    text: "text-[var(--status-critical)]",
    dot: "bg-[var(--status-critical)]",
  },
};

export default function FinanceTravelRequest() {
  const [requests, setRequests] = useState<any[]>([]);
  const [viewData, setViewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const token = localStorage.getItem("token");

  const fetchRequests = async () => {
    const res = await axios.get(`${API_BASE}/travel-requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setRequests(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await axios.patch(
        `${API_BASE}/travel-requests/manager/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast({
        type: "success",
        title: "Travel Request Updated",
        message:
          res?.data?.message ||
          `Travel request has been ${status.toLowerCase()} successfully.`,
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Update Failed",
        message:
          error?.response?.data?.message ||
          "Unable to update travel request status. Please try again.",
      });
    }
  };

  /* ================= KPIs ================= */

  const kpis = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const approved = requests.filter((r) => r.status === "APPROVED").length;
    const rejected = requests.filter((r) => r.status === "REJECTED").length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const pct = (n: number) => (kpis.total > 0 ? Math.round((n / kpis.total) * 100) : 0);

  /* ================= FILTER + PAGINATE ================= */

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.employee?.name?.toLowerCase().includes(q) ||
        r.purpose?.toLowerCase().includes(q) ||
        r.destination?.toLowerCase().includes(q),
    );
  }, [requests, search]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Travel Requests
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Finance <span className="mx-1">›</span> Travel Requests
        </p>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Total Requests"
          value={kpis.total}
          icon={Plane}
          tone="primary"
          sublabel="All travel requests"
        />
        <StatCard
          label="Pending"
          value={kpis.pending}
          icon={Clock}
          tone="warning"
          sublabel={`${pct(kpis.pending)}% of total`}
        />
        <StatCard
          label="Approved"
          value={kpis.approved}
          icon={CheckCircle2}
          tone="good"
          sublabel={`${pct(kpis.approved)}% of total`}
        />
        <StatCard
          label="Rejected"
          value={kpis.rejected}
          icon={XCircle}
          tone="critical"
          sublabel={`${pct(kpis.rejected)}% of total`}
        />
      </div>

      {/* TOOLBAR */}
      <div className="relative sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee, purpose or destination..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* CONTENT */}
      {filteredRequests.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Plane className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No travel requests found</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedRequests.map((r) => (
                  <tr key={r._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">
                      {r.employee?.name || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{r.purpose}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{r.destination}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(r.fromDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {new Date(r.toDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--foreground)]">
                      ₹{Number(r.budget || 0).toLocaleString("en-IN")}
                    </td>

                    {/* STATUS DROPDOWN */}
                    <td className="px-4 py-3.5">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-medium",
                          STATUS_META[r.status]?.bg,
                          STATUS_META[r.status]?.text,
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_META[r.status]?.dot)}
                        />
                        <select
                          value={r.status}
                          onChange={(e) => updateStatus(r._id, e.target.value)}
                          className="cursor-pointer bg-transparent text-xs font-medium outline-none"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </td>

                    {/* VIEW */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          title="View"
                          onClick={() => setViewData(r)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
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
              total={filteredRequests.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="requests"
            />
          </div>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
      {viewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewData(null)}
        >
          <div
            className="card-premium shadow-premium-sm w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Travel Request Details</h3>

            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-foreground)]">Employee</span>
                <span className="font-medium text-[var(--foreground)]">{viewData.employee?.name}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-foreground)]">Purpose</span>
                <span className="font-medium text-[var(--foreground)]">{viewData.purpose}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-foreground)]">Destination</span>
                <span className="font-medium text-[var(--foreground)]">{viewData.destination}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-foreground)]">From</span>
                <span className="font-medium text-[var(--foreground)]">
                  {new Date(viewData.fromDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-foreground)]">To</span>
                <span className="font-medium text-[var(--foreground)]">
                  {new Date(viewData.toDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-foreground)]">Budget</span>
                <span className="font-medium text-[var(--foreground)]">
                  ₹{Number(viewData.budget || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--muted-foreground)]">Remarks</span>
                <span className="font-medium text-[var(--foreground)]">{viewData.remarks || "-"}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setViewData(null)}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
