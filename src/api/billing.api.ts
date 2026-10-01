import axiosClient from "./axiosClient.js";

export const getBillingSummary = () => axiosClient.get("/billing/summary");
export const listFirmBilling = (params) => axiosClient.get("/billing/firms", { params });
