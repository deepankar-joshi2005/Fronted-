import axiosClient from "./axiosClient.js";

export const listUsers = (params) => axiosClient.get("/users", { params });
export const toggleUserActive = (id) => axiosClient.put(`/users/${id}/toggle-active`);
