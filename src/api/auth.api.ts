import axiosClient from "./axiosClient.js";

export const registerFirm = (payload) => axiosClient.post("/auth/register-firm", payload);
export const login = (payload) => axiosClient.post("/auth/login", payload);
export const refresh = () => axiosClient.post("/auth/refresh");
export const logout = () => axiosClient.post("/auth/logout");
export const getMe = () => axiosClient.get("/auth/me");
export const changePassword = (payload) => axiosClient.put("/auth/change-password", payload);
export const updateProfile = (payload) => axiosClient.put("/auth/profile", payload);
