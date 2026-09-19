import axiosInstance from "./axiosInstance";
import type { School } from "./schoolService";

export interface User {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

export interface LeadMentor {
  _id: string;
  user: User;
  phoneNumber: string;
  assignedSchools: School[];
  hasAccessToAllSchools: boolean;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadMentorData {
  name: string;
  email: string;
  phoneNumber: string;
  assignedSchools?: string[];
  hasAccessToAllSchools?: boolean;
  permissions?: string[];
}

export interface UpdateLeadMentorData {
  name?: string;
  phoneNumber?: string;
  assignedSchools?: string[];
  hasAccessToAllSchools?: boolean;
  permissions?: string[];
  isActive?: boolean;
}

// Lead Mentor API functions
export const leadMentorService = {
  // Get all lead mentors
  getAll: async (
    options?: { includeInactive?: boolean; page?: number; limit?: number }
  ): Promise<{ success: boolean; data: LeadMentor[]; pagination?: { total: number; page: number; limit: number; pages: number } }> => {
    const params: any = {};
    if (options?.includeInactive) params.includeInactive = true;
    if (options?.page) params.page = options.page;
    if (options?.limit) params.limit = options.limit;
    const response = await axiosInstance.get("/lead-mentors", { params });
    return response.data;
  },

  // Get lead mentor by ID
  getById: async (id: string): Promise<{ success: boolean; data: LeadMentor }> => {
    const response = await axiosInstance.get(`/lead-mentors/${id}`);
    return response.data;
  },

  // Get my schools (for lead mentors)
  getMySchools: async (params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: School[]; pagination?: { total: number; page: number; limit: number; pages: number } }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append('page', String(params.page));
    }
    if (params?.limit) {
      queryParams.append('limit', String(params.limit));
    }
    const url = queryParams.toString() ? `/lead-mentors/my-schools?${queryParams.toString()}` : '/lead-mentors/my-schools';
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Create new lead mentor
  create: async (data: CreateLeadMentorData): Promise<{ success: boolean; data: LeadMentor; message: string }> => {
    const response = await axiosInstance.post("/lead-mentors", data);
    return response.data;
  },

  // Update lead mentor
  update: async (id: string, data: UpdateLeadMentorData): Promise<{ success: boolean; data: LeadMentor; message: string }> => {
    const response = await axiosInstance.put(`/lead-mentors/${id}`, data);
    return response.data;
  },

  // Delete lead mentor
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/lead-mentors/${id}`);
    return response.data;
  },

  // Get lead mentor count
  getCount: async (params?: { includeInactive?: boolean }): Promise<{ success: boolean; data: { count: number } }> => {
    const queryParams = new URLSearchParams();
    if (params?.includeInactive) {
      queryParams.append('includeInactive', 'true');
    }
    const url = queryParams.toString() ? `/lead-mentors/count?${queryParams.toString()}` : '/lead-mentors/count';
    const response = await axiosInstance.get(url);
    return response.data;
  },
};
