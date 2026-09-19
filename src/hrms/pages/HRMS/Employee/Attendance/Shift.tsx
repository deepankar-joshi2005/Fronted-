/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { CalendarDays, Clock, Sun, Moon, Sunrise, Search } from "lucide-react";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

interface ShiftRow {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  shift: "MORNING" | "EVENING" | "NIGHT";
  createdAt: string;
}

export default function ShiftSchedule() {
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchMyShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyShifts = async () => {
    try {
      const monday = getCurrentWeekMonday();
      const res = await axios.get(`${API_BASE}/shifts/week?start=${monday}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const myShifts = (res.data || []).filter(
        (item: ShiftRow) => item.userId === user._id || item.userId === user.id
      );

      setShifts(myShifts.length ? myShifts : res.data || []);
    } catch (error) {
      console.error("Failed to load shifts", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekMonday = () => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const filteredShifts = useMemo(() =>
    shifts.filter((s) =>
      s.shift?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.date?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [shifts, searchTerm]
  );

  const morningCount = useMemo(() => shifts.filter((s) => s.shift === "MORNING").length, [shifts]);
  const eveningCount = useMemo(() => shifts.filter((s) => s.shift === "EVENING").length, [shifts]);
  const nightCount = useMemo(() => shifts.filter((s) => s.shift === "NIGHT").length, [shifts]);

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-[var(--primary)]" />
            My Shift Schedule
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            Weekly roster and assigned work shift timings for <span className="font-semibold text-[var(--foreground)]">{user.name}</span>.
          </p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shifts Scheduled" value={shifts.length} icon={CalendarDays} tone="primary" />
        <StatCard label="Morning Shifts" value={morningCount} icon={Sunrise} tone="good" />
        <StatCard label="Evening Shifts" value={eveningCount} icon={Sun} tone="warning" />
        <StatCard label="Night Shifts" value={nightCount} icon={Moon} tone="violet" />
      </div>

      {/* TABLE PANEL */}
      <DashboardPanel title="Weekly Shift Roster" subtitle="Your assigned shift schedule for current week">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search shift or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--input)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
            />
          </div>
        </div>

        {filteredShifts.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted-foreground)] text-xs">
            <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40 text-[var(--primary)]" />
            <p className="font-semibold text-sm text-[var(--foreground)]">No shifts assigned for this week</p>
            <p className="mt-1">Check back later for updated shift allocations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--muted)] text-[var(--muted-foreground)] font-semibold border-b border-[var(--border)]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Shift Date</th>
                  <th className="p-3">Assigned Shift</th>
                  <th className="p-3">Shift Timing</th>
                  <th className="p-3">Assigned On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--card)]">
                {filteredShifts.map((row, index) => {
                  const isMorning = row.shift === "MORNING";
                  const isEvening = row.shift === "EVENING";
                  const isNight = row.shift === "NIGHT";

                  return (
                    <tr key={row._id} className="hover:bg-[var(--muted)]/50 transition-colors">
                      <td className="p-3 text-[var(--muted-foreground)]">{index + 1}</td>
                      <td className="p-3 font-semibold text-[var(--foreground)]">
                        {new Date(row.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                            isMorning && "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] text-[var(--status-good)]",
                            isEvening && "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] text-[var(--status-warning)]",
                            isNight && "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-[var(--primary)]",
                            !isMorning && !isEvening && !isNight && "bg-[var(--muted)] text-[var(--muted-foreground)]"
                          )}
                        >
                          {row.shift}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-[var(--foreground)]">
                        {isMorning && "09:00 AM – 06:00 PM"}
                        {isEvening && "02:00 PM – 11:00 PM"}
                        {isNight && "10:00 PM – 07:00 AM"}
                        {!isMorning && !isEvening && !isNight && "Standard Hours"}
                      </td>
                      <td className="p-3 text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(row.createdAt).toLocaleString("en-GB")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>
    </div>
  );
}
