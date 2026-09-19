import axiosClient from "./axiosClient.js";

export const getBillingSummary = () => axiosClient.get("/billing/summary");
export const listFirmBilling = () => axiosClient.get("/billing/firms");
