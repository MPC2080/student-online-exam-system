import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { ExamAnalytics as ExamAnalyticsType } from '../../types';
import {
  HiOutlineChartBar,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const ExamAnalytics = () => {
  const { examId } = useParams<{ examId: string }>();
  const [analytics, setAnalytics] = useState<ExamAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [examId]);

  const fetchAnalytics = async () => {
    try {
      const data = await analyticsService.getExamAnalytics(Number(examId));
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card text-center py-12">
        <HiOutlineChartBar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          داده‌ای برای نمایش وجود ندارد
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">آمار و تحلیل آزمون</h1>
      <p className="text-gray-500">{analytics.exam_title}</p>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-sm text-gray-500">شرکت‌کنندگان</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {analytics.total_participants}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">میانگین</p>
          <p className="text-2xl font-bold text-primary-600">
            {analytics.average_score.toFixed(1)}%
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">میانه</p>
          <p className="text-2xl font-bold text-purple-600">
            {analytics.median_score.toFixed(1)}%
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">بالاترین</p>
          <p className="text-2xl font-bold text-success-600">
            {analytics.highest_score.toFixed(1)}%
          </p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">پایین‌ترین</p>
          <p className="text-2xl font-bold text-danger-600">
            {analytics.lowest_score.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HiOutlineChartBar className="w-5 h-5" />
          توزیع نمرات
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.score_distribution}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontFamily: 'Vazirmatn',
                }}
                formatter={(value: number) => [`${value} نفر`, 'تعداد']}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Comparison */}
      {analytics.class_comparison && analytics.class_comparison.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">مقایسه کلاس‌ها</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.class_comparison}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="class_name" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontFamily: 'Vazirmatn',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'میانگین']}
                />
                <Bar dataKey="average" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Question Statistics */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HiOutlineDocumentText className="w-5 h-5" />
          آمار سؤالات
        </h2>
        
        <div className="space-y-4">
          {analytics.question_statistics.map((qStat) => (
            <div key={qStat.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge-info">سؤال {qStat.question_order}</span>
                  <span className="mr-2 text-sm text-gray-500">
                    پاسخ صحیح: {qStat.correct_answer}
                  </span>
                </div>
                <span className={`badge ${
                  qStat.correct_percentage >= 70 ? 'badge-success' :
                  qStat.correct_percentage >= 40 ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {qStat.correct_percentage.toFixed(1)}% صحیح
                </span>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                {qStat.question_text}
              </p>

              {/* Option distribution */}
              <div className="grid grid-cols-4 gap-2">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const count = qStat[`option_${option.toLowerCase()}_count` as keyof typeof qStat] as number;
                  const percentage = qStat.total_attempts > 0 
                    ? (count / qStat.total_attempts * 100).toFixed(0)
                    : '0';
                  const isCorrect = qStat.correct_answer === option;
                  
                  return (
                    <div
                      key={option}
                      className={`p-2 rounded text-center text-sm ${
                        isCorrect
                          ? 'bg-success-100 dark:bg-success-900/20 border border-success-300 dark:border-success-700'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className={`font-bold ${isCorrect ? 'text-success-700 dark:text-success-400' : ''}`}>
                        {option}
                      </div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                      <div className="text-xs text-gray-400">({count})</div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div
                  className="bg-success-500"
                  style={{ width: `${qStat.correct_percentage}%` }}
                />
                <div
                  className="bg-danger-500"
                  style={{ width: `${qStat.wrong_percentage}%` }}
                />
                <div
                  className="bg-gray-400"
                  style={{ width: `${qStat.unanswered_percentage}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>صحیح: {qStat.correct_percentage.toFixed(0)}%</span>
                <span>غلط: {qStat.wrong_percentage.toFixed(0)}%</span>
                <span>نزده: {qStat.unanswered_percentage.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamAnalytics;
