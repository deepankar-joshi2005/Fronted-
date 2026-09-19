import axiosInstance from "./axiosInstance";

export interface Subtopic {
  subtopicId: string;
  subtopicName: string;
  subtopicDescription: string;
  isActive: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string;
}

export interface Topic {
  topicId: string;
  topicName: string;
  topicDescription: string;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string;
  subtopics: Subtopic[];
  isActive: boolean;
}

export interface ModuleItemCompletion {
  moduleItemId: string;
  moduleItemName: string;
  moduleItemDescription: string;
  isCompleted: boolean;
  completedAt: string | null;
  notes: string;
  status: "Pending" | "In Progress" | "Completed";
  topics: Topic[];
}

export interface ModuleProgress {
  moduleId: string;
  grade: number;
  subject: {
    _id: string;
    name: string;
  };
  totalItems: number;
  completedItems: number;
  overallProgress: number;
  moduleItems: ModuleItemCompletion[];
}

export interface MentorModuleProgress {
  school: {
    _id: string;
    name: string;
    city: string;
    state: string;
  };
  mentor: {
    _id: string;
    name: string;
  };
  moduleProgress: ModuleProgress[];
}

export interface MarkCompletionData {
  moduleId: string;
  moduleItemId: string;
  schoolId: string;
  section: string;
  grade: string;
  isCompleted: boolean;
  status?: "Pending" | "In Progress" | "Completed";
  notes?: string;
}

export interface UpdateModuleStatusData {
  moduleId: string;
  schoolId: string;
  section: string;
  grade: string;
  status: "Pending" | "In Progress" | "Completed";
}

export interface MarkSubtopicCompletionData {
  moduleId: string;
  moduleItemId: string;
  topicId: string;
  subtopicId: string;
  schoolId: string;
  isCompleted: boolean;
  notes?: string;
}

export interface MarkAllSubtopicCompletionData {
  moduleId: string;
  moduleItemId: string;
  schoolId: string;
}

export interface MarkTopicCompletionData {
  moduleId: string;
  moduleItemId: string;
  topicId: string;
  schoolId: string;
  isCompleted: boolean;
  notes?: string;
}

export interface School {
  _id: string;
  name: string;
  city: string;
  state: string;
}

export interface ModuleCompletionReport {
  mentor: {
    _id: string;
    name: string;
    email: string;
  };
  school: {
    _id: string;
    name: string;
    city: string;
    state: string;
  };
  modules: {
    moduleId: string;
    grade: number;
    subject: {
      _id: string;
      name: string;
    };
    totalItems: number;
    completedItems: number;
    progress: number;
    items: {
      moduleItemId: string;
      moduleItemName: string;
      moduleItemDescription: string;
      isCompleted: boolean;
      completedAt: string | null;
      notes: string;
      status: "Pending" | "In Progress" | "Completed";
      completionPercentage: number;
      topics: {
        topicId: string;
        topicName: string;
        topicDescription: string;
        isCompleted: boolean;
        completedAt: string | null;
        notes: string;
        subtopics: {
          subtopicId: string;
          subtopicName: string;
          subtopicDescription: string;
          isCompleted: boolean;
          completedAt: string | null;
          notes: string;
        }[];
      }[];
    }[];
  }[];
  totalItems: number;
  completedItems: number;
  overallProgress: number;
}

export const moduleCompletionService = {
  // Get module progress for mentor
  getMentorModuleProgress: async (schoolId?: string, section?: string, grade?: string): Promise<MentorModuleProgress> => {
    const params: any = {};
    if (schoolId) params.schoolId = schoolId;
    if (section) params.section = section;
    if (grade) params.grade = grade;
    
    const response = await axiosInstance.get("/module-completion/mentor/progress", { params });
    return response.data.data;
  },

  // Mark module item as completed/incomplete
  markModuleItemCompleted: async (data: MarkCompletionData) => {
    const response = await axiosInstance.post("/module-completion/mentor/mark-completed", data);
    return response.data;
  },

  // Update module status for a specific section
  updateModuleStatus: async (data: UpdateModuleStatusData) => {
    const response = await axiosInstance.post("/module-completion/mentor/update-module-status", data);
    return response.data;
  },

  // Get available schools
  getAvailableSchools: async (): Promise<School[]> => {
    const response = await axiosInstance.get("/module-completion/schools");
    return response.data.data;
  },

  // Get module completion reports (lead mentor only)
  getModuleCompletionReports: async (schoolId?: string, mentorId?: string, section?: string, grade?: string): Promise<ModuleCompletionReport[]> => {
    const params: any = {};
    if (schoolId) params.schoolId = schoolId;
    if (mentorId) params.mentorId = mentorId;
    if (section) params.section = section;
    if (grade) params.grade = grade;
    
    const response = await axiosInstance.get("/module-completion/reports", { params });
    return response.data.data;
  },

  // Mark subtopic as completed
  markSubtopicCompleted: async (data: MarkSubtopicCompletionData) => {
    const response = await axiosInstance.post("/module-completion/mentor/mark-subtopic-completed", data);
    return response.data;
  },

  // Mark all subtopics as completed
  markAllSubtopicCompleted: async (data: MarkAllSubtopicCompletionData) => {
    const response = await axiosInstance.post("/module-completion/mentor/mark-all-subtopics-completed", data);
    return response.data;
  },

  // Mark topic as completed
  markTopicCompleted: async (data: MarkTopicCompletionData) => {
    const response = await axiosInstance.post("/module-completion/mentor/mark-topic-completed", data);
    return response.data;
  },

  // Save notes for module item
  saveModuleItemNotes: async (data: { moduleId: string; moduleItemId: string; schoolId: string; notes: string }) => {
    const response = await axiosInstance.post("/module-completion/mentor/save-notes", data);
    return response.data;
  },
};
