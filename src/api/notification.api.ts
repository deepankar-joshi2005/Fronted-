import axiosClient from "./axiosClient.js";

export const getMyNotifications = () => axiosClient.get("/notifications");
export const markNotificationRead = (id) => axiosClient.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => axiosClient.put("/notifications/read-all");
export const sendNotification = (payload) => axiosClient.post("/notifications", payload);
export const getNotificationPreferences = () => axiosClient.get("/notifications/preferences");
export const updateNotificationPreferences = (payload) => axiosClient.put("/notifications/preferences", payload);
export const getWhatsAppUsage = () => axiosClient.get("/notifications/whatsapp-usage");
