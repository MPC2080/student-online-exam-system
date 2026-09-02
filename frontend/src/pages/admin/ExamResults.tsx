import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { resultService } from '../../services/resultService';
import { analyticsService } from '../../services/analyticsService';
import { Result } from '../../types';
import toast from 'react-hot-toast';
import {
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineEye,
} from 'react-icons/hi';
import { HiOutlineTrophy } from 'react-icons/hi2';
const ExamResults = () => {
  const { examId } = useParams<{ examId: string }>();
  const [results, setResults] = useState<Result[]>([]);
  const [exam, setExam] = useState<{ id: number; title: string } | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'name'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const fetchResults = async () => {
    try {
      const data = await resultService.getExamResults(Number(examId));
      setResults(data.results);
      setExam(data.exam);
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      await resultService.recalculateResults(Number(examId));
      toast.success('نتایج با موفقیت بازمحاسبه شدند');
      fetchResults();
    } catch (error) {
      toast.error('خطا در بازمحاسبه نتایج');
    }
  };

  const handleRelease = async () => {
    if (!confirm('آیا از انتشار نتایج مطمئن هستید؟')) return;
    
    try {
      await resultService.releaseResults(Number(examId));
      toast.success('نتایج با موفقیت منتشر شدند');
      fetchResults();
    } catch (error) {
      toast.error('خطا در انتشار نتایج');
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      await analyticsService.exportResults(Number(examId), format);
      toast.success('فایل با موفقیت دانلود شد');
    } catch (error) {
      toast.error('خطا در دانلود فایل');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'rank') {
      return sortOrder === 'asc' ? (a.rank || 999) - (b.rank || 999) : (b.rank || 0) - (a.rank || 0);
    }
    if (sortBy === 'score') {
      return sortOrder === 'asc' ? a.score - b.score : b.score - a.score;
    }
    return sortOrder === 'asc'
      ? a.student_name.localeCompare(b.student_name, 'fa')
      : b.student_name.localeCompare(a.student_name, 'fa');
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">نتایج آزمون</h1>
          {exam && <p className="text-gray-500">{exam.title}</p>}
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleRecalculate} className="btn-secondary flex items-center gap-2">
            <HiOutlineRefresh className="w-4 h-4" />
            بازمحاسبه
          </button>
          <button onClick={handleRelease} className="btn-success flex items-center gap-2">
            <HiOutlineEye className="w-4 h-4" />
            انتشار نتایج
          </button>
          <button onClick={() => handleExport('csv')} className="btn-secondary flex items-center gap-2">
            <HiOutlineDownload className="w-4 h-4" />
            CSV
          </button>
          <button onClick={() => handleExport('excel')} className="btn-secondary flex items-center gap-2">
            <HiOutlineDownload className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">شرکت‌کنندگان</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.count}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">میانگین</p>
            <p className="text-2xl font-bold text-primary-600">
              {statistics.average?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">بالاترین</p>
            <p className="text-2xl font-bold text-success-600">
              {statistics.highest?.toFixed(1) || 0}%
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">پایین‌ترین</p>
            <p className="text-2xl font-bold text-danger-600">
              {statistics.lowest?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => {
                    setSortBy('rank');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  رتبه {sortBy === 'rank' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => {
                    setSortBy('name');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  نام {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => {
                    setSortBy('score');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  درصد {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>صحیح</th>
                <th>غلط</th>
                <th>نزده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedResults.map((result) => (
                <tr key={result.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {result.rank && result.rank <= 3 && (
                        <HiOutlineTrophy className={`w-5 h-5 ${
                          result.rank === 1 ? 'text-yellow-500' :
                          result.rank === 2 ? 'text-gray-400' :
                          'text-orange-500'
                        }`} />
                      )}
                      <span className="font-bold">{result.rank || '-'}</span>
                    </div>
                  </td>
                  <td className="font-medium">{result.student_name}</td>
                  <td>
                    <span className={`font-bold text-lg ${
                      result.score >= 70 ? 'text-success-600' :
                      result.score >= 50 ? 'text-warning-600' :
                      'text-danger-600'
                    }`}>
                      {result.score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-success-600">{result.correct_count}</td>
                  <td className="text-danger-600">{result.wrong_count}</td>
                  <td className="text-gray-400">{result.unanswered_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            هنوز نتیجه‌ای وجود ندارد
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResults;
