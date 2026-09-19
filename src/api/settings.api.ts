import axiosClient from "./axiosClient.js";

export const getSettings = () => axiosClient.get("/settings");
export const updateSettings = (payload) => axiosClient.put("/settings", payload);
