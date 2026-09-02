import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resultService } from '../../services/resultService';
import { Result, Question } from '../../types';
import {
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineMinusCircle,
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';
import { HiOutlineTrophy } from 'react-icons/hi2';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const ResultPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<Result | null>(null);
  const [notReleased, setNotReleased] = useState(false);
  const [releaseTime, setReleaseTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      const data = await resultService.getResult(Number(attemptId));
      if ('status' in data && data.status === 'not_released') {
        setNotReleased(true);
        setReleaseTime(data.release_time);
      } else {
        setResult(data as Result);
      }
    } catch (error) {
      console.error('Failed to fetch result:', error);
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

  if (notReleased) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <HiOutlineExclamationCircle className="w-20 h-20 text-warning-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            نتایج هنوز منتشر نشده
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            نتایج این آزمون هنوز منتشر نشده است.
          </p>
          {releaseTime && (
            <p className="text-sm text-gray-400">
              زمان انتشار: {new Date(releaseTime).toLocaleString('fa-IR')}
            </p>
          )}
          <Link to="/student" className="btn-primary mt-6 inline-block">
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <HiOutlineExclamationCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            نتیجه‌ای یافت نشد
          </h2>
          <Link to="/student" className="btn-primary mt-4 inline-block">
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    );
  }

  const comparisonData = [
    { name: 'شما', score: result.score, fill: '#3b82f6' },
    { name: 'میانگین', score: result.exam_average || 0, fill: '#9ca3af' },
    { name: 'بالاترین', score: result.exam_highest || 0, fill: '#22c55e' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-primary-700 text-white">
        <h1 className="text-2xl font-bold">{result.exam_title}</h1>
        <p className="mt-1 opacity-90">کارنامه آزمون</p>
      </div>

      {/* Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-5xl font-bold text-primary-600 mb-2">
            {result.score.toFixed(1)}%
          </div>
          <p className="text-gray-500">درصد شما</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HiOutlineTrophy className="w-8 h-8 text-warning-500" />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {result.rank || '-'}
            </span>
          </div>
          <p className="text-gray-500">
            رتبه از {result.total_participants || '-'}
          </p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div>
              <div className="text-2xl font-bold text-success-600">{result.correct_count}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <HiOutlineCheckCircle className="w-3 h-3" />
                صحیح
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-danger-600">{result.wrong_count}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <HiOutlineXCircle className="w-3 h-3" />
                غلط
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-400">{result.unanswered_count}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <HiOutlineMinusCircle className="w-3 h-3" />
                نزده
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HiOutlineChartBar className="w-5 h-5" />
          مقایسه عملکرد
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontFamily: 'Vazirmatn',
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'درصد']}
              />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {result.exam_average !== null && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <div className="text-lg font-bold text-primary-700 dark:text-primary-400">
                {result.score.toFixed(1)}%
              </div>
              <div className="text-xs text-primary-600 dark:text-primary-500">درصد شما</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                {result.exam_average.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">میانگین</div>
            </div>
            <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <div className={`text-lg font-bold ${
                (result.difference_from_average || 0) >= 0
                  ? 'text-success-700 dark:text-success-400'
                  : 'text-danger-700 dark:text-danger-400'
              }`}>
                {(result.difference_from_average || 0) >= 0 ? '+' : ''}
                {(result.difference_from_average || 0).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">اختلاف با میانگین</div>
            </div>
          </div>
        )}
      </div>

      {/* Review Button */}
      {result.questions_review && result.questions_review.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowReview(!showReview)}
            className="w-full btn-primary"
          >
            {showReview ? 'بستن بررسی پاسخ‌ها' : 'بررسی پاسخ‌ها'}
          </button>
        </div>
      )}

      {/* Question Review */}
      {showReview && result.questions_review && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">بررسی پاسخ‌ها</h2>
          
          {result.questions_review.map((question: Question, index: number) => {
            const isCorrect = question.is_correct;
            const hasAnswer = question.student_answer !== null && question.student_answer !== undefined;
            
            return (
              <div key={question.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <span className="badge-info">سؤال {question.order}</span>
                  {isCorrect === true && (
                    <span className="badge-success flex items-center gap-1">
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      صحیح
                    </span>
                  )}
                  {isCorrect === false && (
                    <span className="badge-danger flex items-center gap-1">
                      <HiOutlineXCircle className="w-4 h-4" />
                      غلط
                    </span>
                  )}
                  {isCorrect === null && (
                    <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 flex items-center gap-1">
                      <HiOutlineMinusCircle className="w-4 h-4" />
                      نزده
                    </span>
                  )}
                </div>

                <p className="text-gray-900 dark:text-white mb-4">{question.text}</p>

                <div className="space-y-2 mb-4">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
                    const isStudentAnswer = question.student_answer === option;
                    const isCorrectAnswer = question.correct_answer === option;
                    
                    let bgColor = 'bg-gray-50 dark:bg-gray-700';
                    let borderColor = 'border-gray-200 dark:border-gray-600';
                    let textColor = 'text-gray-700 dark:text-gray-300';
                    
                    if (isCorrectAnswer) {
                      bgColor = 'bg-success-50 dark:bg-success-900/20';
                      borderColor = 'border-success-300 dark:border-success-700';
                      textColor = 'text-success-700 dark:text-success-400';
                    } else if (isStudentAnswer && !isCorrectAnswer) {
                      bgColor = 'bg-danger-50 dark:bg-danger-900/20';
                      borderColor = 'border-danger-300 dark:border-danger-700';
                      textColor = 'text-danger-700 dark:text-danger-400';
                    }

                    return (
                      <div
                        key={option}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${bgColor} ${borderColor}`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isCorrectAnswer
                            ? 'bg-success-500 text-white'
                            : isStudentAnswer
                            ? 'bg-danger-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                        }`}>
                          {option}
                        </span>
                        <span className={`flex-1 ${textColor}`}>{optionText}</span>
                        {isCorrectAnswer && (
                          <HiOutlineCheckCircle className="w-5 h-5 text-success-500" />
                        )}
                        {isStudentAnswer && !isCorrectAnswer && (
                          <HiOutlineXCircle className="w-5 h-5 text-danger-500" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      پاسخ تشریحی:
                    </h4>
                    <p className="text-blue-800 dark:text-blue-400 text-sm">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-center">
        <Link to="/student" className="btn-secondary flex items-center gap-2">
          <HiOutlineArrowLeft className="w-5 h-5" />
          بازگشت به داشبورد
        </Link>
      </div>
    </div>
  );
};

export default ResultPage;
