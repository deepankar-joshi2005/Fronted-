// Per the Stakeholder & Role Matrix: 3 tiers, 5 fixed roles.
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  CA_FIRM_ADMIN: "ca_firm_admin",
  CA_FIRM_STAFF: "ca_firm_staff",
  BUSINESS_CLIENT_ADMIN: "business_client_admin",
  BUSINESS_CLIENT_EMPLOYEE: "business_client_employee",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.CA_FIRM_ADMIN]: "CA Firm Admin",
  [ROLES.CA_FIRM_STAFF]: "CA Firm Staff",
  [ROLES.BUSINESS_CLIENT_ADMIN]: "Business Client Admin",
  [ROLES.BUSINESS_CLIENT_EMPLOYEE]: "Employee",
};

export const ROLE_TIER = {
  [ROLES.SUPER_ADMIN]: 1,
  [ROLES.CA_FIRM_ADMIN]: 2,
  [ROLES.CA_FIRM_STAFF]: 2,
  [ROLES.BUSINESS_CLIENT_ADMIN]: 3,
  [ROLES.BUSINESS_CLIENT_EMPLOYEE]: 3,
};

// URL segment each role's dashboard lives under, e.g. /super-admin, /firm-admin.
export const ROLE_BASE_PATHS = {
  [ROLES.SUPER_ADMIN]: "super-admin",
  [ROLES.CA_FIRM_ADMIN]: "firm-admin",
  [ROLES.CA_FIRM_STAFF]: "firm-staff",
  [ROLES.BUSINESS_CLIENT_ADMIN]: "client-admin",
  [ROLES.BUSINESS_CLIENT_EMPLOYEE]: "employee",
};

export function getRoleBasePath(role) {
  if (!role) return "/login";
  return `/${ROLE_BASE_PATHS[role] || role}`;
}
