import axiosInstance from './axiosInstance';
import { type Module } from './moduleService';

export interface Session {
  _id?: string;
  grade: number;
  name: string;
  module: Module | string;
  sessionNumber: number;
  displayName?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSessionRequest {
  grade: number;
  name: string;
  moduleId: string;
  description?: string;
}

export interface UpdateSessionRequest {
  name?: string;
  moduleId?: string;
  description?: string;
}

export const sessionService = {
  // Get all sessions
  getAllSessions: async (): Promise<Session[]> => {
    const response = await axiosInstance.get('/sessions');
    return response.data.data;
  },

  // Get sessions by grade
  getSessionsByGrade: async (grade: number): Promise<Session[]> => {
    const response = await axiosInstance.get(`/sessions/grade/${grade}`);
    return response.data.data;
  },

  // Get session by ID
  getSessionById: async (id: string): Promise<Session> => {
    const response = await axiosInstance.get(`/sessions/${id}`);
    return response.data.data;
  },

  // Create new session
  createSession: async (data: CreateSessionRequest): Promise<Session> => {
    const response = await axiosInstance.post('/sessions', data);
    return response.data.data;
  },

  // Update session
  updateSession: async (id: string, data: UpdateSessionRequest): Promise<Session> => {
    const response = await axiosInstance.put(`/sessions/${id}`, data);
    return response.data.data;
  },

  // Delete session
  deleteSession: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/sessions/${id}`);
  },

  // Get session IDs for bulk upload
  getSessionIdsForBulkUpload: async (): Promise<Array<{
    id: string;
    name: string;
    grade: number;
    sessionNumber: number;
    moduleName: string;
    displayName: string;
  }>> => {
    const response = await axiosInstance.get('/sessions/bulk-upload-ids');
    return response.data.data;
  },
};
