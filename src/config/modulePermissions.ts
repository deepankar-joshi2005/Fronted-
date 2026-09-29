// Modules a ca_firm_admin can grant/restrict for ca_firm_staff (see sidebarConfig.ts's
// [ROLES.CA_FIRM_STAFF] entries with a `module` key, and User.ts::STAFF_MODULES on the backend).
export const STAFF_MODULES = [
  { key: "crm", label: "CRM" },
  { key: "compliance", label: "Compliance Tool" },
  { key: "financeTracker", label: "Personal Finance Tracker" },
];

// Mirrors STAFF_MODULE_DEFAULTS in CA-Backend/models/User.ts — used to pre-fill the Add
// staff form so a newly created staff member's default access matches what the backend
// will actually apply if permissions are omitted.
export const DEFAULT_MODULE_PERMISSIONS = {
  crm: { enabled: true, add: true, edit: true, delete: false },
  compliance: { enabled: true, add: true, edit: false, delete: false },
  financeTracker: { enabled: true, add: true, edit: true, delete: true },
};
