interface PayslipData {
  userId?: string;
  payrollId?: string;
  name: string;
  month: string;
  gross: number;
  deduction: number;
  net: number;
  payDays: number;
  lopDays: number;
  unearnedSalary?: number;

  daysInMonth?: number;
  fullDays?: number;
  lateFullDays?: number;
  halfDays?: number;
  lateHalfDays?: number;
  absentDays?: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  holidayDays?: number;
  weeklyOffDays?: number;
  daysNotYetOccurred?: number;
  lateOccurrences?: number;
  lateAggregateHalfDayDeductions?: number;
  perDayRate?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  encashmentBonus?: number;
  fixedDeductionAmount?: number;
  lopDeductionAmount?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: PayslipData | null;
  onDownload?: (id: string, month: string) => void;
}

const ViewPayrollModal = ({ isOpen, onClose, data, onDownload }: Props) => {
  if (!isOpen || !data) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-premium-lg animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Payroll Details – {data.month}
            </h2>
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              {data.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {/* Attendance Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
              <p className="mb-1 text-[10px] font-bold uppercase text-[var(--muted-foreground)]">Payable Days</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{data.payDays} Days</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
              <p className="mb-1 text-[10px] font-bold uppercase text-[var(--muted-foreground)]">LOP Days</p>
              <p className="text-lg font-bold text-[var(--status-critical)]">{data.lopDays} Days</p>
            </div>
          </div>

          {/* Attendance Breakdown */}
          {data.daysInMonth !== undefined && (
            <div className="space-y-2">
              <h3 className="border-b border-[var(--border)] pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                Attendance Breakdown ({data.daysInMonth} days in month)
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,var(--status-good)_10%,transparent)] py-2">
                  <p className="text-lg font-bold text-[var(--status-good)]">{data.fullDays ?? 0}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Full Days</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,var(--status-warning)_10%,transparent)] py-2">
                  <p className="text-lg font-bold text-[var(--status-warning)]">
                    {(data.lateFullDays ?? 0) + (data.lateHalfDays ?? 0)}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Late Days</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] py-2">
                  <p className="text-lg font-bold text-[var(--primary)]">
                    {(data.halfDays ?? 0) + (data.lateHalfDays ?? 0)}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Half Days</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] py-2">
                  <p className="text-lg font-bold text-[var(--status-critical)]">{data.absentDays ?? 0}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Absent</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[color-mix(in_oklab,#7C3AED_10%,transparent)] py-2">
                  <p className="text-lg font-bold text-[#7C3AED]">{data.paidLeaveDays ?? 0}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Paid Leave</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] py-2">
                  <p className="text-lg font-bold text-[var(--foreground)]">
                    {(data.holidayDays ?? 0) + (data.weeklyOffDays ?? 0)}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Holiday / Off</p>
                </div>
              </div>
              {!!data.lateAggregateHalfDayDeductions && (
                <p className="text-[11px] italic text-[var(--status-warning)]">
                  {data.lateOccurrences} late day(s) this month → {data.lateAggregateHalfDayDeductions} extra half-day deduction (per policy)
                </p>
              )}
            </div>
          )}

          {/* Financials List */}
          <div className="space-y-3">
            <h3 className="border-b border-[var(--border)] pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              Earnings &amp; Deductions
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-[var(--muted-foreground)]">Gross Earnings</span>
                <span className="font-bold text-[var(--foreground)]">₹{data.gross.toLocaleString()}</span>
              </div>
              {!!data.overtimeAmount && (
                <div className="flex items-center justify-between py-0.5 pl-3 text-xs text-[var(--muted-foreground)]">
                  <span>↳ Includes overtime ({data.overtimeHours}h)</span>
                  <span className="font-medium text-[var(--foreground)]">+₹{data.overtimeAmount.toLocaleString()}</span>
                </div>
              )}
              {!!data.encashmentBonus && (
                <div className="flex items-center justify-between py-0.5 pl-3 text-xs text-[var(--muted-foreground)]">
                  <span>↳ Includes leave encashment</span>
                  <span className="font-medium text-[var(--foreground)]">+₹{data.encashmentBonus.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-[var(--muted-foreground)]">Total Deductions</span>
                <span className="font-bold text-[var(--status-critical)]">-₹{data.deduction.toLocaleString()}</span>
              </div>
              {data.fixedDeductionAmount !== undefined && (
                <div className="flex items-center justify-between py-0.5 pl-3 text-xs text-[var(--muted-foreground)]">
                  <span>↳ Fixed (PF, Tax, TDS, etc.)</span>
                  <span className="font-medium text-[var(--foreground)]">₹{data.fixedDeductionAmount.toLocaleString()}</span>
                </div>
              )}
              {data.lopDeductionAmount !== undefined && (
                <div className="flex items-center justify-between py-0.5 pl-3 text-xs text-[var(--muted-foreground)]">
                  <span>↳ Loss of Pay ({data.lopDays} days @ ₹{data.perDayRate ?? 0}/day)</span>
                  <span className="font-medium text-[var(--foreground)]">₹{data.lopDeductionAmount.toLocaleString()}</span>
                </div>
              )}

              {data.unearnedSalary && data.unearnedSalary > 0 && (
                <div className="flex items-center justify-between py-1 text-[10px] italic text-[var(--muted-foreground)]">
                  <span>(Includes ₹{data.unearnedSalary.toLocaleString()} unearned for future days)</span>
                </div>
              )}

              <div className="border-t border-[var(--border)] pt-3">
                <div className="flex items-center justify-between rounded-lg border border-[var(--primary)]/20 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] px-3 py-3">
                  <span className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">Net Payable</span>
                  <span className="text-xl font-bold text-[var(--primary)]">₹{data.net.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-[var(--muted-foreground)] transition-all hover:bg-[var(--muted)]"
            >
              Close
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-premium-sm transition-all hover:opacity-90"
              onClick={() => {
                if (onDownload && data.payrollId) {
                  onDownload(data.payrollId, data.month);
                } else {
                  alert("Download only available for processed/paid payroll.");
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              PDF Slip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPayrollModal;
