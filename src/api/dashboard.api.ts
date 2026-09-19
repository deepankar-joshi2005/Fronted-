import axiosClient from "./axiosClient.js";

export const getSuperAdminDashboard = () => axiosClient.get("/dashboard/super-admin");
