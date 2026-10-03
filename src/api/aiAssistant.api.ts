import axiosClient from "./axiosClient.js";

export const sendMessage = (message) => axiosClient.post("/ai-assistant/message", { message });
export const getHistory = () => axiosClient.get("/ai-assistant/history");
export const clearHistory = () => axiosClient.delete("/ai-assistant/history");
