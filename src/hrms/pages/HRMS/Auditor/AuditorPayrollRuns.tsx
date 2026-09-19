/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { PlayCircle, Users, IndianRupee, Wallet, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

type RunStatus = "Draft" | "Processing" | "Completed" | "Cancelled";

interface PayrollRunRow {
  _id: string;
  month: string;
  title: string;
  frequency: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate?: string;
  status: RunStatus;
  employees: number;
  gross: number;
  net: number;
}

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const statusTone: Record<RunStatus, string> = {
  Draft: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  Processing: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
  Completed: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
  Cancelled: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]",
};

export default function AuditorPayrollRuns() {
  const [runs, setRuns] = useState<PayrollRunRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/payroll/runs`, { headers });
        setRuns(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => runs.filter((r) => r.title.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.month < b.month ? 1 : -1)),
    [runs, search]
  );

  const summary = useMemo(
    () => ({
      totalRuns: runs.length,
      completed: runs.filter((r) => r.status === "Completed").length,
      totalNet: runs.reduce((s, r) => s + (r.net || 0), 0),
    }),
    [runs]
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
            Payroll Runs
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Every payroll run processed for the organization</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Total Runs" value={summary.totalRuns} icon={PlayCircle} tone="primary" />
        <StatCard label="Completed Runs" value={summary.completed} icon={Users} tone="good" />
        <StatCard label="Total Net Paid" value={currency(summary.totalNet)} icon={Wallet} tone="violet" />
      </div>

      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <IndianRupee className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No payroll runs match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Pay Period</th>
                  <th className="px-4 py-3">Pay Date</th>
                  <th className="px-4 py-3">Employees</th>
                  <th className="px-4 py-3">Gross Pay</th>
                  <th className="px-4 py-3">Net Pay</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((r) => (
                  <tr key={r._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{r.title}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {r.payPeriodStart} → {r.payPeriodEnd}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{r.payDate || "Not set"}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{r.employees}</td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--status-good)]">{currency(r.gross)}</td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--primary)]">{currency(r.net)}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusTone[r.status])}>
                        {r.status}
                      </span>
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
