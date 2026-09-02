import api from './api';
import { User, Class, ApiResponse, PaginatedResponse } from '../types';

export const adminService = {
  getDashboard: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/auth/admin/dashboard/');
    return response.data.data;
  },

  // Students
  getStudents: async (params?: Record<string, any>): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/auth/admin/students/', { params });
    return response.data;
  },

  getStudent: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/auth/admin/students/${id}/`);
    return response.data.data;
  },

  createStudent: async (studentData: Partial<User> & { password: string }): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/auth/admin/students/', studentData);
    return response.data.data;
  },

  updateStudent: async (id: number, studentData: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/auth/admin/students/${id}/`, studentData);
    return response.data.data;
  },

  deleteStudent: async (id: number): Promise<void> => {
    await api.delete(`/auth/admin/students/${id}/`);
  },

  // Classes
  getClasses: async (): Promise<PaginatedResponse<Class>> => {
    const response = await api.get<PaginatedResponse<Class>>('/auth/admin/classes/');
    return response.data;
  },

  createClass: async (classData: Partial<Class>): Promise<Class> => {
    const response = await api.post<ApiResponse<Class>>('/auth/admin/classes/', classData);
    return response.data.data;
  },

  updateClass: async (id: number, classData: Partial<Class>): Promise<Class> => {
    const response = await api.put<ApiResponse<Class>>(`/auth/admin/classes/${id}/`, classData);
    return response.data.data;
  },

  deleteClass: async (id: number): Promise<void> => {
    await api.delete(`/auth/admin/classes/${id}/`);
  },
};
