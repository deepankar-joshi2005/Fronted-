import axiosClient from "./axiosClient.js";

export const getComplianceDashboard = () => axiosClient.get("/compliance/dashboard");
export const listTasks = (params) => axiosClient.get("/compliance/tasks", { params });
export const createTask = (payload) => axiosClient.post("/compliance/tasks", payload);
export const updateTask = (id, payload) => axiosClient.put(`/compliance/tasks/${id}`, payload);
export const deleteTask = (id) => axiosClient.delete(`/compliance/tasks/${id}`);
export const addTaskNote = (id, payload) => axiosClient.post(`/compliance/tasks/${id}/notes`, payload);
export const uploadTaskDocument = (id, formData) => axiosClient.post(`/compliance/tasks/${id}/documents`, formData);
