/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { IndianRupee, Plane, User, Search, CheckCircle2, Clock, Wallet } from "lucide-react";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";

const API = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

interface Employee {
  _id: string;
  name: string;
}

interface TravelRequest {
  _id: string;
  employee: Employee;
  purpose: string;
  destination: string;
  fromDate: string;
  toDate: string;
  budget: number;
  paymentStatus: "UNPAID" | "PAID";
  status: "APPROVED" | "PAID";
}

/* ================= COMPONENT ================= */

export default function TravelReconciliation() {
  const token = localStorage.getItem("token");

  const [data, setData] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= FETCH DATA ================= */

  const fetchTravelRequests = async () => {
    try {
      const res = await axios.get(`${API}/travel-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const approvedOnly = (res.data || []).filter(
        (t: TravelRequest) => t.status === "APPROVED",
      );

      setData(approvedOnly);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravelRequests();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  /* ================= UPDATE PAYMENT STATUS ================= */

  const updatePaymentStatus = async (
    travelId: string,
    status: "PAID" | "UNPAID",
  ) => {
    try {
      await axios.put(
        `${API}/travel-requests/${travelId}`,
        { paymentStatus: status },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      fetchTravelRequests();
    } catch (error) {
      console.error("Failed to update payment status");
    }
  };

  /* ================= KPIs ================= */

  const kpis = useMemo(() => {
    const total = data.length;
    const paid = data.filter((t) => t.paymentStatus === "PAID").length;
    const unpaid = total - paid;
    const totalBudget = data.reduce((sum, t) => sum + (Number(t.budget) || 0), 0);
    return { total, paid, unpaid, totalBudget };
  }, [data]);

  /* ================= FILTER + PAGINATE ================= */

  const filtered = useMemo(
    () =>
      data.filter(
        (t) =>
          t.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
          t.destination.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  if (loading) return <Loader />;

  /* ================= UI ================= */

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          <Plane className="h-6 w-6 text-[var(--primary)]" />
          Travel Reconciliation
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Finance <span className="mx-1">›</span> Travel Reconciliation
        </p>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Approved Trips"
          value={kpis.total}
          icon={CheckCircle2}
          tone="primary"
          sublabel="Awaiting reconciliation"
        />
        <StatCard
          label="Paid"
          value={kpis.paid}
          icon={Wallet}
          tone="good"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.paid / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard
          label="Unpaid"
          value={kpis.unpaid}
          icon={Clock}
          tone="warning"
          sublabel={`${kpis.total > 0 ? Math.round((kpis.unpaid / kpis.total) * 100) : 0}% of total`}
        />
        <StatCard
          label="Total Approved Budget"
          value={`₹${kpis.totalBudget.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          tone="violet"
          sublabel="Across approved trips"
        />
      </div>

      {/* TOOLBAR */}
      <div className="relative sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee or destination..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* CONTENT */}
      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Plane className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No approved travel requests found</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3 text-center">Dates</th>
                  <th className="px-4 py-3 text-center">Approved Budget</th>
                  <th className="px-4 py-3 text-center">Payment Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginated.map((t) => (
                  <tr key={t._id} className="transition-colors hover:bg-[var(--muted)]">
                    {/* Employee */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                        <span className="font-medium text-[var(--foreground)]">
                          {t.employee?.name || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{t.purpose}</td>

                    {/* Destination */}
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{t.destination}</td>

                    {/* Dates */}
                    <td className="px-4 py-3.5 text-center text-xs text-[var(--muted-foreground)]">
                      <div>
                        {new Date(t.fromDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div>to</div>
                      <div>
                        {new Date(t.toDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1 font-semibold text-[var(--foreground)]">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {Number(t.budget || 0).toLocaleString("en-IN")}
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3.5">
                      <div className="flex justify-center">
                        {t.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--status-good)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-good)]" />
                            PAID
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] py-1 pl-2.5 pr-1.5 text-xs font-medium text-[var(--status-warning)]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--status-warning)]" />
                            <select
                              value={t.paymentStatus}
                              onChange={(e) =>
                                updatePaymentStatus(t._id, e.target.value as "PAID" | "UNPAID")
                              }
                              className="cursor-pointer bg-transparent text-xs font-medium outline-none"
                            >
                              <option value="UNPAID">UNPAID</option>
                              <option value="PAID">PAID</option>
                            </select>
                          </div>
                        )}
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
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="trips"
            />
          </div>
        </div>
      )}
    </div>
  );
}
