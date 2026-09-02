import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examService } from '../../services/examService';
import { Exam } from '../../types';
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const ExamList = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await examService.getExams();
      setExams(data.results);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExamStatus = (exam: Exam) => {
    if (exam.student_status === 'submitted' || exam.student_status === 'auto_submitted' || 
        exam.student_status === 'graded' || exam.student_status === 'result_released') {
      return { label: 'شرکت‌شده', class: 'badge-success', icon: HiOutlineCheckCircle };
    }
    if (exam.is_active) return { label: 'فعال', class: 'badge-success', icon: HiOutlineCheckCircle };
    if (exam.is_upcoming) return { label: 'آینده', class: 'badge-warning', icon: HiOutlineClock };
    if (exam.is_expired) return { label: 'پایان‌یافته', class: 'badge-danger', icon: HiOutlineExclamationCircle };
    return { label: 'نامشخص', class: 'badge-info', icon: HiOutlineDocumentText };
  };

  const filteredExams = exams.filter(exam => {
    if (filter === 'all') return true;
    if (filter === 'active') return exam.is_active;
    if (filter === 'upcoming') return exam.is_upcoming;
    if (filter === 'completed') return exam.student_status === 'submitted' || 
      exam.student_status === 'auto_submitted' || exam.student_status === 'graded' || 
      exam.student_status === 'result_released';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">آزمون‌ها</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'همه' },
          { key: 'active', label: 'فعال' },
          { key: 'upcoming', label: 'آینده' },
          { key: 'completed', label: 'شرکت‌کرده' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === item.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Exam List */}
      {filteredExams.length === 0 ? (
        <div className="card text-center py-12">
          <HiOutlineDocumentText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            آزمونی یافت نشد
          </h3>
          <p className="text-gray-500">
            {filter === 'all' ? 'هنوز آزمونی ایجاد نشده است.' : 'آزمونی با این فیلتر یافت نشد.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => {
            const status = getExamStatus(exam);
            const StatusIcon = status.icon;
            
            return (
              <div
                key={exam.id}
                className="card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {exam.title}
                  </h3>
                  <span className={`${status.class} flex items-center gap-1`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                </div>

                {exam.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                    {exam.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <HiOutlineDocumentText className="w-4 h-4 text-gray-400" />
                    <span>{exam.question_count} سؤال</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineClock className="w-4 h-4 text-gray-400" />
                    <span>{exam.duration_minutes} دقیقه</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {new Date(exam.start_datetime).toLocaleDateString('fa-IR')} -{' '}
                      {new Date(exam.end_datetime).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {exam.is_active && exam.student_status !== 'submitted' && 
                   exam.student_status !== 'auto_submitted' && 
                   exam.student_status !== 'graded' && 
                   exam.student_status !== 'result_released' && (
                    <Link
                      to={`/student/exams/${exam.id}/rules`}
                      className="flex-1 btn-primary text-center"
                    >
                      شروع آزمون
                    </Link>
                  )}
                  {(exam.student_status === 'graded' || exam.student_status === 'result_released') && (
                    <Link
                      to={`/student/result/${exam.id}`}
                      className="flex-1 btn-secondary text-center"
                    >
                      مشاهده نتیجه
                    </Link>
                  )}
                  {exam.is_upcoming && (
                    <div className="flex-1 text-center text-sm text-gray-500 py-2">
                      از {new Date(exam.start_datetime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExamList;
