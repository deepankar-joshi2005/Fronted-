import axiosInstance from './axiosInstance';

export interface Module {
  _id?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModuleItem {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateModuleRequest {
  name: string;
  description?: string;
}

export interface UpdateModuleRequest {
  name?: string;
  description?: string;
}

export const moduleService = {
  // Get all modules
  getAllModules: async (): Promise<Module[]> => {
    const response = await axiosInstance.get('/modules');
    return response.data.data;
  },

  // Get module by ID
  getModuleById: async (id: string): Promise<Module> => {
    const response = await axiosInstance.get(`/modules/${id}`);
    return response.data.data;
  },

  // Create new module
  createModule: async (data: CreateModuleRequest): Promise<Module> => {
    const response = await axiosInstance.post('/modules', data);
    return response.data.data;
  },

  // Update module
  updateModule: async (id: string, data: UpdateModuleRequest): Promise<Module> => {
    const response = await axiosInstance.put(`/modules/${id}`, data);
    return response.data.data;
  },

  // Delete module
  deleteModule: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/modules/${id}`);
  },

  // Get modules by grade and subject
  getModulesByGradeAndSubject: async (grade: number, subjectId: string): Promise<ModuleItem[]> => {
    const response = await axiosInstance.get(`/modules/by-grade-subject?grade=${grade}&subject=${subjectId}`);
    return response.data.data;
  },
};