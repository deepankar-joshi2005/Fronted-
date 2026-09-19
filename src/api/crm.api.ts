import axiosClient from "./axiosClient.js";

export const getCrmDashboard = () => axiosClient.get("/crm/dashboard");
export const listLeads = (params) => axiosClient.get("/crm/leads", { params });
export const getLead = (id) => axiosClient.get(`/crm/leads/${id}`);
export const createLead = (payload) => axiosClient.post("/crm/leads", payload);
export const updateLead = (id, payload) => axiosClient.put(`/crm/leads/${id}`, payload);
export const deleteLead = (id) => axiosClient.delete(`/crm/leads/${id}`);
export const addLeadNote = (id, payload) => axiosClient.post(`/crm/leads/${id}/notes`, payload);
