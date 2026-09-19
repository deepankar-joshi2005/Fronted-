/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FileBarChart, IndianRupee, MinusCircle, Wallet, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";

const API = import.meta.env.VITE_API_URL;

interface StatutoryReport {
  _id: string;
  employee: { name: string; email: string };
  month: string;
  pf: number;
  esi: number;
  pt: number;
  tds: number;
  grossSalary: number;
  netSalary: number;
  totalDeduction: number;
}

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

export default function AuditorStatutoryReports() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [reports, setReports] = useState<StatutoryReport[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/statutory-reports`, { headers, params: { month } });
        setReports(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const filtered = useMemo(
    () => reports.filter((r) => r.employee?.name?.toLowerCase().includes(search.toLowerCase())),
    [reports, search]
  );

  useEffect(() => setPage(1), [month, search, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const summary = useMemo(
    () => ({
      total: filtered.length,
      gross: filtered.reduce((s, r) => s + (r.grossSalary || 0), 0),
      deduction: filtered.reduce((s, r) => s + (r.totalDeduction || 0), 0),
      net: filtered.reduce((s, r) => s + (r.netSalary || 0), 0),
    }),
    [filtered]
  );

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  const monthLabel = new Date(`${month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Statutory Reports
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">PF, ESI, Professional Tax & TDS compliance · {monthLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
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
        <StatCard label="Reports Filed" value={summary.total} icon={FileBarChart} tone="primary" sublabel={monthLabel} />
        <StatCard label="Total Gross" value={currency(summary.gross)} icon={IndianRupee} tone="good" />
        <StatCard label="Total Deductions" value={currency(summary.deduction)} icon={MinusCircle} tone="critical" />
        <StatCard label="Total Net" value={currency(summary.net)} icon={Wallet} tone="violet" />
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <FileBarChart className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No statutory reports found for {monthLabel}</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">PF</th>
                  <th className="px-4 py-3">ESI</th>
                  <th className="px-4 py-3">Prof. Tax</th>
                  <th className="px-4 py-3">TDS</th>
                  <th className="px-4 py-3">Gross Salary</th>
                  <th className="px-4 py-3">Total Deduction</th>
                  <th className="px-4 py-3">Net Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginated.map((r) => (
                  <tr key={r._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[var(--foreground)]">{r.employee?.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{r.employee?.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{currency(r.pf)}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{currency(r.esi)}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{currency(r.pt)}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{currency(r.tds)}</td>
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{currency(r.grossSalary)}</td>
                    <td className="px-4 py-3.5 text-[var(--status-critical)]">{currency(r.totalDeduction)}</td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--status-good)]">{currency(r.netSalary)}</td>
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
              itemLabel="reports"
            />
          </div>
        </div>
      )}
    </div>
  );
}
