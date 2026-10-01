import { ROLES } from "./roles.js";

// Copy sourced from the Stakeholder & Role Matrix, Section 2.
export const ROLE_ORDER = [
  ROLES.SUPER_ADMIN,
  ROLES.CA_FIRM_ADMIN,
  ROLES.CA_FIRM_STAFF,
  ROLES.BUSINESS_CLIENT_ADMIN,
  ROLES.BUSINESS_CLIENT_EMPLOYEE,
];

export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: "Manages CA firm license, platform-wide settings, and tenant isolation across every firm.",
  [ROLES.CA_FIRM_ADMIN]:
    "Full control over firm's CRM, Compliance Tool, and Loan Calculator, plus staff and business client management.",
  [ROLES.CA_FIRM_STAFF]:
    "Access to assigned clients, Compliance Tool, and Loan Calculator — with role-based access managed by the firm.",
  [ROLES.BUSINESS_CLIENT_ADMIN]:
    "Manages their own business's HRMS independently — employees, leave, attendance, and payroll inputs.",
  [ROLES.BUSINESS_CLIENT_EMPLOYEE]: "Access to personal HRMS records — leave, profile, apply for leave, download payslip.",
};
