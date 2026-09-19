/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Receipt, Wallet, CheckCircle2, Send, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface Payslip {
  _id: string;
  user: { name: string; employeeId?: string };
  month: string;
  netSalary: number;
  status: "Generated" | "Sent" | "Viewed" | "Downloaded";
}

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const statusStyles: Record<Payslip["status"], string> = {
  Generated: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]",
  Sent: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  Viewed: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  Downloaded: "bg-[color-mix(in_oklab,#7C3AED_14%,transparent)] text-[#7C3AED]",
};

export default function AuditorPayslips() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/payslips`, { headers });
        setPayslips(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => payslips.filter((p) => p.user?.name?.toLowerCase().includes(search.toLowerCase())),
    [payslips, search]
  );

  useEffect(() => setPage(1), [search, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const summary = useMemo(
    () => ({
      total: payslips.length,
      downloaded: payslips.filter((p) => p.status === "Downloaded").length,
      sent: payslips.filter((p) => p.status === "Sent").length,
      totalNet: payslips.reduce((s, p) => s + (p.netSalary || 0), 0),
    }),
    [payslips]
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Payslips
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Every payslip generated across the organization</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard label="Total Payslips" value={summary.total} icon={Receipt} tone="primary" />
        <StatCard label="Downloaded" value={summary.downloaded} icon={CheckCircle2} tone="good" />
        <StatCard label="Sent" value={summary.sent} icon={Send} tone="warning" />
        <StatCard label="Total Net Paid" value={currency(summary.totalNet)} icon={Wallet} tone="violet" />
      </div>

      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Receipt className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No payslips match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Net Salary</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginated.map((p) => (
                  <tr key={p._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{p.user?.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{p.month}</td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--status-good)]">{currency(p.netSalary)}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusStyles[p.status])}>
                        {p.status}
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
              itemLabel="payslips"
            />
          </div>
        </div>
      )}
    </div>
  );
}
