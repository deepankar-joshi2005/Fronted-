/** @format */

import { CheckCircle, XCircle, Clock, MinusCircle, Umbrella, Check, X, Flag, Star, Ban, Minus, AlarmClock, CornerUpLeft, Timer } from "lucide-react";

export interface MatrixEntry {
  userId: string;
  date: string;
  status: string;
  isLate: boolean;
  lateByMinutes: number;
  workedHours: number;
  overtimeHours?: number;
  earlyExitByMinutes?: number;
  reason: string;
}

/* ================= LEGACY (kept for existing consumers — Auditor logs etc.) ================= */

export const STATUS_LEGEND: { status: string; label: string }[] = [
  { status: "FULL_DAY", label: "Full Day" },
  { status: "LATE_FULL_DAY", label: "Late (Full Day)" },
  { status: "HALF_DAY", label: "Half Day" },
  { status: "LATE_HALF_DAY", label: "Late (Half Day)" },
  { status: "ABSENT", label: "Absent" },
  { status: "ON_LEAVE", label: "On Leave" },
];

export const renderStatusIcon = (status: string) => {
  switch (status) {
    case "FULL_DAY":
      return <CheckCircle className="text-[var(--status-good)] mx-auto" size={18} />;
    case "LATE_FULL_DAY":
      return <Clock className="text-[var(--status-warning)] mx-auto" size={18} />;
    case "HALF_DAY":
      return <MinusCircle className="text-[var(--primary)] mx-auto" size={18} />;
    case "LATE_HALF_DAY":
      return <MinusCircle className="text-[var(--status-warning)] mx-auto" size={18} />;
    case "ABSENT":
      return <XCircle className="text-[var(--status-critical)] mx-auto" size={18} />;
    case "ON_LEAVE":
      return <Umbrella className="text-[#7C3AED] mx-auto" size={16} />;
    case "HOLIDAY":
      return <Star className="text-[var(--status-warning)] mx-auto" size={16} />;
    case "WEEKLY_OFF":
      return <Ban className="text-[var(--muted-foreground)] mx-auto" size={16} />;
    default:
      return <span className="text-[var(--muted-foreground)]">—</span>;
  }
};

/* ================= FULL RICH LEGEND + COMPOUND CELL RENDERING ================= */
/* Used by the SuperAdmin Attendance Records and Manager Team Attendance
   matrices — both share this exact rendering so the two stay visually
   identical. "Late" / "Early Departure" / "Overtime" are drawn as a small
   badge on top of the day's main icon rather than a separate status, since
   they're real per-day flags (isLate/earlyExitByMinutes/overtimeHours) that
   can co-occur with Present/Half Day. */

export const FULL_STATUS_LEGEND: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: "PRESENT", label: "Present", icon: <Check className="text-[var(--status-good)]" size={16} strokeWidth={3} /> },
  { key: "ABSENT", label: "Absent", icon: <X className="text-[var(--status-critical)]" size={16} strokeWidth={3} /> },
  { key: "HALF_DAY", label: "Half Day", icon: <span className="text-[var(--status-warning)] font-bold text-sm">½</span> },
  { key: "ON_LEAVE", label: "On Leave", icon: <Flag className="text-[#DB2777] fill-[#DB2777]/20" size={15} /> },
  { key: "HOLIDAY", label: "Holiday", icon: <Star className="text-[var(--status-warning)] fill-[var(--status-warning)]/30" size={15} /> },
  { key: "WEEKLY_OFF", label: "Day Off", icon: <Ban className="text-[var(--muted-foreground)]" size={15} /> },
  { key: "FUTURE", label: "Future", icon: <Minus className="text-[var(--muted-foreground)] opacity-50" size={15} /> },
  { key: "LATE", label: "Late", icon: <AlarmClock className="text-[var(--status-warning)]" size={14} /> },
  { key: "EARLY_DEPARTURE", label: "Early Departure", icon: <CornerUpLeft className="text-[var(--status-critical)]" size={14} /> },
  { key: "OVERTIME", label: "Overtime", icon: <Timer className="text-[var(--primary)]" size={14} /> },
];

function mainCellIcon(status: string) {
  switch (status) {
    case "FULL_DAY":
    case "LATE_FULL_DAY":
      return <Check className="text-[var(--status-good)]" size={16} strokeWidth={3} />;
    case "HALF_DAY":
    case "LATE_HALF_DAY":
      return <span className="text-[var(--status-warning)] font-bold text-sm leading-none">½</span>;
    case "ABSENT":
      return <X className="text-[var(--status-critical)]" size={16} strokeWidth={3} />;
    case "ON_LEAVE":
      return <Flag className="text-[#DB2777] fill-[#DB2777]/20" size={15} />;
    case "HOLIDAY":
      return <Star className="text-[var(--status-warning)] fill-[var(--status-warning)]/30" size={15} />;
    case "WEEKLY_OFF":
      return <Ban className="text-[var(--muted-foreground)]" size={15} />;
    default:
      return <Minus className="text-[var(--muted-foreground)] opacity-50" size={15} />;
  }
}

/** Compound cell: main status icon + at most one small corner badge for
 * late arrival / early departure / overtime (priority in that order, since
 * that's the most operationally relevant flag when more than one applies). */
export function renderCellIcon(entry: MatrixEntry | undefined) {
  const status = entry?.status;
  const main = mainCellIcon(status || "FUTURE");

  let badge: React.ReactNode = null;
  if (entry?.isLate) {
    badge = <AlarmClock className="text-white" size={9} />;
  } else if ((entry?.earlyExitByMinutes ?? 0) > 0) {
    badge = <CornerUpLeft className="text-white" size={9} />;
  } else if ((entry?.overtimeHours ?? 0) > 0) {
    badge = <Timer className="text-white" size={9} />;
  }

  const badgeBg = entry?.isLate
    ? "bg-[var(--status-warning)]"
    : (entry?.earlyExitByMinutes ?? 0) > 0
    ? "bg-[var(--status-critical)]"
    : "bg-[var(--primary)]";

  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      {main}
      {badge && (
        <span
          className={`absolute -bottom-1 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-1 ring-[var(--card)] ${badgeBg}`}
        >
          {badge}
        </span>
      )}
    </span>
  );
}

/** Days present-equivalent / working days elapsed so far this month, from
 * the already-fetched matrix — no extra API call. Weekly-offs and holidays
 * are excluded from the denominator since they were never workable days. */
export function computeUserTotal(matrix: MatrixEntry[], userId: string) {
  let present = 0;
  let workingDays = 0;

  for (const m of matrix) {
    if (m.userId !== userId) continue;
    if (m.status === "WEEKLY_OFF" || m.status === "HOLIDAY") continue;
    workingDays += 1;
    if (m.status === "FULL_DAY" || m.status === "LATE_FULL_DAY") present += 1;
    else if (m.status === "HALF_DAY" || m.status === "LATE_HALF_DAY") present += 0.5;
  }

  return { present, workingDays };
}
