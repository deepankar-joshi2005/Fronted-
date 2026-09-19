import axiosInstance from "./axiosInstance";

// Types
export interface AssessmentQuestion {
  questionId: string | {
    _id: string;
    questionText: string;
    answerType: string;
    answerChoices: Array<{
      text: string;
      isCorrect: boolean;
      order: number;
    }>;
    correctAnswers: number[];
    explanation: string;
    difficulty: string;
  };
  order: number;
  marks: number;
}


export interface Assessment {
  _id: string;
  title: string;
  instructions: string;
  grade: string;
  sections: string[];
  session: {
    _id: string;
    name: string;
    displayName: string;
    module: {
      _id: string;
      name: string;
    };
  };
  startDate: string;
  endDate: string;
  duration: number; // in minutes
  questions: AssessmentQuestion[];
  totalMarks: number;
  school: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  status: "draft" | "published" | "cancelled";
  isActive: boolean;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentData {
  title: string;
  instructions: string;
  grade: number;
  sections: string[];
  session?: string;
  startDate: string;
  endDate: string;
  duration: number;
  questions: AssessmentQuestion[];
  school?: string;
}

export interface AssessmentFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export interface QuestionFilters {
  grade?: string;
  session?: string;
  difficulty?: string;
}

export interface StudentReport {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentGrade: string;
  section: string;
  marksObtained: number;
  percentage: number;
  grade: string;
  timeSpent: number;
  timeSpentFormatted: string;
  status: string;
  submittedAt: string | null;
  startTime: string;
  endTime: string | null;
}

export interface AssessmentAnalytics {
  totalAttempts: number;
  completedAttempts: number;
  totalEligibleStudents: number;
  pendingStudents: number;
  averageScore: number;
  averagePercentage: number;
  completionRate: number;
  gradeDistribution: Record<string, number>;
  studentReports: StudentReport[];
}

// Student Assessment Types
export interface StudentAnswer {
  questionId: string;
  selectedAnswers: number[];
  isCorrect: boolean;
  marksObtained: number;
  timeSpent: number;
}

export interface AssessmentResponse {
  _id: string;
  assessment: string | Assessment;
  student: string;
  answers: StudentAnswer[];
  totalMarksObtained: number;
  percentage: number;
  grade: string;
  status: "in_progress" | "completed" | "submitted" | "timeout";
  startTime: string;
  endTime: string;
  timeSpent: number;
  isSubmitted: boolean;
  submittedAt: string;
  autoSubmitted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableAssessment extends Assessment {
  attemptStatus: string;
  hasAttempted: boolean;
  canRetake: boolean;
  assessmentStatus: "upcoming" | "available" | "expired" | "completed" | "in_progress" | "not_available";
  isCurrentlyAvailable: boolean;
  subject?: string;
  modules?: string[];
}

export interface DetailedQuestion {
  questionId: string;
  questionText: string;
  answerType: string;
  answerChoices: Array<{
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
  correctAnswers: number[];
  explanation: string;
  difficulty: string;
  marks: number;
  studentAnswer: {
    selectedAnswers: number[];
    isCorrect: boolean;
    marksObtained: number;
    timeSpent: number;
  } | null;
}

export interface DetailedAssessmentResult extends AssessmentResponse {
  assessment: Assessment & {
    questions: DetailedQuestion[];
  };
}

export interface AssessmentReportData {
  _id: string;
  title: string;
  school: {
    _id: string;
    name: string;
    city: string;
    state: string;
  };
  grade: number;
  sections: string[];
  status: string;
  duration: number;
  startDate: string;
  endDate: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentReportFilters {
  school?: string;
  createdBy?: string;
  status?: string;
  grade?: number;
  section?: string;
}

// Assessment API
export const assessmentService = {
  // Create assessment
  createAssessment: async (data: CreateAssessmentData) => {
    const response = await axiosInstance.post("/assessments", data);
    return response.data;
  },

  // Get assessments
  getAssessments: async (filters: AssessmentFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await axiosInstance.get(`/assessments?${params.toString()}`);
    return response.data;
  },

  // Get single assessment
  getAssessmentById: async (id: string) => {
    const response = await axiosInstance.get(`/assessments/${id}`);
    return response.data;
  },

  // Update assessment
  updateAssessment: async (id: string, data: Partial<CreateAssessmentData>) => {
    const response = await axiosInstance.put(`/assessments/${id}`, data);
    return response.data;
  },

  // Update assessment questions
  updateAssessmentQuestions: async (id: string, questions: AssessmentQuestion[]) => {
    const response = await axiosInstance.put(`/assessments/${id}/questions`, { questions });
    return response.data;
  },

  // Publish assessment
  publishAssessment: async (id: string, notificationMessage?: string) => {
    const response = await axiosInstance.post(`/assessments/${id}/publish`, {
      notificationMessage,
    });
    return response.data;
  },

  // Cancel assessment
  cancelAssessment: async (id: string, reason?: string) => {
    const response = await axiosInstance.post(`/assessments/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Get assessment analytics
  getAssessmentAnalytics: async (id: string) => {
    const response = await axiosInstance.get(`/assessments/${id}/analytics`);
    return response.data;
  },

  // Export assessment results to Excel
  exportAssessmentResults: async (id: string) => {
    const response = await axiosInstance.get(`/assessments/${id}/export`, {
      responseType: 'blob',
    });
    return response;
  },

  // Recalculate assessment statistics
  recalculateAssessmentStatistics: async (id: string) => {
    const response = await axiosInstance.post(`/assessments/${id}/recalculate-statistics`);
    return response.data;
  },

  // Delete assessment
  deleteAssessment: async (id: string) => {
    const response = await axiosInstance.delete(`/assessments/${id}`);
    return response.data;
  },

  // Get questions for assessment creation
  getQuestionsForAssessment: async (filters: QuestionFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    const response = await axiosInstance.get(`/assessments/questions?${params.toString()}`);
    return response.data;
  },

  // Assessment Reports for different roles
  getAssessmentReportsForSuperAdmin: async (filters: AssessmentReportFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await axiosInstance.get(`/assessments/reports/superadmin?${params.toString()}`);
    return response.data;
  },

  getAssessmentReportsForLeadMentor: async (filters: AssessmentReportFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await axiosInstance.get(`/assessments/reports/leadmentor?${params.toString()}`);
    return response.data;
  },

  getAssessmentReportsForSchoolAdmin: async (filters: AssessmentReportFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await axiosInstance.get(`/assessments/reports/schooladmin?${params.toString()}`);
    return response.data;
  },
};

// Student Assessment API
export const studentAssessmentService = {
  // Get available assessments for student
  getAvailableAssessments: async () => {
    const response = await axiosInstance.get("/student-assessments/available");
    return response.data;
  },

  // Start assessment
  startAssessment: async (id: string) => {
    const response = await axiosInstance.post(`/student-assessments/${id}/start`);
    return response.data;
  },

  // Submit answer
  submitAnswer: async (responseId: string, questionId: string, selectedAnswers: number[], timeSpent: number) => {
    const response = await axiosInstance.put(`/student-assessments/${responseId}/answer`, {
      questionId,
      selectedAnswers,
      timeSpent,
    });
    return response.data;
  },

  // Submit assessment
  submitAssessment: async (responseId: string, autoSubmit = false) => {
    const response = await axiosInstance.post(`/student-assessments/${responseId}/submit`, {
      autoSubmit
    });
    return response.data;
  },

  // Get assessment results
  getMyAssessmentResults: async () => {
    const response = await axiosInstance.get("/student-assessments/results");
    return response.data;
  },

  // Get detailed assessment result
  getDetailedAssessmentResult: async (resultId: string) => {
    const response = await axiosInstance.get(`/student-assessments/results/${resultId}`);
    return response.data;
  },

  // Get assessment status (for connection recovery)
  getAssessmentStatus: async (responseId: string) => {
    const response = await axiosInstance.get(`/student-assessments/${responseId}/status`);
    return response.data;
  },
};
