import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/student/Dashboard';
import ExamList from './pages/student/ExamList';
import ExamRules from './pages/student/ExamRules';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';
import ExamHistory from './pages/student/ExamHistory';
import StudentProfile from './pages/student/Profile';

import AdminDashboard from './pages/admin/Dashboard';
import StudentManagement from './pages/admin/StudentManagement';
import ExamManagement from './pages/admin/ExamManagement';
import QuestionManagement from './pages/admin/QuestionManagement';
import ExamResults from './pages/admin/ExamResults';
import ExamAnalytics from './pages/admin/ExamAnalytics';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'student')[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} replace />
            ) : (
              <Login />
            )
          }
        />
      </Route>

      {/* Student Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/exams" element={<ExamList />} />
        <Route path="/student/exams/:id/rules" element={<ExamRules />} />
        <Route path="/student/exam/:attemptId" element={<ExamPage />} />
        <Route path="/student/result/:attemptId" element={<ResultPage />} />
        <Route path="/student/history" element={<ExamHistory />} />
        <Route path="/student/profile" element={<StudentProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<StudentManagement />} />
        <Route path="/admin/exams" element={<ExamManagement />} />
        <Route path="/admin/exams/:examId/questions" element={<QuestionManagement />} />
        <Route path="/admin/exams/:examId/results" element={<ExamResults />} />
        <Route path="/admin/exams/:examId/analytics" element={<ExamAnalytics />} />
      </Route>

      {/* Default redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600">404</h1>
              <p className="mt-4 text-gray-600 dark:text-gray-400">صفحه مورد نظر یافت نشد</p>
              <a href="/" className="mt-4 inline-block btn-primary">
                بازگشت به صفحه اصلی
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
