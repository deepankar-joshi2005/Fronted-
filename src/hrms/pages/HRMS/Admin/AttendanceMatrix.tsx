/** @format */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Filter } from "lucide-react";
import Loader from "../Loader";
import AttendanceDayDetailModal from "./AttendanceDayDetailModal";
import type { MatrixEntry } from "@/utils/attendanceStatus";
import { FULL_STATUS_LEGEND, renderCellIcon, computeUserTotal } from "@/utils/attendanceStatus";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL;
const IMG_BASE = API_BASE.replace("/api", "");

interface User {
  _id: string;
  name: string;
  role: string;
  employeeId?: string;
  profilePicture?: string;
  designationId?: { name: string };
}

interface Holiday {
  date: string;
  title: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AVATAR_COLORS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];
const hashCode = (s: string) => s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
const avatarColor = (name: string) => AVATAR_COLORS[hashCode(name) % AVATAR_COLORS.length];
const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";

interface AttendanceMatrixProps {
  title: string;
  subtitle: string;
  fetchUrl: string;
  /** Server-side pagination (used for the SuperAdmin-wide roster; a manager's
   * own team is small enough to always fetch in full). */
  paginated?: boolean;
}

const AttendanceMatrix = ({ title, subtitle, fetchUrl, paginated = false }: AttendanceMatrixProps) => {
  const today = new Date();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [users, setUsers] = useState<User[]>([]);
  const [matrix, setMatrix] = useState<MatrixEntry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [employeeFilter, setEmployeeFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedCell, setSelectedCell] = useState<{ userId: string; userName: string; date: string } | null>(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params: any = { month, year };
        if (paginated) params.page = page;

        const res = await axios.get(fetchUrl, { params, headers });
        setUsers(res.data.users || []);
        setMatrix(res.data.matrix || []);
        if (paginated) setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Failed to load attendance matrix", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl, month, year, page]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/holidays`, { headers })
      .then((res) => setHolidays(res.data || []))
      .catch((err) => console.error(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= DAYS ================= */
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [month, year]);
  const datesArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const dateStrFor = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const dayName = (day: number) => new Date(year, month, day).toLocaleDateString("en-US", { weekday: "short" });

  const getHoliday = (day: number) => {
    const dateStr = dateStrFor(day);
    return holidays.find((h) => new Date(h.date).toISOString().split("T")[0] === dateStr);
  };

  /* ================= MATRIX MAP ================= */
  const matrixMap = useMemo(() => {
    const map = new Map<string, MatrixEntry>();
    matrix.forEach((m) => map.set(`${m.userId}_${m.date}`, m));
    return map;
  }, [matrix]);

  const getCellEntry = (userId: string, day: number) => matrixMap.get(`${userId}_${dateStrFor(day)}`);

  const filteredUsers = useMemo(
    () => (employeeFilter ? users.filter((u) => u._id === employeeFilter) : users),
    [users, employeeFilter]
  );

  /* ================= RESET FILTERS ("Filters" button) ================= */
  const resetFilters = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    setEmployeeFilter("");
    setPage(1);
  };

  if (loading) return <Loader />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">{title}</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>
      </div>

      {/* FILTER BAR */}
      <div className="card-premium shadow-premium-sm p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          >
            <option value="">All Employees</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          >
            {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={resetFilters}
            title="Reset filters"
            className="ml-auto flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--foreground)]">
            Month: {MONTH_NAMES[month]}
          </span>
          <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-medium text-[var(--foreground)]">
            Year: {year}
          </span>
        </div>
      </div>

      {/* LEGEND */}
      <div className="card-premium shadow-premium-sm p-4 sm:p-5">
        <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
          {FULL_STATUS_LEGEND.map(({ key, label, icon }) => (
            <span key={key} className="flex items-center gap-1.5 text-sm text-[var(--foreground)]">
              <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* MATRIX TABLE */}
      <div className="card-premium shadow-premium-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--muted)]">
                <th
                  colSpan={2}
                  className="sticky left-0 z-20 bg-[var(--muted)] border-b border-r border-[var(--border)]"
                />
                <th
                  colSpan={datesArray.length}
                  className="border-b border-[var(--border)] px-3 py-2 text-center text-sm font-bold text-[var(--foreground)]"
                >
                  {MONTH_NAMES[month]} {year}
                </th>
                <th className="sticky right-0 z-20 bg-[var(--muted)] border-b border-l border-[var(--border)]" />
              </tr>
              <tr className="bg-[var(--muted)] text-[var(--muted-foreground)]">
                <th className="sticky left-0 z-20 bg-[var(--muted)] px-3 py-2 text-left font-semibold border-b border-r border-[var(--border)] min-w-[220px]">
                  Employee
                </th>
                {datesArray.map((day) => {
                  const holiday = getHoliday(day);
                  const sunday = dayName(day) === "Sun";
                  return (
                    <th
                      key={day}
                      className={cn(
                        "px-1.5 py-2 text-center font-semibold border-b border-[var(--border)] min-w-[38px]",
                        sunday && "bg-[color-mix(in_oklab,var(--muted)_60%,transparent)]",
                        holiday && "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]"
                      )}
                    >
                      <div className="text-[13px] leading-none">{day}</div>
                      <div className="text-[10px] font-normal opacity-70 mt-0.5">{dayName(day)}</div>
                    </th>
                  );
                })}
                <th className="sticky right-0 z-20 bg-[var(--muted)] px-3 py-2 text-center font-semibold border-b border-l border-[var(--border)] min-w-[70px]">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={datesArray.length + 2} className="py-10 text-center text-[var(--muted-foreground)]">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const { present, workingDays } = computeUserTotal(matrix, user._id);
                  const avatarSrc = user.profilePicture
                    ? user.profilePicture.startsWith("http")
                      ? user.profilePicture
                      : `${IMG_BASE}${user.profilePicture}`
                    : null;

                  return (
                    <tr key={user._id} className="hover:bg-[var(--muted)]/40 transition-colors">
                      <td className="sticky left-0 z-10 bg-[var(--card)] px-3 py-2 border-r border-[var(--border)]">
                        <div className="flex items-center gap-2.5">
                          {avatarSrc ? (
                            <img src={avatarSrc} alt={user.name} className="h-9 w-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: avatarColor(user.name) }}
                            >
                              {initials(user.name)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user.name}</p>
                            <p className="truncate text-xs text-[var(--muted-foreground)] capitalize">
                              {user.designationId?.name || user.role}
                            </p>
                          </div>
                        </div>
                      </td>

                      {datesArray.map((day) => {
                        const entry = getCellEntry(user._id, day);
                        return (
                          <td
                            key={day}
                            className="text-center py-2 cursor-pointer hover:bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] transition-colors"
                            title={entry?.reason || "Future"}
                            onClick={() =>
                              entry &&
                              setSelectedCell({ userId: user._id, userName: user.name, date: dateStrFor(day) })
                            }
                          >
                            <span className="inline-flex">{renderCellIcon(entry)}</span>
                          </td>
                        );
                      })}

                      <td className="sticky right-0 z-10 bg-[var(--card)] px-3 py-2 text-center border-l border-[var(--border)] font-bold text-[var(--foreground)]">
                        {present}
                        <span className="text-[var(--muted-foreground)] font-normal">/{workingDays}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {paginated && totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-[var(--border)]">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  "px-3 py-1 rounded-md border border-[var(--border)] text-sm",
                  page === i + 1
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
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

export default AttendanceMatrix;
