import axiosClient from "./axiosClient.js";

export const listCalculations = (params) => axiosClient.get("/loan-calculator/calculations", { params });
export const createCalculation = (payload) => axiosClient.post("/loan-calculator/calculations", payload);
export const deleteCalculation = (id) => axiosClient.delete(`/loan-calculator/calculations/${id}`);
