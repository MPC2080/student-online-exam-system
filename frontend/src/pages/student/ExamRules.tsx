import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../../services/examService';
import { attemptService } from '../../services/attemptService';
import { ExamRules as ExamRulesType } from '../../types';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const ExamRules = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rules, setRules] = useState<ExamRulesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [id]);

  const fetchRules = async () => {
    try {
      const data = await examService.getExamRules(Number(id));
      setRules(data);
    } catch (error) {
      console.error('Failed to fetch exam rules:', error);
      toast.error('خطا در دریافت اطلاعات آزمون');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!agreed) {
      toast.error('لطفاً قوانین را مطالعه کرده و تأیید کنید');
      return;
    }

    setIsStarting(true);
    try {
      const attempt = await attemptService.startExam(Number(id));
      navigate(`/student/exam/${attempt.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'خطا در شروع آزمون';
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!rules) {
    return (
      <div className="card text-center py-12">
        <HiOutlineExclamationCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          آزمون یافت نشد
        </h3>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {rules.title}
        </h1>

        {rules.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">{rules.description}</p>
        )}

        {/* Exam Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <HiOutlineDocumentText className="w-6 h-6 text-primary-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">تعداد سؤالات</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {rules.question_count} سؤال
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <HiOutlineClock className="w-6 h-6 text-primary-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">مدت آزمون</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {rules.effective_duration} دقیقه
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <HiOutlineCalendar className="w-6 h-6 text-primary-600" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">بازه دسترسی</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {new Date(rules.start_datetime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                {' تا '}
                {new Date(rules.end_datetime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {rules.negative_marking_enabled && (
            <div className="flex items-center gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <HiOutlineExclamationCircle className="w-6 h-6 text-warning-600" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">نمره منفی</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  هر {rules.negative_marking_ratio} غلط = حذف 1 صحیح
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-5 h-5" />
            قوانین آزمون
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
            <li className="flex items-start gap-2">
              <HiOutlineCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>پس از شروع آزمون، زمان شما شروع به کاهش می‌کند.</span>
            </li>
            <li className="flex items-start gap-2">
              <HiOutlineCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>در صورت بستن مرورگر، می‌توانید آزمون را ادامه دهید.</span>
            </li>
            <li className="flex items-start gap-2">
              <HiOutlineCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>پاسخ‌های شما به صورت خودکار ذخیره می‌شوند.</span>
            </li>
            <li className="flex items-start gap-2">
              <HiOutlineCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>پس از اتمام زمان، آزمون به صورت خودکار ارسال می‌شود.</span>
            </li>
            <li className="flex items-start gap-2">
              <HiOutlineCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>نتایج پس از زمان تعیین شده قابل مشاهده خواهند بود.</span>
            </li>
          </ul>
        </div>

        {/* Agreement */}
        <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700 dark:text-gray-300">
            قوانین آزمون را مطالعه کردم و با آن‌ها موافقم.
          </span>
        </label>

        {/* Start Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            بازگشت
          </button>
          <button
            onClick={handleStartExam}
            disabled={!agreed || isStarting}
            className="btn-primary flex-1"
          >
            {isStarting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                در حال شروع...
              </span>
            ) : (
              'شروع آزمون'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamRules;
