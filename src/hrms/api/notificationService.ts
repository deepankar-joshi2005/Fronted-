import axiosInstance from './axiosInstance';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  sentBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  readBy?: string[];
  relatedAssessment?: {
    _id: string;
    title: string;
  };
}

export interface NotificationCounts {
  unreadNotifications: number;
  pendingRecommendations: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  type?: string;
  priority?: string;
  isRead?: boolean;
}

export const notificationService = {
  // Get mentor notifications
  getMentorNotifications: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    priority?: string;
  }) => {
    const response = await axiosInstance.get('/notifications/mentor', { params });
    return response.data;
  },

  // Get notification counts
  getNotificationCounts: async () => {
    const response = await axiosInstance.get('/notifications/counts');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await axiosInstance.post(`/notifications/mentor/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axiosInstance.post('/notifications/mentor/mark-all-read');
    return response.data;
  },

  // Mark a specific recommendation as viewed
  markRecommendationAsViewed: async (recommendationId: string) => {
    const response = await axiosInstance.post(`/notifications/mentor/recommendation/${recommendationId}/viewed`);
    return response.data;
  },

  // Get student notifications
  getStudentNotifications: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    priority?: string;
  }) => {
    const response = await axiosInstance.get('/notifications/student', { params });
    return response.data;
  },
};