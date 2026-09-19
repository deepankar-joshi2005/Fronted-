import axiosInstance from './axiosInstance';

export interface AnswerChoice {
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface Question {
  _id: string;
  questionText: string;
  session: {
    _id: string;
    name: string;
    grade: number;
    sessionNumber: number;
    displayName?: string;
    module: {
      _id: string;
      name: string;
    };
  };
  answerType: 'radio' | 'checkbox';
  answerChoices: AnswerChoice[];
  correctAnswers: number[];
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Tough';
  order: number;
  isActive: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionRecommendation {
  _id: string;
  questionText: string;
  session: {
    _id: string;
    name: string;
    grade: number;
    sessionNumber: number;
    displayName?: string;
    module: {
      _id: string;
      name: string;
    };
  };
  answerType: 'radio' | 'checkbox';
  answerChoices: AnswerChoice[];
  correctAnswers: number[];
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Tough';
  status: 'pending' | 'approved' | 'rejected';
  recommendedBy: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewComments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionData {
  questionText: string;
  session: string;
  answerType: 'radio' | 'checkbox';
  answerChoices: { text: string; isCorrect: boolean }[];
  correctAnswers: number[];
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Tough';
  grade?: string;
  subject?: string;
  module?: string;
}

export interface BulkQuestionData {
  questionText: string;
  session: string;
  answerType: string;
  answerChoices: string[];
  correctAnswers: number[];
  difficulty: string;
  explanation: string;
  row: number;
}

export interface QuestionFilters {
  session?: string;
  difficulty?: string;
  answerType?: string;
  search?: string;
  page?: number;
  limit?: number;
  grade?: string;
  subject?: string;
  module?: string;
}

export interface RecommendationFilters {
  status?: string;
  session?: string;
  page?: number;
  limit?: number;
}

// Question Bank API
export const questionBankService = {
  // Get questions with filters
  getQuestions: async (filters: QuestionFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await axiosInstance.get(`/question-bank/questions?${params.toString()}`);
    return response.data;
  },

  // Get single question
  getQuestionById: async (id: string) => {
    const response = await axiosInstance.get(`/question-bank/questions/${id}`);
    return response.data;
  },

  // Create question
  createQuestion: async (data: CreateQuestionData) => {
    const response = await axiosInstance.post('/question-bank/questions', data);
    return response.data;
  },

  // Update question
  updateQuestion: async (id: string, data: Partial<CreateQuestionData>) => {
    const response = await axiosInstance.put(`/question-bank/questions/${id}`, data);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (id: string) => {
    const response = await axiosInstance.delete(`/question-bank/questions/${id}`);
    return response.data;
  },

  // Reorder questions
  reorderQuestions: async (questionOrders: { id: string; order: number }[]) => {
    const response = await axiosInstance.put('/question-bank/questions/reorder', { questionOrders });
    return response.data;
  },

  // Get sessions
  getSessions: async () => {
    const response = await axiosInstance.get('/sessions');
    return response.data;
  },
};

// Question Recommendations API
export const questionRecommendationService = {
  // Get recommendations
  getRecommendations: async (filters: RecommendationFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await axiosInstance.get(`/question-bank/recommendations?${params.toString()}`);
    return response.data;
  },

  // Create recommendation
  createRecommendation: async (data: CreateQuestionData) => {
    const response = await axiosInstance.post('/question-bank/recommendations', data);
    return response.data;
  },

  // Review recommendation
  reviewRecommendation: async (id: string, status: 'approved' | 'rejected', reviewComments?: string) => {
    const response = await axiosInstance.put(`/question-bank/recommendations/${id}/review`, {
      status,
      reviewComments,
    });
    return response.data;
  },

  // Get my recommendations
  getMyRecommendations: async (filters: RecommendationFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await axiosInstance.get(`/question-bank/recommendations/my?${params.toString()}`);
    return response.data;
  },

  // Re-recommend question
  reRecommendQuestion: async (id: string, data: CreateQuestionData) => {
    const response = await axiosInstance.post(`/question-bank/recommendations/${id}/re-recommend`, data);
    return response.data;
  },

  // Approve recommendation
  approveRecommendation: async (id: string, data: { reviewComments?: string }) => {
    const response = await axiosInstance.put(`/question-bank/recommendations/${id}/review`, {
      status: 'approved',
      reviewComments: data.reviewComments,
    });
    return response.data;
  },

  // Reject recommendation
  rejectRecommendation: async (id: string, data: { reviewComments: string }) => {
    const response = await axiosInstance.put(`/question-bank/recommendations/${id}/review`, {
      status: 'rejected',
      reviewComments: data.reviewComments,
    });
    return response.data;
  },
};

// Bulk Upload API
export const bulkUploadService = {
  // Parse file
  parseFile: async (file: File) => {
    console.log('Preparing file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
    
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    try {
      const response = await axiosInstance.post('/question-bank/bulk-upload/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  },

  // Save bulk questions
  saveBulkQuestions: async (questions: BulkQuestionData[]) => {
    const response = await axiosInstance.post('/question-bank/bulk-upload/save', { questions });
    return response.data;
  },
};
