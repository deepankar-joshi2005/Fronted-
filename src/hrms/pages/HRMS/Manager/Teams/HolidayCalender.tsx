/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Calendar, Search, Sparkles } from "lucide-react";
import Loader from "../../Loader";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { StatCard } from "@/components/ui/stat-card";

const API_BASE = import.meta.env.VITE_API_URL;

interface Holiday {
  _id: string;
  title: string;
  date: string;
}

export default function HolidayCalendar() {
  const token = localStorage.getItem("token");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await axios.get(`${API_BASE}/holidays`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHolidays(res.data || []);
    } catch (error) {
      console.error("Failed to fetch holidays", error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter(
      (h) =>
        h.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDayName(h.date).toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDate(h.date).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [holidays, searchTerm]);

  const upcomingHoliday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays
      .map((h) => ({ ...h, d: new Date(h.date) }))
      .filter((h) => h.d >= today)
      .sort((a, b) => a.d.getTime() - b.d.getTime())[0];
  }, [holidays]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Holiday Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Official company holiday schedule for the current year.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)] text-xs font-semibold">
            {holidays.length} Total Holidays
          </span>
        </div>
      </div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Holidays Scheduled"
          value={holidays.length}
          icon={Calendar}
          tone="primary"
        />
        <StatCard
          label="Next Upcoming Holiday"
          value={upcomingHoliday ? upcomingHoliday.title : "None upcoming"}
          icon={Sparkles}
          tone="good"
          sublabel={upcomingHoliday ? `${formatDate(upcomingHoliday.date)} (${getDayName(upcomingHoliday.date)})` : "Year schedule clear"}
        />
      </div>

      {/* ================= PANEL ================= */}
      <DashboardPanel
        title="Holiday List"
        subtitle="Full calendar breakdown"
        action={
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search holiday or month..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
            />
          </div>
        }
      >
        {filteredHolidays.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            No holidays found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Holiday Name</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredHolidays.map((h, index) => (
                  <tr key={h._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="p-3 text-center font-mono text-[var(--muted-foreground)]">
                      {index + 1}
                    </td>
                    <td className="p-3 font-semibold text-[var(--foreground)] text-sm">
                      {h.title}
                    </td>
                    <td className="p-3 text-[var(--foreground)] font-medium">
                      {formatDate(h.date)}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-md bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)] font-semibold">
                        {getDayName(h.date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
