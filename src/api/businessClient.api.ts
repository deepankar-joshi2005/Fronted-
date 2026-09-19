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
