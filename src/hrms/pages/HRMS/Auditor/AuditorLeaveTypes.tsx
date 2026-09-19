/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarOff, CheckCircle2, RefreshCcw, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface LeaveType {
  _id: string;
  name: string;
  code: string;
  maxDays: number;
  paid: boolean;
  carryForward: boolean;
  isActive: boolean;
}

export default function AuditorLeaveTypes() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/leave-types`, { headers });
        setTypes(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => types.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [types, search]
  );

  const summary = useMemo(
    () => ({
      total: types.length,
      paid: types.filter((t) => t.paid).length,
      carryForward: types.filter((t) => t.carryForward).length,
    }),
    [types]
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
            Leave Types & Policies
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Configured leave categories and their entitlement rules</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search leave type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Leave Types" value={summary.total} icon={CalendarOff} tone="primary" />
        <StatCard label="Paid Leave Types" value={summary.paid} icon={CheckCircle2} tone="good" />
        <StatCard label="Carry Forward Enabled" value={summary.carryForward} icon={RefreshCcw} tone="violet" />
      </div>

      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <CalendarOff className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No leave types match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Max Days / Year</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Carry Forward</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((t) => (
                  <tr key={t._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{t.name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{t.code}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{t.maxDays}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          t.paid
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        )}
                      >
                        {t.paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{t.carryForward ? "Yes" : "No"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          t.isActive
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] text-[var(--status-critical)]"
                        )}
                      >
                        {t.isActive ? "Active" : "Inactive"}
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
