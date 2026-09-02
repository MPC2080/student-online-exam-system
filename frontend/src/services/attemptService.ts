import api from './api';
import { ExamAttempt, Answer, ApiResponse } from '../types';

export const attemptService = {
  startExam: async (examId: number): Promise<ExamAttempt> => {
    const response = await api.post<ApiResponse<ExamAttempt>>('/attempts/start/', {
      exam_id: examId,
    });
    return response.data.data;
  },

  continueExam: async (attemptId: number): Promise<{
    attempt: ExamAttempt;
    questions: any[];
    answers: Answer[];
    time_remaining: number;
  }> => {
    const response = await api.get<ApiResponse<any>>(`/attempts/${attemptId}/continue/`);
    return response.data.data;
  },

  saveAnswer: async (
    attemptId: number,
    questionId: number,
    selectedAnswer: string | null,
    isMarked: boolean = false
  ): Promise<Answer> => {
    const response = await api.post<ApiResponse<Answer>>(`/attempts/${attemptId}/answer/`, {
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_marked: isMarked,
    });
    return response.data.data;
  },

  saveBulkAnswers: async (
    attemptId: number,
    answers: { question_id: number; selected_answer: string | null; is_marked: boolean }[]
  ): Promise<{ updated_count: number }> => {
    const response = await api.post<ApiResponse<{ updated_count: number }>>(
      `/attempts/${attemptId}/answers/bulk/`,
      { answers }
    );
    return response.data.data;
  },

  submitExam: async (attemptId: number): Promise<{
    attempt_id: number;
    status: string;
    submitted_at: string;
    message: string;
  }> => {
    const response = await api.post<ApiResponse<any>>(`/attempts/${attemptId}/submit/`);
    return response.data.data;
  },

  autoSubmit: async (attemptId: number): Promise<{
    attempt_id: number;
    status: string;
    message: string;
  }> => {
    const response = await api.post<ApiResponse<any>>(`/attempts/${attemptId}/auto-submit/`);
    return response.data.data;
  },
};
