// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'student';
  student_id?: string;
  phone_number?: string;
  full_name: string;
  classes?: Class[];
  is_active_student?: boolean;
  date_joined: string;
}

export interface Class {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  student_count: number;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// Exam types
export interface Exam {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  duration_minutes: number;
  result_release_datetime: string;
  is_published: boolean;
  show_correct_answers: boolean;
  show_explanations: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  negative_marking_enabled: boolean;
  negative_marking_ratio: number;
  target_class_ids?: number[];
  question_count: number;
  is_active: boolean;
  is_upcoming: boolean;
  is_expired: boolean;
  results_released: boolean;
  created_by_name?: string;
  target_class_names?: string[];
  student_status?: string;
  created_at: string;
  updated_at?: string;
}

export interface ExamRules {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  duration_minutes: number;
  question_count: number;
  effective_duration: number;
  negative_marking_enabled: boolean;
  negative_marking_ratio: number;
}

// Question types
export interface Question {
  id: number;
  exam?: number;
  text: string;
  image?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer?: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string;
  order: number;
  options?: Record<string, string>;
  student_answer?: string | null;
  is_correct?: boolean | null;
}

// Attempt types
export interface ExamAttempt {
  id: number;
  exam: number;
  exam_title: string;
  student: number;
  student_name: string;
  started_at: string;
  submitted_at?: string;
  effective_duration: number;
  status: AttemptStatus;
  time_remaining: number;
  answers: Answer[];
  question_count: number;
  created_at: string;
}

export type AttemptStatus = 
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'auto_submitted'
  | 'graded'
  | 'result_released';

export interface Answer {
  id: number;
  question: number;
  selected_answer: string | null;
  is_marked: boolean;
  answered_at: string;
}

// Result types
export interface Result {
  id: number;
  attempt: number;
  exam_title: string;
  student_name: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  score: number;
  raw_score: number;
  rank: number | null;
  total_participants: number | null;
  exam_average: number | null;
  exam_highest: number | null;
  exam_lowest: number | null;
  difference_from_average: number | null;
  percentile: number | null;
  questions_review?: Question[];
  calculated_at: string;
}

export interface StudentHistory {
  id: number;
  attempt: number;
  exam_title: string;
  exam_date: string;
  submitted_at: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  score: number;
  rank: number | null;
  total_participants: number | null;
  exam_average: number | null;
}

export interface StudentStats {
  exams_taken: number;
  average_score: number;
  best_score: number;
  latest_rank: number | null;
  best_rank: number | null;
}

// Analytics types
export interface ExamAnalytics {
  exam_id: number;
  exam_title: string;
  total_participants: number;
  average_score: number;
  median_score: number;
  highest_score: number;
  lowest_score: number;
  score_distribution: ScoreDistribution[];
  question_statistics: QuestionStatistics[];
  class_comparison: ClassComparison[];
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface QuestionStatistics {
  id: number;
  question: number;
  question_text: string;
  question_order: number;
  correct_answer: string;
  total_attempts: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  option_a_count: number;
  option_b_count: number;
  option_c_count: number;
  option_d_count: number;
  correct_percentage: number;
  wrong_percentage: number;
  unanswered_percentage: number;
  difficulty_index: number;
}

export interface ClassComparison {
  class_name: string;
  average: number;
  count: number;
}

// Notification types
export interface Notification {
  id: number;
  exam: number;
  exam_title: string;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  success: false;
  error: {
    status_code: number;
    message: string;
    details?: any;
  };
}
