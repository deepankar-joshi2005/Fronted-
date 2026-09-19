import axiosClient from "./axiosClient.js";

export const listAuditLogs = (params) => axiosClient.get("/audit-logs", { params });
