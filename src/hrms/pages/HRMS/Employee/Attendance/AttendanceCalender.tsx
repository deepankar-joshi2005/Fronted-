/** @format */

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  CalendarDays,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import Loader from "../../Loader";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardPanel } from "@/components/ui/dashboard-panel";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL;

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "HALF_DAY"
  | "LEAVE"
  | "HOLIDAY"
  | "WEEKEND";

interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  totalWorkSeconds: number;
  totalBreakSeconds: number;
  punchIn?: string;
  punchOut?: string;
}

interface Holiday {
  date: string;
  name: string;
  isActive: string;
}

export default function AttendanceCalendar() {
  const token = localStorage.getItem("token");

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const month = currentMonth.toISOString().slice(0, 7);
      const [attendanceRes, holidayRes] = await Promise.all([
        api.get(`/attendance/me?month=${month}`),
        api.get(`/holidays?month=${month}`),
      ]);

      setAttendance(attendanceRes.data || []);
      setHolidays(holidayRes.data || []);
    } catch (err) {
      console.error("Failed to fetch attendance calendar", err);
    } finally {
      setLoading(false);
    }
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const daysInMonth = lastDay.getDate();
  const startWeekDay = firstDay.getDay();

  const getAttendanceByDate = (date: string) =>
    attendance.find((a) => a.date === date);

  const normalizeDate = (date: string | Date) =>
    new Date(date).toISOString().split("T")[0];

  const today = normalizeDate(new Date());

  const isHoliday = (date: string) =>
    holidays.find((h) => normalizeDate(h.date) === date && h.isActive);

  const getDayStatus = (date: string): AttendanceStatus | null => {
    const d = new Date(date);
    if (date > today) return null;
    if (d.getDay() === 0) return "WEEKEND";
    if (isHoliday(date)) return "HOLIDAY";
    const record = getAttendanceByDate(date);
    if (!record) return "ABSENT";
    return record.status || "PRESENT";
  };

  const statusColor: Record<AttendanceStatus, string> = {
    PRESENT: "bg-[color-mix(in_oklab,var(--status-good)_14%,transparent)] border-[color-mix(in_oklab,var(--status-good)_30%,transparent)] text-[var(--status-good)]",
    ABSENT: "bg-[color-mix(in_oklab,var(--status-critical)_14%,transparent)] border-[color-mix(in_oklab,var(--status-critical)_30%,transparent)] text-[var(--status-critical)]",
    HALF_DAY: "bg-[color-mix(in_oklab,var(--status-warning)_14%,transparent)] border-[color-mix(in_oklab,var(--status-warning)_30%,transparent)] text-[var(--status-warning)]",
    LEAVE: "bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] border-[color-mix(in_oklab,var(--primary)_30%,transparent)] text-[var(--primary)]",
    HOLIDAY: "bg-[color-mix(in_oklab,var(--status-violet)_14%,transparent)] border-[color-mix(in_oklab,var(--status-violet)_30%,transparent)] text-[var(--primary)]",
    WEEKEND: "bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]",
  };

  const changeMonth = (step: number) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + step);
    setCurrentMonth(d);
  };

  const presentCount = useMemo(() => attendance.filter((a) => a.status === "PRESENT" || (a.status as string) === "FULL_DAY").length, [attendance]);
  const absentCount = useMemo(() => attendance.filter((a) => a.status === "ABSENT").length, [attendance]);
  const leaveCount = useMemo(() => attendance.filter((a) => a.status === "LEAVE" || (a.status as string) === "ON_LEAVE").length, [attendance]);
  const holidayCount = holidays.length;

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-[var(--primary)]" />
            Attendance Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)] mt-0.5">
            View your monthly attendance sheet, working hours, and holidays.
          </p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Days Present" value={presentCount} icon={CheckCircle} tone="good" />
        <StatCard label="Days Absent" value={absentCount} icon={XCircle} tone="critical" />
        <StatCard label="Leaves Taken" value={leaveCount} icon={Clock} tone="warning" />
        <StatCard label="Holidays & Offs" value={holidayCount} icon={CalendarIcon} tone="violet" />
      </div>

      {/* MONTH NAVIGATOR & CALENDAR GRID */}
      <DashboardPanel
        title="Monthly Attendance Grid"
        subtitle={currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-[var(--foreground)] min-w-[100px] text-center">
              {currentMonth.toLocaleString("default", { month: "short", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto pt-2">
          {/* DAY NAMES */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--muted-foreground)] mb-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* CALENDAR CELLS */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startWeekDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[85px] rounded-xl bg-[var(--muted)]/20 border border-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const status = getDayStatus(date);
              const safeStatus = status ?? "WEEKEND";
              const record = getAttendanceByDate(date);
              const isCurrentDay = date === today;

              return (
                <div
                  key={date}
                  className={cn(
                    "rounded-xl p-2.5 min-h-[85px] border flex flex-col justify-between transition-all",
                    status ? statusColor[safeStatus] : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)]",
                    isCurrentDay && "ring-2 ring-[var(--primary)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{day}</span>
                    {isCurrentDay && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--primary)] text-white">
                        Today
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wider">
                    {status ? status.replace("_", " ") : "—"}
                  </div>

                  {record && record.totalWorkSeconds > 0 && (
                    <div className="mt-1.5 text-[10px] font-medium opacity-90 flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>
                        {Math.floor(record.totalWorkSeconds / 3600)}h {Math.floor((record.totalWorkSeconds % 3600) / 60)}m
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* LEGEND */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold pt-4 border-t border-[var(--border)] text-[var(--foreground)]">
          <span className="flex items-center gap-1.5 text-[var(--status-good)]">
            <CheckCircle className="h-3.5 w-3.5" /> Present
          </span>
          <span className="flex items-center gap-1.5 text-[var(--status-critical)]">
            <XCircle className="h-3.5 w-3.5" /> Absent
          </span>
          <span className="flex items-center gap-1.5 text-[var(--status-warning)]">
            <Clock className="h-3.5 w-3.5" /> Half Day
          </span>
          <span className="flex items-center gap-1.5 text-[var(--primary)]">
            <CalendarIcon className="h-3.5 w-3.5" /> Leave / Off
          </span>
        </div>
      </DashboardPanel>
    </div>
  );
}
