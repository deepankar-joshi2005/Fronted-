import axiosClient from "./axiosClient.js";

export const getReportsOverview = (params) => axiosClient.get("/reports/overview", { params });
export const getCaFirmsReport = (params) => axiosClient.get("/reports/ca-firms", { params });
export const getBusinessClientsReport = (params) => axiosClient.get("/reports/business-clients", { params });
export const getSubscriptionsReport = () => axiosClient.get("/reports/subscriptions");
