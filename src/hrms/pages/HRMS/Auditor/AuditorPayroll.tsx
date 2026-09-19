/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Users, Wallet, TrendingDown, IndianRupee, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface PayrollItem {
  _id: string;
  month: string;
  gross: number;
  deduction: number;
  net: number;
  status: string;
  employee: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

// latest payroll month nikalne ke liye
const getLatestMonth = (data: PayrollItem[]) => {
  if (!data.length) return "";
  return data
    .map((x) => x.month)
    .sort()
    .reverse()[0];
};
const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
};

const formatMonthLabel = (month: string) => {
  if (!month) return "";
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function AuditorPayroll() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);

      // pehle saare payroll lao
      const res = await axios.get(`${API}/payroll`, { headers });
      const list: PayrollItem[] = res.data || [];

      // latest month nikalo
      const latest = getLatestMonth(list);

      if (latest) {
        setMonth(latest); // calendar + heading dono yahin set
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ================= MONTH CHANGE PE FETCH =================
  useEffect(() => {
    if (!month) return;
    fetchPayroll();
  }, [month]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/payroll?month=${month}`, {
        headers,
      });
      setData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, month, pageSize]);

  // 🔢 SUMMARY CALCULATIONS
  const summary = useMemo(() => {
    const totalEmployees = data.length;
    const totalGross = data.reduce((s, x) => s + x.gross, 0);
    const totalDeduction = data.reduce((s, x) => s + x.deduction, 0);
    const totalNet = data.reduce((s, x) => s + x.net, 0);

    return { totalEmployees, totalGross, totalDeduction, totalNet };
  }, [data]);

  // 🔍 SEARCH FILTER
  const filteredData = useMemo(() => {
    return data.filter((x) =>
      x.employee.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Payroll Summary
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Auditor <span className="mx-1">›</span> Payroll Summary
            {month && (
              <>
                <span className="mx-1">·</span>
                {formatMonthLabel(month)}
              </>
            )}
          </p>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          label="Employees"
          value={summary.totalEmployees}
          icon={Users}
          tone="primary"
          sublabel={`Paid in ${formatMonthLabel(month) || "selected month"}`}
        />
        <StatCard
          label="Gross Payroll"
          value={formatCurrency(summary.totalGross)}
          icon={Wallet}
          tone="violet"
          sublabel="Before deductions"
        />
        <StatCard
          label="Deductions"
          value={formatCurrency(summary.totalDeduction)}
          icon={TrendingDown}
          tone="warning"
          sublabel="Total withheld"
        />
        <StatCard
          label="Net Pay"
          value={formatCurrency(summary.totalNet)}
          icon={IndianRupee}
          tone="good"
          sublabel="Total take-home"
        />
      </div>

      {/* ================= TOOLBAR ================= */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* ================= TABLE ================= */}
      {filteredData.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Wallet className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            No payroll data found for this month
          </p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">No.</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Deduction</th>
                  <th className="px-4 py-3">Net Pay</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {paginatedData.map((x, i) => (
                  <tr key={x._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-[var(--foreground)]">{x.employee.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{x.employee.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{x.employee.role}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{formatCurrency(x.gross)}</td>
                    <td className="px-4 py-3.5 text-[var(--status-critical)]">{formatCurrency(x.deduction)}</td>
                    <td className="px-4 py-3.5 font-semibold text-[var(--foreground)]">{formatCurrency(x.net)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          x.status === "Paid"
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            x.status === "Paid" ? "bg-[var(--status-good)]" : "bg-[var(--status-warning)]"
                          )}
                        />
                        {x.status}
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
              total={filteredData.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="payroll records"
            />
          </div>
        </div>
      )}
    </div>
  );
}
