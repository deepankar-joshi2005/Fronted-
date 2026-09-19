/** @format */
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CalendarDays, Sun, CheckCircle2, Search } from "lucide-react";
import Loader from "../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

interface Holiday {
  _id: string;
  title: string;
  date: string;
  day: string;
  isActive: boolean;
}

export default function AuditorHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/holidays`, { headers });
        setHolidays(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      holidays
        .filter((h) => h.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [holidays, search]
  );

  const summary = useMemo(() => {
    const now = new Date();
    return {
      total: holidays.length,
      upcoming: holidays.filter((h) => new Date(h.date) >= now).length,
      active: holidays.filter((h) => h.isActive).length,
    };
  }, [holidays]);

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
            Holiday Calendar
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">Declared holidays used in attendance & payroll calculations</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            placeholder="Search holiday..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard label="Total Holidays" value={summary.total} icon={CalendarDays} tone="primary" />
        <StatCard label="Upcoming" value={summary.upcoming} icon={Sun} tone="warning" />
        <StatCard label="Active" value={summary.active} icon={CheckCircle2} tone="good" />
      </div>

      {filtered.length === 0 ? (
        <div className="card-premium shadow-premium-sm flex flex-col items-center justify-center gap-2 p-16 text-center">
          <CalendarDays className="h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">No holidays match your search</p>
        </div>
      ) : (
        <div className="card-premium shadow-premium-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-[var(--muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  <th className="px-4 py-3">Holiday</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((h) => (
                  <tr key={h._id} className="transition-colors hover:bg-[var(--muted)]">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{h.title}</td>
                    <td className="px-4 py-3.5 text-[var(--foreground)]">{new Date(h.date).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)]">{h.day}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          h.isActive
                            ? "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        )}
                      >
                        {h.isActive ? "Active" : "Inactive"}
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
