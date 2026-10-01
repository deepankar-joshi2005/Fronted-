import axiosInstance from "./axiosInstance";

// The signed-in HRMS user's own in-app notifications + per-channel preferences
// (backend: /api/hrms-notifications — hrmsNotificationController.ts).

export interface HrmsNotification {
  _id: string;
  event: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface HrmsNotificationPreferences {
  inApp: boolean;
  email: boolean;
  whatsapp: boolean;
}

export const hrmsNotificationService = {
  list: async (): Promise<{ notifications: HrmsNotification[]; unreadCount: number }> => {
    const { data } = await axiosInstance.get("/hrms-notifications");
    return data.data;
  },
  markRead: (id: string) => axiosInstance.put(`/hrms-notifications/${id}/read`),
  markAllRead: () => axiosInstance.put("/hrms-notifications/read-all"),
  getPreferences: async (): Promise<{ preferences: HrmsNotificationPreferences; whatsappConfigured: boolean; hasMobile: boolean }> => {
    const { data } = await axiosInstance.get("/hrms-notifications/preferences");
    return data.data;
  },
  updatePreferences: (payload: Partial<HrmsNotificationPreferences>) => axiosInstance.put("/hrms-notifications/preferences", payload),
};
