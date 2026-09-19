import axiosInstance from "./axiosInstance";

export interface StudentAccess {
  userId: string;
  studentId: string;
  userName: string;
  userEmail: string;
  grade: number | null;
  accessCount: number;
  totalTimeSpentSeconds: number;
  watchDurationSeconds: number;
  firstAccessAt?: string;
  lastAccessAt?: string;
}

export interface ResourceAccessReport {
  resourceId: string;
  resourceTitle: string;
  resourceType: 'document' | 'video';
  students: StudentAccess[];
  totalAccesses: number;
  totalStudents: number;
}

export const reportService = {
  async getAccess(params: Record<string, any>) {
    const res = await axiosInstance.get('/reports/access', { params });
    return res.data.data as { items: ResourceAccessReport[]; pagination: { currentPage: number; itemsPerPage: number; totalItems: number; totalPages: number } };
  },
  async getSummary(params: Record<string, any>) {
    const res = await axiosInstance.get('/reports/summary', { params });
    return res.data.data as { totals: { accessCount: number; timeSpent: number; videoTime: number } };
  },
};

export default reportService;


