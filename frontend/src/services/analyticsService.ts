import api from './api';
import { ExamAnalytics, ApiResponse } from '../types';

export const analyticsService = {
  getDashboard: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/analytics/dashboard/');
    return response.data.data;
  },

  getExamAnalytics: async (examId: number): Promise<ExamAnalytics> => {
    const response = await api.get<ApiResponse<ExamAnalytics>>(`/analytics/exam/${examId}/`);
    return response.data.data;
  },

  exportResults: async (examId: number, format: 'csv' | 'excel' = 'csv'): Promise<void> => {
    const response = await api.get(`/analytics/exam/${examId}/export/`, {
      params: { format },
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `results.${format === 'excel' ? 'xlsx' : 'csv'}`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
