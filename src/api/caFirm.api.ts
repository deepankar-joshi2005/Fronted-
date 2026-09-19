import axiosClient from "./axiosClient.js";

export const listCaFirms = (params) => axiosClient.get("/ca-firms", { params });
export const createCaFirm = (payload) => axiosClient.post("/ca-firms", payload);
export const getCaFirm = (id) => axiosClient.get(`/ca-firms/${id}`);
export const updateCaFirm = (id, payload) => axiosClient.put(`/ca-firms/${id}`, payload);
export const deleteCaFirm = (id) => axiosClient.delete(`/ca-firms/${id}`);
export const updateSubscription = (id, payload) => axiosClient.put(`/ca-firms/${id}/subscription`, payload);
export const resetFirmAdminPassword = (id, payload) =>
  axiosClient.put(`/ca-firms/${id}/reset-admin-password`, payload);

export const getMyFirm = () => axiosClient.get("/ca-firms/me");
export const updateMyFirm = (payload) => axiosClient.put("/ca-firms/me", payload);
export const getMyFirmPlan = () => axiosClient.get("/ca-firms/my-plan");
export const getPlanCatalog = () => axiosClient.get("/ca-firms/plans");
export const createSubscriptionOrder = (payload) => axiosClient.post("/ca-firms/me/subscription/create-order", payload);
export const verifySubscriptionPayment = (payload) => axiosClient.post("/ca-firms/me/subscription/verify-payment", payload);
export const getSubscriptionPaymentHistory = () => axiosClient.get("/ca-firms/me/subscription/history");
