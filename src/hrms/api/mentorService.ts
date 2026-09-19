import axiosInstance from "./axiosInstance";

export interface Mentor {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    isVerified: boolean;
    createdAt: string;
  };
  phoneNumber: string;
  assignedSchools: {
    _id: string;
    name: string;
    city: string;
    state: string;
    boards: string[];
    branchName: string;
  }[];
  addedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorData {
  name: string;
  email: string;
  phoneNumber: string;
  assignedSchools: string[];
}

export interface UpdateMentorData {
  name?: string;
  email?: string;
  phoneNumber?: string;
  assignedSchools?: string[];
  isActive?: boolean;
}

// Mentor API functions
export const mentorService = {
  // Get all mentors
  getAll: async (filters?: {
    schoolId?: string;
  }): Promise<{ success: boolean; data: Mentor[] }> => {
    const params = new URLSearchParams();
    if (filters?.schoolId) params.append("schoolId", filters.schoolId);

    const response = await axiosInstance.get(`/mentors?${params.toString()}`);
    return response.data;
  },

  // Get mentor by ID
  getById: async (id: string): Promise<{ success: boolean; data: Mentor }> => {
    const response = await axiosInstance.get(`/mentors/${id}`);
    return response.data;
  },

  // Get my profile (for mentors)
  getMyProfile: async (): Promise<{ success: boolean; data: Mentor }> => {
    const response = await axiosInstance.get("/mentors/my-profile");
    return response.data;
  },

  // Create new mentor
  create: async (
    data: CreateMentorData
  ): Promise<{ success: boolean; data: Mentor; message: string }> => {
    const response = await axiosInstance.post("/mentors", data);
    return response.data;
  },

  // Update mentor
  update: async (
    id: string,
    data: UpdateMentorData
  ): Promise<{ success: boolean; data: Mentor; message: string }> => {
    const response = await axiosInstance.put(`/mentors/${id}`, data);
    return response.data;
  },

  // Delete mentor
  delete: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/mentors/${id}`);
    return response.data;
  },

  // Get mentor count
  getCount: async (filters?: { schoolId?: string }): Promise<{ success: boolean; data: { count: number } }> => {
    const params = new URLSearchParams();
    if (filters?.schoolId) params.append("schoolId", filters.schoolId);
    const url = params.toString() ? `/mentors/count?${params.toString()}` : '/mentors/count';
    const response = await axiosInstance.get(url);
    return response.data;
  },
};
