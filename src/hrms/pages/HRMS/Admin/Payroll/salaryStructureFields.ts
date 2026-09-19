/** @format */

// Mirrors EARNING_FIELDS / DEDUCTION_FIELDS in
// CA-Backend/hrms/models/hrms/SalaryStructure.ts, which in turn mirror the
// CA-side DEFAULT_EARNING_COMPONENTS / DEFAULT_DEDUCTION_COMPONENTS
// (CA-Backend/models/ClientPayrollSettings.ts) so both salary structures
// expose the same set of components. Shared by the Add/Edit modal, the list
// page, and the view modal so the three can't drift out of sync.
export const EARNING_COMPONENTS: [string, string][] = [
  ["basic", "Basic Salary"],
  ["dearnessAllowance", "Dearness Allowance"],
  ["retentionAllowance", "Retention Allowance"],
  ["hra", "HRA"],
  ["conveyanceAllowance", "Conveyance Allowance"],
  ["transportAllowance", "Transport Allowance"],
  ["medicalAllowance", "Medical Allowance"],
  ["lta", "LTA"],
  ["specialAllowance", "Special Allowance"],
  ["shiftAllowance", "Shift Allowance"],
  ["nightShiftAllowance", "Night Shift Allowance"],
  ["attendanceAllowance", "Attendance Allowance"],
  ["productionIncentive", "Production Incentive"],
  ["productivityIncentive", "Productivity Incentive"],
  ["overtimeAllowance", "Overtime"],
  ["performanceIncentive", "Performance Incentive"],
  ["salesIncentive", "Sales Incentive"],
  ["bonus", "Bonus"],
  ["arrears", "Arrears"],
  ["leaveEncashmentAllowance", "Leave Encashment"],
  ["otherAllowance", "Other Earnings"],
];

export const DEDUCTION_COMPONENTS: [string, string][] = [
  ["pf", "Employee PF"],
  ["voluntaryPf", "Voluntary PF"],
  ["employeeEsi", "Employee ESI"],
  ["professionalTax", "Professional Tax"],
  ["labourWelfareFund", "Labour Welfare Fund"],
  ["nps", "NPS"],
  ["tds", "Income Tax (TDS)"],
  ["otherStatutoryDeduction", "Other Statutory Deduction"],
  ["advance", "Advance"],
  ["others", "Others"],
];

export const calcTotalEarnings = (s: Record<string, number>) =>
  EARNING_COMPONENTS.reduce((sum, [key]) => sum + (s[key] || 0), 0);

export const calcTotalDeductions = (s: Record<string, number>) =>
  DEDUCTION_COMPONENTS.reduce((sum, [key]) => sum + (s[key] || 0), 0);

export const calcNetSalary = (s: Record<string, number>) =>
  calcTotalEarnings(s) - calcTotalDeductions(s);
