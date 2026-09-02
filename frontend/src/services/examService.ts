import api from './api';
import { Exam, ExamRules, ApiResponse, PaginatedResponse } from '../types';

export const examService = {
  getExams: async (params?: Record<string, any>): Promise<PaginatedResponse<Exam>> => {
    const response = await api.get<PaginatedResponse<Exam>>('/exams/', { params });
    return response.data;
  },

  getExam: async (id: number): Promise<Exam> => {
    const response = await api.get<ApiResponse<Exam>>(`/exams/${id}/`);
    return response.data.data;
  },

  getExamRules: async (id: number): Promise<ExamRules> => {
    const response = await api.get<ApiResponse<ExamRules>>(`/exams/${id}/rules/`);
    return response.data.data;
  },

  createExam: async (examData: Partial<Exam>): Promise<Exam> => {
    const response = await api.post<ApiResponse<Exam>>('/exams/admin/create/', examData);
    return response.data.data;
  },

  updateExam: async (id: number, examData: Partial<Exam>): Promise<Exam> => {
    const response = await api.put<ApiResponse<Exam>>(`/exams/admin/${id}/update/`, examData);
    return response.data.data;
  },

  deleteExam: async (id: number): Promise<void> => {
    await api.delete(`/exams/admin/${id}/delete/`);
  },

  duplicateExam: async (id: number): Promise<Exam> => {
    const response = await api.post<ApiResponse<Exam>>(`/exams/admin/${id}/duplicate/`);
    return response.data.data;
  },

  togglePublish: async (id: number): Promise<{ is_published: boolean; message: string }> => {
    const response = await api.post<ApiResponse<{ is_published: boolean; message: string }>>(
      `/exams/admin/${id}/publish/`
    );
    return response.data.data;
  },
};
