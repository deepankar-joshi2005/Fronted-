/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Users,
  CalendarDays,
  Percent,
  Search,
} from "lucide-react";
import Loader from "../Loader";
import AttendanceDayDetailModal from "../Admin/AttendanceDayDetailModal";
import type { MatrixEntry } from "@/utils/attendanceStatus";
import { STATUS_LEGEND, renderStatusIcon } from "@/utils/attendanceStatus";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;

const PRESENT_STATUSES = new Set(["FULL_DAY", "LATE_FULL_DAY", "HALF_DAY", "LATE_HALF_DAY"]);

interface User {
  _id: string;
  name: string;
  role: string;
}

interface Holiday {
  date: string;
  title: string;
}

const AttendanceLogs = () => {
  const today = new Date();

  const [users, setUsers] = useState<User[]>([]);
  const [matrix, setMatrix] = useState<MatrixEntry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ userId: string; userName: string; date: string } | null>(null);

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  const [loading, setLoading] = useState(false);

  /* ================= DEBOUNCE ================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ================= URL PARAM SYNC ================= */
  useEffect(() => {
    setSearchParams(debouncedSearch ? { search: debouncedSearch } : {});
    setPage(1);
  }, [debouncedSearch, setSearchParams]);

  /* ================= FETCH ATTENDANCE (real, policy-driven matrix — same
     source of truth as SuperAdmin/Manager's attendance report) ================= */
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`${API_BASE}/attendance/all`, {
          params: {
            month,
            year,
            page,
            search: debouncedSearch,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const { users, matrix, totalPages } = res.data;

        setUsers(users || []);
        setMatrix(matrix || []);
        setTotalPages(totalPages || 1);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [month, year, page, debouncedSearch]);

  /* ================= FETCH HOLIDAYS ================= */
  useEffect(() => {
    axios
      .get(`${API_BASE}/holidays`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setHolidays(res.data || []));
  }, []);

  /* ================= DAYS ================= */
  const daysInMonth = useMemo(
    () => new Date(year, month + 1, 0).getDate(),
    [month, year],
  );

  const datesArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isSunday = (day: number) => new Date(year, month, day).getDay() === 0;

  const getHoliday = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;

    return holidays.find(
      (h) => new Date(h.date).toISOString().split("T")[0] === dateStr,
    );
  };

  /* ================= STATUS MATRIX MAP ================= */
  const matrixMap = useMemo(() => {
    const map = new Map<string, MatrixEntry>();

    matrix.forEach((m) => {
      map.set(`${m.userId}_${m.date}`, m);
    });

    return map;
  }, [matrix]);

  const getCellEntry = (userId: string, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;

    return matrixMap.get(`${userId}_${dateStr}`);
  };

  /* ================= KPI SUMMARY (derived from the real, policy-classified matrix) ================= */
  const workingDaysInMonth = useMemo(
    () => datesArray.filter((day) => !isSunday(day) && !getHoliday(day)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [daysInMonth, holidays, month, year],
  );

  const attendanceSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let classified = 0;

    matrix.forEach((entry) => {
      if (PRESENT_STATUSES.has(entry.status)) {
        present += 1;
        classified += 1;
      } else if (entry.status === "ABSENT") {
        absent += 1;
        classified += 1;
      }
    });

    const rate = classified ? Math.round((present / classified) * 100) : 0;

    return { present, absent, rate };
  }, [matrix]);

  /* ================= MONTH CHANGE ================= */
  const handlePrevMonth = () => {
    setPage(1);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    setPage(1);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  /* ================= LOADER ================= */
  if (loading) {
    return (
      <div className="relative min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Attendance Report
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Monthly employee attendance overview, per company policy
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5">
          <button
            onClick={handlePrevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-medium text-[var(--foreground)]">
            {new Date(year, month).toLocaleString("default", {
              month: "long",
            })}{" "}
            {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        <StatCard
          label="Team Members"
          value={users.length}
          icon={Users}
          tone="primary"
          sublabel={`Page ${page} of ${totalPages}`}
        />
        <StatCard
          label="Working Days"
          value={workingDaysInMonth}
          icon={CalendarDays}
          tone="violet"
          sublabel="Excludes Sundays & holidays"
        />
        <StatCard
          label="Present Marks"
          value={attendanceSummary.present}
          icon={CheckCircle}
          tone="good"
          sublabel="Full/Half day, per policy"
        />
        <StatCard
          label="Absent Marks"
          value={attendanceSummary.absent}
          icon={XCircle}
          tone="critical"
          sublabel="Per policy classification"
        />
        <StatCard
          label="Attendance Rate"
          value={`${attendanceSummary.rate}%`}
          icon={Percent}
          tone="warning"
          sublabel="This page, month to date"
        />
      </div>

      {/* ================= SEARCH ================= */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search employee..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="card-premium shadow-premium-sm hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-max border-collapse text-sm">
            <thead className="bg-[var(--muted)]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="sticky left-0 bg-[var(--muted)] px-4 py-3">
                  Employee
                </th>
                <th className="sticky left-[140px] bg-[var(--muted)] px-4 py-3">
                  Role
                </th>

                {datesArray.map((day) => {
                  const holiday = getHoliday(day);
                  const sunday = isSunday(day);

                  return (
                    <th
                      key={day}
                      className={cn(
                        "border-l border-[var(--border)] px-2 py-3 text-center normal-case",
                        sunday && "bg-[color-mix(in_oklab,var(--status-warning)_10%,transparent)] text-[var(--status-warning)]",
                        holiday && "bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)]"
                      )}
                    >
                      {holiday ? holiday.title : sunday ? "Off" : day}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {users.map((user) => (
                <tr key={user._id} className="transition-colors hover:bg-[var(--muted)]">
                  <td className="sticky left-0 bg-[var(--card)] px-4 py-3 font-medium text-[var(--foreground)]">
                    {user.name}
                  </td>
                  <td className="sticky left-[140px] bg-[var(--card)] px-4 py-3 text-[var(--muted-foreground)]">
                    {user.role}
                  </td>

                  {datesArray.map((day) => {
                    const entry = getCellEntry(user._id, day);

                    if (!entry) {
                      return (
                        <td
                          key={day}
                          className="border-l border-[var(--border)] text-center text-[var(--muted-foreground)]"
                        >
                          —
                        </td>
                      );
                    }

                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                    return (
                      <td
                        key={day}
                        className="border-l border-[var(--border)] text-center cursor-pointer transition-colors hover:bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]"
                        title={entry.reason}
                        onClick={() =>
                          setSelectedCell({ userId: user._id, userName: user.name, date: dateStr })
                        }
                      >
                        {renderStatusIcon(entry.status)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={datesArray.length + 2}
                    className="p-6 text-center text-sm text-[var(--muted-foreground)]"
                  >
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ================= LEGEND ================= */}
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border)] px-4 py-3.5 text-xs text-[var(--muted-foreground)]">
          {STATUS_LEGEND.map(({ status, label }) => (
            <span key={status} className="flex items-center gap-1.5">
              {renderStatusIcon(status)}
              {label}
            </span>
          ))}
          <span className="text-[var(--muted-foreground)]/70">
            Click a cell to see full punch-in/out details for that day.
          </span>
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="flex items-center justify-center gap-1 border-t border-[var(--border)] px-4 py-3.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors",
                page === i + 1
                  ? "bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-white"
                  : "text-[var(--foreground)] hover:bg-[var(--muted)]"
              )}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selectedCell && (
        <AttendanceDayDetailModal
          userId={selectedCell.userId}
          userName={selectedCell.userName}
          date={selectedCell.date}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
};

export default AttendanceLogs;
