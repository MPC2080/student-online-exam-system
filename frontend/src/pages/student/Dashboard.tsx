import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resultService } from '../../services/resultService';
import { examService } from '../../services/examService';
import { StudentStats, Exam, StudentHistory } from '../../types';
import {
  HiOutlineDocumentText,
  HiOutlineChartBar,

  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import { HiOutlineTrophy } from 'react-icons/hi2';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, examsData, progressData] = await Promise.all([
          resultService.getStats(),
          examService.getExams(),
          resultService.getProgress(),
        ]);
        setStats(statsData);
        setExams(examsData.results);
        setProgress(progressData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'آزمون‌های شرکت‌کرده',
      value: stats?.exams_taken || 0,
      icon: HiOutlineDocumentText,
      color: 'bg-blue-500',
    },
    {
      title: 'میانگین درصدها',
      value: `${stats?.average_score?.toFixed(1) || 0}%`,
      icon: HiOutlineChartBar,
      color: 'bg-green-500',
    },
    {
      title: 'بهترین درصد',
      value: `${stats?.best_score?.toFixed(1) || 0}%`,
      icon: HiOutlineTrophy,
      color: 'bg-yellow-500',
    },
    {
      title: 'آخرین رتبه',
      value: stats?.latest_rank ? `${stats.latest_rank}` : '-',
      icon: HiOutlineAcademicCap,
      color: 'bg-purple-500',
    },
  ];

  const getExamStatus = (exam: Exam) => {
    if (exam.student_status === 'submitted' || exam.student_status === 'auto_submitted' || 
        exam.student_status === 'graded' || exam.student_status === 'result_released') {
      return { label: 'شرکت‌شده', class: 'badge-success' };
    }
    if (exam.is_active) return { label: 'فعال', class: 'badge-success' };
    if (exam.is_upcoming) return { label: 'آینده', class: 'badge-warning' };
    if (exam.is_expired) return { label: 'پایان‌یافته', class: 'badge-danger' };
    return { label: 'نامشخص', class: 'badge-info' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="card bg-gradient-to-l from-primary-600 to-primary-700 text-white">
        <h1 className="text-2xl font-bold">سلام {user?.first_name || user?.username}! 👋</h1>
        <p className="mt-2 opacity-90">به سامانه آزمون آنلاین خوش آمدید</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card-hover">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Chart */}
      {progress.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">روند پیشرفت</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progress}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="exam_title"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Vazirmatn',
                  }}
                  formatter={(value: number) => [`${value}%`, 'درصد']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Available Exams */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">آزمون‌های در دسترس</h2>
          <Link
            to="/student/exams"
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
          >
            مشاهده همه
            <HiOutlineArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-8">
            <HiOutlineDocumentText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">هنوز آزمونی وجود ندارد</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.slice(0, 4).map((exam) => {
              const status = getExamStatus(exam);
              return (
                <div
                  key={exam.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {exam.title}
                    </h3>
                    <span className={status.class}>{status.label}</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <HiOutlineDocumentText className="w-4 h-4" />
                      <span>{exam.question_count} سؤال</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiOutlineClock className="w-4 h-4" />
                      <span>{exam.duration_minutes} دقیقه</span>
                    </div>
                  </div>
                  {exam.is_active && exam.student_status !== 'submitted' && 
                   exam.student_status !== 'auto_submitted' && 
                   exam.student_status !== 'graded' && 
                   exam.student_status !== 'result_released' && (
                    <Link
                      to={`/student/exams/${exam.id}/rules`}
                      className="mt-3 w-full btn-primary text-center block"
                    >
                      شروع آزمون
                    </Link>
                  )}
                  {(exam.student_status === 'graded' || exam.student_status === 'result_released') && (
                    <Link
                      to={`/student/result/${exam.id}`}
                      className="mt-3 w-full btn-secondary text-center block"
                    >
                      مشاهده نتیجه
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
