import api from './api';
import { Question, ApiResponse, PaginatedResponse } from '../types';

export const questionService = {
  getQuestions: async (params?: Record<string, any>): Promise<PaginatedResponse<Question>> => {
    const response = await api.get<PaginatedResponse<Question>>('/questions/', { params });
    return response.data;
  },

  getQuestion: async (id: number): Promise<Question> => {
    const response = await api.get<ApiResponse<Question>>(`/questions/${id}/`);
    return response.data.data;
  },

  createQuestion: async (questionData: Partial<Question>): Promise<Question> => {
    const response = await api.post<ApiResponse<Question>>('/questions/', questionData);
    return response.data.data;
  },

  updateQuestion: async (id: number, questionData: Partial<Question>): Promise<Question> => {
    const response = await api.put<ApiResponse<Question>>(`/questions/${id}/`, questionData);
    return response.data.data;
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await api.delete(`/questions/${id}/`);
  },

  bulkCreate: async (questions: Partial<Question>[]): Promise<{
    created_count: number;
    questions: Question[];
  }> => {
    const response = await api.post<ApiResponse<any>>('/questions/bulk-create/', {
      questions,
    });
    return response.data.data;
  },

  importQuestions: async (file: File, examId: number): Promise<{
    imported_count: number;
    error_count: number;
    errors: string[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('exam_id', examId.toString());

    const response = await api.post<ApiResponse<any>>('/questions/import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  previewImport: async (file: File): Promise<{
    preview: any[];
    total_rows: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<any>>('/questions/import/preview/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Question Bank
  getBankQuestions: async (params?: Record<string, any>): Promise<PaginatedResponse<Question>> => {
    const response = await api.get<PaginatedResponse<Question>>('/questions/bank/', { params });
    return response.data;
  },

  addToExam: async (questionIds: number[], examId: number): Promise<{ added_count: number }> => {
    const response = await api.post<ApiResponse<any>>('/questions/bank/add-to-exam/', {
      question_ids: questionIds,
      exam_id: examId,
    });
    return response.data.data;
  },
};
