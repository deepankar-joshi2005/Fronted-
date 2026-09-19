/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { IndianRupee, Wallet, MinusCircle, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";

const API = import.meta.env.VITE_API_URL;

interface SalaryStructure {
  _id: string;
  employee: { name: string; employeeId?: string; designationId?: { name: string } };
  basic: number;
  hra: number;
  otherAllowance: number;
  pf: number;
  professionalTax: number;
  tds: number;
  advance: number;
  others: number;
}

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

export default function AuditorSalaryStructures() {
  const [list, setList] = useState<SalaryStructure[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/salary-structures`, { headers });
        setList(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => list.filter((s) => s.employee?.name?.toLowerCase().includes(search.toLowerCase())),
    [list, search]
  );

  useEffect(() => setPage(1), [search, pageSize]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const summary = useMemo(() => {
    const gross = filtered.reduce((s, r) => s + (r.basic || 0) + (r.hra || 0) + (r.otherAllowance || 0), 0);
    const deduction = filtered.reduce(
      (s, r) => s + (r.pf || 0) + (r.professionalTax || 0) + (r.tds || 0) + (r.advance || 0) + (r.others || 0),
      0
    );
    return { total: filtered.length, gross, deduction };
  }, [filtered]);

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
            Salary Structures
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Compensation structure on record for every employee</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Structures on File" value={summary.total} icon={Wallet} tone="primary" />
        <StatCard label="Total Gross (Monthly)" value={currency(summary.gross)} icon={IndianRupee} tone="good" />
        <StatCard label="Total Deductions (Monthly)" value={currency(summary.deduction)} icon={MinusCircle} tone="critical" />
      </div>

      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Wallet className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No salary structures match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Basic</th>
                  <th className="px-4 py-3">HRA</th>
                  <th className="px-4 py-3">Other Allowance</th>
                  <th className="px-4 py-3">PF</th>
                  <th className="px-4 py-3">Prof. Tax</th>
                  <th className="px-4 py-3">TDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginated.map((s) => (
                  <tr key={s._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{s.employee?.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{s.employee?.designationId?.name || "—"}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{currency(s.basic)}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{currency(s.hra)}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{currency(s.otherAllowance)}</td>
                    <td className="px-4 py-3.5 text-[var(--status-critical)]">{currency(s.pf)}</td>
                    <td className="px-4 py-3.5 text-[var(--status-critical)]">{currency(s.professionalTax)}</td>
                    <td className="px-4 py-3.5 text-[var(--status-critical)]">{currency(s.tds)}</td>
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
              itemLabel="structures"
            />
          </div>
        </div>
      )}
    </div>
  );
}
