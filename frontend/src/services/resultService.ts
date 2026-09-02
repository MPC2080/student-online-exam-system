import api from './api';
import { Result, StudentHistory, StudentStats, ApiResponse, PaginatedResponse } from '../types';

export const resultService = {
  getResult: async (attemptId: number): Promise<Result | { status: string; message: string; release_time: string }> => {
    const response = await api.get<ApiResponse<any>>(`/results/student/attempt/${attemptId}/`);
    return response.data.data;
  },

  getHistory: async (): Promise<PaginatedResponse<StudentHistory>> => {
    const response = await api.get<PaginatedResponse<StudentHistory>>('/results/student/history/');
    return response.data;
  },

  getStats: async (): Promise<StudentStats> => {
    const response = await api.get<ApiResponse<StudentStats>>('/results/student/stats/');
    return response.data.data;
  },

  getProgress: async (): Promise<{
    exam_title: string;
    score: number;
    date: string;
    rank: number | null;
    average: number | null;
  }[]> => {
    const response = await api.get<ApiResponse<any[]>>('/results/student/progress/');
    return response.data.data;
  },

  // Admin endpoints
  getExamResults: async (examId: number): Promise<{
    exam: { id: number; title: string };
    results: Result[];
    statistics: any;
  }> => {
    const response = await api.get<ApiResponse<any>>(`/results/admin/exam/${examId}/`);
    return response.data.data;
  },

  recalculateResults: async (examId: number): Promise<void> => {
    await api.post(`/results/admin/exam/${examId}/recalculate/`);
  },

  releaseResults: async (examId: number): Promise<void> => {
    await api.post(`/results/admin/exam/${examId}/release/`);
  },
};
