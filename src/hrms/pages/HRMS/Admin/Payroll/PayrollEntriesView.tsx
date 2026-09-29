/** @format */

// Presentational, data-fetching-free "Employee Payroll Entries" block — the
// same month-wise, employee-wise payroll detail HR sees on PayrollRunDetail,
// extracted so it can also be rendered on the public owner-approval page
// (PayrollApprovalPage) without pulling in the authenticated HRMS shell.
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PayrollEntryRow {
  payrollId: string;
  employeeId: string;
  name: string;
  employeeCode?: string;
  status: string;
  basic: number;
  hra: number;
  otherAllowance: number;
  gross: number;
  deduction: number;
  net: number;
  payDays: number;
  lopDays: number;
  fullDays: number;
  lateFullDays: number;
  halfDays: number;
  lateHalfDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  weeklyOffDays: number;
  perDayRate: number;
  overtimeHours: number;
  overtimeAmount: number;
  encashmentBonus: number;
  fixedDeductionAmount: number;
  lopDeductionAmount: number;
}

const AVATAR_COLORS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];

const currency = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const hashCode = (s: string) => s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
const avatarColor = (name: string) => AVATAR_COLORS[hashCode(name) % AVATAR_COLORS.length];

function Metric({
  label,
  value,
  tone = "default",
  bold = false,
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "critical" | "primary";
  bold?: boolean;
}) {
  const toneClass = {
    default: "text-[var(--foreground)]",
    good: "text-[var(--status-good)]",
    critical: "text-[var(--status-critical)]",
    primary: "text-[var(--primary)]",
  }[tone];
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className={cn("text-sm", bold ? "font-bold" : "font-medium", toneClass)}>{value}</p>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1 text-sm",
        bold && "mt-2 border-t border-[var(--border)] pt-2 font-bold text-[var(--foreground)]"
      )}
    >
      <span className={cn(!bold && "text-[var(--muted-foreground)]")}>{label}</span>
      <span className={cn(!bold && "font-medium text-[var(--foreground)]")}>{value}</span>
    </div>
  );
}

const chipTone: Record<string, { bg: string; text: string }> = {
  muted: { bg: "bg-[var(--muted)]", text: "text-[var(--foreground)]" },
  good: { bg: "bg-[color-mix(in_oklab,var(--status-good)_12%,transparent)]", text: "text-[var(--status-good)]" },
  critical: {
    bg: "bg-[color-mix(in_oklab,var(--status-critical)_12%,transparent)]",
    text: "text-[var(--status-critical)]",
  },
  warning: {
    bg: "bg-[color-mix(in_oklab,var(--status-warning)_12%,transparent)]",
    text: "text-[var(--status-warning)]",
  },
  primary: { bg: "bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]", text: "text-[var(--primary)]" },
};

function Chip({ label, value, tone }: { label: string; value: string | number; tone: keyof typeof chipTone }) {
  const t = chipTone[tone];
  return (
    <div className={cn("rounded-lg py-2 text-center", t.bg)}>
      <p className={cn("text-sm font-bold", t.text)}>{value}</p>
      <p className="text-[10px] text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}

export default function PayrollEntriesView({ month, entries }: { month: string; entries: PayrollEntryRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const daysInMonth = useMemo(() => {
    if (!month) return 30;
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m, 0).getDate();
  }, [month]);

  return (
    <div className="card-premium shadow-premium-sm p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Employee Payroll Entries</h2>
        <p className="text-sm text-[var(--muted-foreground)]">{entries.length} employees in this payroll run</p>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {entries.map((e) => {
          const expanded = expandedId === e.payrollId;
          const workingDays = daysInMonth - (e.weeklyOffDays + e.holidayDays);
          const present = e.fullDays + e.lateFullDays + 0.5 * (e.halfDays + e.lateHalfDays);

          return (
            <div key={e.payrollId} className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex min-w-[200px] items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: avatarColor(e.name) }}
                  >
                    {initials(e.name)}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{e.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Basic: {currency(e.basic)}</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-wrap items-center justify-between gap-4">
                  <Metric label="Working Days" value={workingDays} />
                  <Metric label="Present" value={present.toFixed(2)} tone="good" />
                  <Metric label="LOP" value={e.lopDays.toFixed(2)} tone="critical" />
                  <Metric label="Gross Pay" value={currency(e.gross)} tone="good" bold />
                  <Metric label="Deductions" value={currency(e.deduction)} tone="critical" bold />
                  <Metric label="Net Pay" value={currency(e.net)} tone="primary" bold />

                  <button
                    onClick={() => setExpandedId(expanded ? null : e.payrollId)}
                    className="flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
                  >
                    {expanded ? "Less" : "Details"}
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border-l-4 border-l-[var(--status-good)] bg-[var(--muted)] p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--status-good)]">Earnings</p>
                    <Row label="Basic Salary" value={currency(e.basic)} />
                    <Row label="Component Earnings" value={currency(e.hra + e.otherAllowance)} />
                    {e.overtimeAmount > 0 && <Row label="Overtime" value={currency(e.overtimeAmount)} />}
                    {e.encashmentBonus > 0 && <Row label="Leave Encashment" value={currency(e.encashmentBonus)} />}
                    <Row label="Gross Pay" value={currency(e.gross)} bold />
                  </div>

                  <div className="rounded-lg border-l-4 border-l-[var(--status-critical)] bg-[var(--muted)] p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--status-critical)]">
                      Deductions
                    </p>
                    <Row label={`LOP Deduction (${e.lopDays.toFixed(2)} days)`} value={currency(e.lopDeductionAmount)} />
                    <Row label="Component Deductions" value={currency(e.fixedDeductionAmount)} />
                    <Row label="Net Pay" value={currency(e.net)} bold />
                  </div>

                  <div className="lg:col-span-2">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                      Attendance Summary
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      <Chip label="Working Days" value={workingDays} tone="muted" />
                      <Chip label="Present Days" value={present.toFixed(2)} tone="good" />
                      <Chip label="LOP Days" value={e.lopDays.toFixed(2)} tone="critical" />
                      <Chip label="Unpaid Leave" value={e.unpaidLeaveDays} tone="warning" />
                      <Chip label="OT Hours" value={e.overtimeHours} tone="primary" />
                      <Chip label="OT Amount" value={currency(e.overtimeAmount)} tone="primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {entries.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No employee payroll entries for this run yet.
          </p>
        )}
      </div>
    </div>
  );
}
