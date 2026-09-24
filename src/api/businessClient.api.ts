import axiosClient from "./axiosClient.js";

export const getBusinessClientSummary = () => axiosClient.get("/business-clients/summary");
export const listAllBusinessClients = () => axiosClient.get("/business-clients/all");
export const getMyBusinessClient = () => axiosClient.get("/business-clients/me");
export const getMyHrmsSsoToken = () => axiosClient.get("/business-clients/me/hrms-sso");

export const listMyBusinessClients = (params) => axiosClient.get("/business-clients/mine", { params });
export const getBusinessClient = (id) => axiosClient.get(`/business-clients/mine/${id}`);
export const getClientHrmsSsoToken = (id) => axiosClient.get(`/business-clients/mine/${id}/hrms-sso`);
export const createBusinessClient = (payload) => axiosClient.post("/business-clients/mine", payload);
export const updateBusinessClient = (id, payload) => axiosClient.put(`/business-clients/mine/${id}`, payload);
export const deleteBusinessClient = (id) => axiosClient.delete(`/business-clients/mine/${id}`);
export const resetBusinessClientAdminPassword = (id, payload) =>
  axiosClient.put(`/business-clients/mine/${id}/reset-admin-password`, payload);

// Payroll Management module
export const listPayrollEligibleClients = () => axiosClient.get("/business-clients/mine/payroll-clients");
export const provisionBusinessClientFromLead = (leadId) => axiosClient.post(`/business-clients/mine/from-lead/${leadId}`);
export const upgradeToHrms = (id, payload) => axiosClient.put(`/business-clients/mine/${id}/upgrade-to-hrms`, payload);

// Same combined client list, staff-accessible — used by Personal Finance Tracker.
export const listClientDirectory = () => axiosClient.get("/business-clients/mine/client-directory");

// CA firm-admin/staff — basic employee details for one client (Non-HRMS),
// powers the "View" action on Business Clients / Payroll Management cards.
export const listClientEmployees = (id) => axiosClient.get(`/business-clients/mine/${id}/employees`);

// Business Client Admin's own dashboard (/client-admin) — employee
// onboarding link + the employee master it feeds.
export const getMyEmployeeForm = () => axiosClient.get("/business-clients/me/employee-form");
export const listMyEmployees = () => axiosClient.get("/business-clients/me/employees");
export const createMyEmployee = (payload) => axiosClient.post("/business-clients/me/employees", payload);
export const updateMyEmployee = (employeeId, payload) =>
  axiosClient.put(`/business-clients/me/employees/${employeeId}`, payload);
export const getMySalaryStructureForMonth = (month) => axiosClient.get(`/business-clients/me/salary-structure/${month}`);
