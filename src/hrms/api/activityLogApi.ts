import axiosInstance from "./axiosInstance";

export interface ActivityLog {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  schoolId?: {
    _id: string;
    name: string;
  };
  schoolName?: string;
  ipAddress: string;
  userAgent: string;
  endpoint: string;
  method: string;
  statusCode: number;
  description: string;
  details: any;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isSuccess: boolean;
  errorMessage?: string;
  duration?: number;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  resourceType?: string;
  schoolId?: string;
  severity?: string;
  isSuccess?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ActivityLogResponse {
  success: boolean;
  data: {
    activityLogs: ActivityLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    filters: {
      actions: string[];
      resourceTypes: string[];
      severities: string[];
      users: Array<{ _id: string; name: string; email: string; role: string }>;
      categorizedUsers: {
        superadmin: Array<{ _id: string; name: string; email: string; role: string }>;
        leadmentor: Array<{ _id: string; name: string; email: string; role: string }>;
        schooladmin: Array<{ _id: string; name: string; email: string; role: string }>;
        mentor: Array<{ _id: string; name: string; email: string; role: string }>;
        guest: Array<{ _id: string; name: string; email: string; role: string }>;
      };
      schools: Array<{ _id: string; name: string }>;
    };
  };
}

export interface ActivityStatistics {
  success: boolean;
  data: {
    overview: {
      totalActivities: number;
      successfulActivities: number;
      failedActivities: number;
      successRate: string;
    };
    activitiesByAction: Array<{ _id: string; count: number }>;
    activitiesByUser: Array<{ _id: string; userName: string; userEmail: string; count: number }>;
    activitiesByResourceType: Array<{ _id: string; count: number }>;
    activitiesBySeverity: Array<{ _id: string; count: number }>;
    activitiesByDay: Array<{ _id: string; count: number }>;
    topUsers: Array<{ _id: string; userName: string; userEmail: string; userRole: string; count: number }>;
    recentActivities: ActivityLog[];
  };
}

export interface ActivitySummary {
  success: boolean;
  data: {
    totalActivities: number;
    uniqueUsers: number;
    topActions: Array<{ _id: string; count: number }>;
    recentActivities: ActivityLog[];
    errorCount: number;
    period: string;
  };
}

// Get all activity logs with filtering and pagination
export const getActivityLogs = async (filters: ActivityLogFilters = {}): Promise<ActivityLogResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const response = await axiosInstance.get(`/activity-logs?${params.toString()}`);
  return response.data;
};

// Get activity log by ID
export const getActivityLogById = async (id: string): Promise<{ success: boolean; data: ActivityLog }> => {
  const response = await axiosInstance.get(`/activity-logs/${id}`);
  return response.data;
};

// Get activity logs for a specific user
export const getUserActivityLogs = async (
  userId: string, 
  filters: Omit<ActivityLogFilters, 'userId'> = {}
): Promise<ActivityLogResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const response = await axiosInstance.get(`/activity-logs/user/${userId}?${params.toString()}`);
  return response.data;
};

// Get activity statistics
export const getActivityStatistics = async (filters: {
  startDate?: string;
  endDate?: string;
  schoolId?: string;
} = {}): Promise<ActivityStatistics> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const response = await axiosInstance.get(`/activity-logs/stats/overview?${params.toString()}`);
  return response.data;
};

// Get activity summary for dashboard
export const getActivitySummary = async (days: number = 7): Promise<ActivitySummary> => {
  const response = await axiosInstance.get(`/activity-logs/stats/summary?days=${days}`);
  return response.data;
};

// Export activity logs to CSV
export const exportActivityLogs = async (filters: ActivityLogFilters = {}): Promise<Blob> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });

  const response = await axiosInstance.get(`/activity-logs/export/csv?${params.toString()}`, {
    responseType: 'blob'
  });
  return response.data;
};

// Cleanup old activity logs
export const cleanupOldLogs = async (daysToKeep: number = 90): Promise<{
  success: boolean;
  message: string;
  deletedCount: number;
}> => {
  const response = await axiosInstance.delete(`/activity-logs/cleanup`, {
    data: { daysToKeep }
  });
  return response.data;
};
