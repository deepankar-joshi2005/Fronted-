import axiosInstance from "./axiosInstance";
import type { School } from "./schoolService";

export interface User {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

export interface SchoolAdmin {
  _id: string;
  user: User | null;
  assignedSchool: School;
  phoneNumber: string;
  position?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolAdminData {
  name: string;
  email: string;
  phoneNumber: string;
  assignedSchool: string;
  position?: string;
}

export interface UpdateSchoolAdminData {
  name?: string;
  phoneNumber?: string;
  assignedSchool?: string;
  isActive?: boolean;
  position?: string;
}

export interface Mentor {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    isVerified: boolean;
  };
  phoneNumber: string;
  assignedSchools: School[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    isVerified: boolean;
  };
  school: School;
  studentId: string;
  grade: number;
  section: string;
  parentEmail?: string;
  parentPhoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleProgressData {
  mentor: {
    _id: string;
    name: string;
    email: string;
  };
  schoolProgress: {
    school: School;
    totalItems: number;
    completedItems: number;
    progressPercentage: number;
    completions: any[];
  }[];
}

export interface AssessmentReportData {
  school: School;
  statistics: {
    totalStudents: number;
    totalAssessments: number;
    totalResponses: number;
    completedResponses: number;
    averageScore: number;
  };
  assessments: {
    _id: string;
    title: string;
    subject: any;
    grade: string;
    totalMarks: number;
    duration: number;
  }[];
  studentReports: {
    student: {
      _id: string;
      studentId: string;
      name: string;
      email: string;
      grade: string;
      section: string;
    };
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    responses: {
      assessmentId: string;
      assessmentTitle: string;
      marksObtained: number;
      percentage: number;
      grade: string;
      status: string;
      submittedAt: string | null;
    }[];
  }[];
}

// School Admin API functions
export const schoolAdminService = {
  // Get all school admins
  getAll: async (params?: { includeInactive?: boolean; page?: number; limit?: number }): Promise<{ success: boolean; data: SchoolAdmin[]; pagination?: { total: number; page: number; limit: number; pages: number } }> => {
    const queryParams = new URLSearchParams();
    if (params?.includeInactive) {
      queryParams.append('includeInactive', 'true');
    }
    if (params?.page) {
      queryParams.append('page', String(params.page));
    }
    if (params?.limit) {
      queryParams.append('limit', String(params.limit));
    }
    const url = queryParams.toString() ? `/school-admins?${queryParams.toString()}` : '/school-admins';
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Get school admins by school ID
  getBySchool: async (schoolId: string): Promise<{ success: boolean; data: SchoolAdmin[] }> => {
    const response = await axiosInstance.get(`/school-admins/school/${schoolId}`);
    return response.data;
  },

  // Create new school admin
  create: async (data: CreateSchoolAdminData): Promise<{ success: boolean; data: SchoolAdmin; message: string }> => {
    const response = await axiosInstance.post("/school-admins", data);
    return response.data;
  },

  // Update school admin
  update: async (id: string, data: UpdateSchoolAdminData): Promise<{ success: boolean; data: SchoolAdmin; message: string }> => {
    const response = await axiosInstance.put(`/school-admins/${id}`, data);
    return response.data;
  },

  // Delete school admin
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/school-admins/${id}`);
    return response.data;
  },

  // Activate school admin
  activate: async (id: string): Promise<{ success: boolean; data: SchoolAdmin; message: string }> => {
    const response = await axiosInstance.patch(`/school-admins/${id}/activate`);
    return response.data;
  },

  // Deactivate school admin
  deactivate: async (id: string): Promise<{ success: boolean; data: SchoolAdmin; message: string }> => {
    const response = await axiosInstance.patch(`/school-admins/${id}/deactivate`);
    return response.data;
  },

  // Dashboard endpoints
  getMentors: async (params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: { schoolAdmin: any; mentors: Mentor[] }; pagination?: { total: number; page: number; limit: number; pages: number } }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append('page', String(params.page));
    }
    if (params?.limit) {
      queryParams.append('limit', String(params.limit));
    }
    const url = queryParams.toString() ? `/school-admins/mentors?${queryParams.toString()}` : '/school-admins/mentors';
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getStudents: async (params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: { schoolAdmin: any; students: Student[] }; pagination?: { total: number; page: number; limit: number; pages: number } }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append('page', String(params.page));
    }
    if (params?.limit) {
      queryParams.append('limit', String(params.limit));
    }
    const url = queryParams.toString() ? `/school-admins/students?${queryParams.toString()}` : '/school-admins/students';
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getModuleProgress: async (): Promise<{ success: boolean; data: { schoolAdmin: any; moduleProgress: ModuleProgressData[] } }> => {
    const response = await axiosInstance.get("/school-admins/module-progress");
    return response.data;
  },

  getAssessmentReports: async (): Promise<{ success: boolean; data: { schoolAdmin: any; assessmentReports: AssessmentReportData[] } }> => {
    const response = await axiosInstance.get("/school-admins/assessment-reports");
    return response.data;
  },

  // Get counts
  getCount: async (params?: { includeInactive?: boolean }): Promise<{ success: boolean; data: { count: number } }> => {
    const queryParams = new URLSearchParams();
    if (params?.includeInactive) {
      queryParams.append('includeInactive', 'true');
    }
    const url = queryParams.toString() ? `/school-admins/count?${queryParams.toString()}` : '/school-admins/count';
    const response = await axiosInstance.get(url);
    return response.data;
  },

  getMentorCount: async (): Promise<{ success: boolean; data: { count: number } }> => {
    const response = await axiosInstance.get("/school-admins/mentors/count");
    return response.data;
  },

  getStudentCount: async (): Promise<{ success: boolean; data: { count: number } }> => {
    const response = await axiosInstance.get("/school-admins/students/count");
    return response.data;
  },
};
