import axiosClient from "./axiosClient.js";

export const listStaff = (params) => axiosClient.get("/staff", { params });
export const createStaff = (payload) => axiosClient.post("/staff", payload);
export const updateStaff = (id, payload) => axiosClient.put(`/staff/${id}`, payload);
export const resetStaffPassword = (id, payload) => axiosClient.put(`/staff/${id}/reset-password`, payload);
