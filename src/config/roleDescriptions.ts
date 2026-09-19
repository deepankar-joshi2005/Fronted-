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
  [ROLES.SUPER_ADMIN]:
    "Manages CA firm licences, platform-wide settings, and licensing/billing status across every firm.",
  [ROLES.CA_FIRM_ADMIN]:
    "Full control over the firm's CRM, Compliance Tool, and Loan Calculator, plus staff and business-client onboarding.",
  [ROLES.CA_FIRM_STAFF]:
    "Day-to-day user of CRM, Compliance Tool, and Loan Calculator — works on leads and tasks assigned to them.",
  [ROLES.BUSINESS_CLIENT_ADMIN]:
    "Manages their own business's HRMS independently — employees, leave, attendance, and payroll inputs.",
  [ROLES.BUSINESS_CLIENT_EMPLOYEE]: "Self-service HRMS access — view profile, apply for leave, download payslips.",
};
