import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resultService } from '../../services/resultService';
import { StudentHistory } from '../../types';
import {
  HiOutlineDocumentText,
  HiOutlineChartBar,

  HiOutlineArrowLeft,
} from 'react-icons/hi';
import { HiOutlineTrophy } from 'react-icons/hi2';
const ExamHistory = () => {
  const [history, setHistory] = useState<StudentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await resultService.getHistory();
      setHistory(data.results);
    } catch (error) {
      console.error('Failed to fetch history:', error);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">تاریخچه آزمون‌ها</h1>

      {history.length === 0 ? (
        <div className="card text-center py-12">
          <HiOutlineDocumentText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            هنوز در هیچ آزمونی شرکت نکرده‌اید
          </h3>
          <p className="text-gray-500 mb-4">
            پس از شرکت در آزمون، نتایج شما در اینجا نمایش داده خواهد شد.
          </p>
          <Link to="/student/exams" className="btn-primary inline-block">
            مشاهده آزمون‌ها
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th>آزمون</th>
                    <th>تاریخ</th>
                    <th>درصد</th>
                    <th>رتبه</th>
                    <th>صحیح</th>
                    <th>غلط</th>
                    <th>نزده</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.exam_title}</td>
                      <td className="text-gray-500">
                        {new Date(item.submitted_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td>
                        <span className={`font-bold ${
                          item.score >= 70 ? 'text-success-600' :
                          item.score >= 50 ? 'text-warning-600' :
                          'text-danger-600'
                        }`}>
                          {item.score.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        {item.rank ? (
                          <span className="flex items-center gap-1">
                            <HiOutlineTrophy className="w-4 h-4 text-warning-500" />
                            {item.rank} از {item.total_participants}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="text-success-600">{item.correct_count}</td>
                      <td className="text-danger-600">{item.wrong_count}</td>
                      <td className="text-gray-400">{item.unanswered_count}</td>
                      <td>
                        <Link
                          to={`/student/result/${item.attempt}`}
                          className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          مشاهده
                          <HiOutlineArrowLeft className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {history.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.exam_title}
                  </h3>
                  <span className={`text-2xl font-bold ${
                    item.score >= 70 ? 'text-success-600' :
                    item.score >= 50 ? 'text-warning-600' :
                    'text-danger-600'
                  }`}>
                    {item.score.toFixed(1)}%
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 mb-3">
                  {new Date(item.submitted_at).toLocaleDateString('fa-IR')}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="font-bold text-gray-700 dark:text-gray-300">
                      {item.total_questions}
                    </div>
                    <div className="text-gray-500">کل</div>
                  </div>
                  <div className="p-2 bg-success-50 dark:bg-success-900/20 rounded">
                    <div className="font-bold text-success-600">{item.correct_count}</div>
                    <div className="text-success-500">صحیح</div>
                  </div>
                  <div className="p-2 bg-danger-50 dark:bg-danger-900/20 rounded">
                    <div className="font-bold text-danger-600">{item.wrong_count}</div>
                    <div className="text-danger-500">غلط</div>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="font-bold text-gray-400">{item.unanswered_count}</div>
                    <div className="text-gray-500">نزده</div>
                  </div>
                </div>

                {item.rank && (
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-500">رتبه:</span>
                    <span className="font-medium flex items-center gap-1">
                      <HiOutlineTrophy className="w-4 h-4 text-warning-500" />
                      {item.rank} از {item.total_participants}
                    </span>
                  </div>
                )}

                <Link
                  to={`/student/result/${item.attempt}`}
                  className="w-full btn-secondary text-center block"
                >
                  مشاهده جزئیات
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExamHistory;
