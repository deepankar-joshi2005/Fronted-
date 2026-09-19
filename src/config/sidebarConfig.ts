import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  Wallet,
  LifeBuoy,
  FileClock,
  Settings,
  Contact2,
  ClipboardCheck,
  PiggyBank,
  UserCog,
  CreditCard,
} from "lucide-react";
import { ROLES } from "./roles.js";

// Single source of truth: role -> ordered sidebar modules.
// Paths are relative to the role's own base path (see getRoleBasePath).
export const SIDEBAR_CONFIG = {
  [ROLES.SUPER_ADMIN]: [
    { label: "Dashboard", icon: LayoutDashboard, path: "" },
    { label: "CA Management", icon: Building2, path: "ca-firms" },
    { label: "Business Clients", icon: Briefcase, path: "business-clients" },
    { label: "Users", icon: Users, path: "users" },
    { label: "Billing", icon: Wallet, path: "billing" },
    { label: "Support", icon: LifeBuoy, path: "support" },
    { label: "Audit Logs", icon: FileClock, path: "audit-logs" },
    { label: "Settings", icon: Settings, path: "settings" },
  ],

  // Per Role Matrix Section 3: CA Firm Admin has full control over CRM, Compliance,
  // and Personal Finance Tracker, plus staff and business-client management.
  [ROLES.CA_FIRM_ADMIN]: [
    { label: "Dashboard", icon: LayoutDashboard, path: "" },
    { label: "CRM", icon: Contact2, path: "crm" },
    { label: "Compliance Tool", icon: ClipboardCheck, path: "compliance" },
    { label: "Personal Finance Tracker", icon: PiggyBank, path: "finance-tracker" },
    { label: "Business Clients", icon: Briefcase, path: "clients" },
    { label: "Payroll Management", icon: Wallet, path: "payroll-management" },
    { label: "Staff", icon: UserCog, path: "staff" },
    { label: "Subscription", icon: CreditCard, path: "subscription" },
    { label: "Firm Settings", icon: Settings, path: "firm-settings" },
    { label: "Support", icon: LifeBuoy, path: "support" },
  ],

  // Per Role Matrix Section 3: CA Firm Staff get partial CRM/Compliance (assigned
  // records only) and full Personal Finance Tracker, but no staff/billing/settings management.
  [ROLES.CA_FIRM_STAFF]: [
    { label: "Dashboard", icon: LayoutDashboard, path: "" },
    { label: "CRM", icon: Contact2, path: "crm" },
    { label: "Compliance Tool", icon: ClipboardCheck, path: "compliance" },
    { label: "Personal Finance Tracker", icon: PiggyBank, path: "finance-tracker" },
    { label: "Support", icon: LifeBuoy, path: "support" },
  ],
  [ROLES.BUSINESS_CLIENT_ADMIN]: [{ label: "Dashboard", icon: LayoutDashboard, path: "" }],
  [ROLES.BUSINESS_CLIENT_EMPLOYEE]: [{ label: "Dashboard", icon: LayoutDashboard, path: "" }],
};
