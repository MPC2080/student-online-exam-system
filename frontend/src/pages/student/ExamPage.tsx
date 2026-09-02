import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService } from '../../services/attemptService';
import { Question, Answer, ExamAttempt } from '../../types';
import toast from 'react-hot-toast';
import {
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineFlag,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi';

const ExamPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAnswersRef = useRef<Map<number, { selected_answer: string | null; is_marked: boolean }>>(new Map());

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await attemptService.continueExam(Number(attemptId));
        setAttempt(data.attempt);
        setQuestions(data.questions);
        setTimeRemaining(data.time_remaining);
        
        // Initialize answers map
        const answersMap = new Map<number, Answer>();
        data.answers.forEach((answer: Answer) => {
          answersMap.set(answer.question, answer);
        });
        setAnswers(answersMap);
      } catch (error: any) {
        const message = error.response?.data?.error?.message || 'خطا در بارگذاری آزمون';
        toast.error(message);
        navigate('/student');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExam();
  }, [attemptId, navigate]);

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0 || !attempt) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto submit
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining > 0, attempt]);

  // Autosave
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      savePendingAnswers();
    }, 10000); // Autosave every 10 seconds

    return () => {
      if (autosaveRef.current) {
        clearInterval(autosaveRef.current);
      }
    };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('اتصال برقرار شد');
      savePendingAnswers();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('اتصال قطع شد');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage for recovery
  useEffect(() => {
    const answersObj: Record<number, any> = {};
    answers.forEach((answer, questionId) => {
      answersObj[questionId] = {
        selected_answer: answer.selected_answer,
        is_marked: answer.is_marked,
      };
    });
    localStorage.setItem(`exam_${attemptId}_answers`, JSON.stringify(answersObj));
  }, [answers, attemptId]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`exam_${attemptId}_answers`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([questionId, data]: [string, any]) => {
          pendingAnswersRef.current.set(Number(questionId), data);
        });
      } catch (e) {
        console.error('Failed to parse saved answers:', e);
      }
    }
  }, [attemptId]);

  const savePendingAnswers = async () => {
    if (pendingAnswersRef.current.size === 0) return;
    
    const answersToSave = Array.from(pendingAnswersRef.current.entries()).map(([questionId, data]) => ({
      question_id: questionId,
      selected_answer: data.selected_answer,
      is_marked: data.is_marked,
    }));

    try {
      await attemptService.saveBulkAnswers(Number(attemptId), answersToSave);
      pendingAnswersRef.current.clear();
    } catch (error) {
      console.error('Failed to save answers:', error);
    }
  };

  const handleAnswerSelect = (questionId: number, selectedAnswer: string) => {
    const currentAnswer = answers.get(questionId);
    const newAnswer: Answer = {
      id: currentAnswer?.id || 0,
      question: questionId,
      selected_answer: selectedAnswer,
      is_marked: currentAnswer?.is_marked || false,
      answered_at: new Date().toISOString(),
    };

    setAnswers(prev => new Map(prev).set(questionId, newAnswer));
    
    // Add to pending
    pendingAnswersRef.current.set(questionId, {
      selected_answer: selectedAnswer,
      is_marked: currentAnswer?.is_marked || false,
    });

    // Save immediately
    saveAnswer(questionId, selectedAnswer, currentAnswer?.is_marked || false);
  };

  const handleMarkQuestion = (questionId: number) => {
    const currentAnswer = answers.get(questionId);
    const newMarked = !currentAnswer?.is_marked;
    
    const newAnswer: Answer = {
      ...currentAnswer!,
      is_marked: newMarked,
    };

    setAnswers(prev => new Map(prev).set(questionId, newAnswer));
    
    pendingAnswersRef.current.set(questionId, {
      selected_answer: currentAnswer?.selected_answer || null,
      is_marked: newMarked,
    });
  };

  const saveAnswer = async (questionId: number, selectedAnswer: string | null, isMarked: boolean) => {
    try {
      await attemptService.saveAnswer(Number(attemptId), questionId, selectedAnswer, isMarked);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      await attemptService.autoSubmit(Number(attemptId));
      localStorage.removeItem(`exam_${attemptId}_answers`);
      toast.success('زمان آزمون به پایان رسید. آزمون ارسال شد.');
      navigate(`/student/result/${attemptId}`);
    } catch (error) {
      console.error('Auto submit failed:', error);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await savePendingAnswers();
      await attemptService.submitExam(Number(attemptId));
      localStorage.removeItem(`exam_${attemptId}_answers`);
      toast.success('آزمون با موفقیت ارسال شد');
      navigate(`/student/result/${attemptId}`);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'خطا در ارسال آزمون';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswerStats = () => {
    let answered = 0;
    let unanswered = 0;
    let marked = 0;

    questions.forEach(q => {
      const answer = answers.get(q.id);
      if (answer?.selected_answer) {
        answered++;
      } else {
        unanswered++;
      }
      if (answer?.is_marked) {
        marked++;
      }
    });

    return { answered, unanswered, marked };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری آزمون...</p>
        </div>
      </div>
    );
  }

  if (!attempt || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <HiOutlineExclamationCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">آزمون یافت نشد</h2>
          <button onClick={() => navigate('/student')} className="btn-primary">
            بازگشت به داشبورد
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion.id);
  const stats = getAnswerStats();
  const isTimeWarning = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {attempt.exam_title}
              </h1>
              <p className="text-sm text-gray-500">
                سؤال {currentIndex + 1} از {questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection status */}
              {!isOnline && (
                <span className="badge-danger flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  قطع اتصال
                </span>
              )}
              
              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
                isTimeWarning 
                  ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400 animate-pulse-warning' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                <HiOutlineClock className="w-5 h-5" />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <div className="card">
              {/* Question */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="badge-info">
                    سؤال {currentQuestion.order}
                  </span>
                  <button
                    onClick={() => handleMarkQuestion(currentQuestion.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                      currentAnswer?.is_marked
                        ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <HiOutlineFlag className="w-4 h-4" />
                    {currentAnswer?.is_marked ? 'علامت‌گذاری شده' : 'علامت‌گذاری'}
                  </button>
                </div>
                
                <p className="text-lg text-gray-900 dark:text-white leading-relaxed">
                  {currentQuestion.text}
                </p>
                
                {currentQuestion.image && (
                  <img
                    src={currentQuestion.image}
                    alt="تصویر سؤال"
                    className="mt-4 max-w-full rounded-lg"
                  />
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
                  const isSelected = currentAnswer?.selected_answer === option;
                  
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-right ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {option}
                      </span>
                      <span className={`flex-1 ${
                        isSelected
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {optionText}
                      </span>
                      {isSelected && (
                        <HiOutlineCheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="btn-secondary flex items-center gap-2"
                >
                  <HiOutlineChevronRight className="w-5 h-5" />
                  سؤال قبلی
                </button>
                
                <span className="text-sm text-gray-500">
                  {currentIndex + 1} / {questions.length}
                </span>
                
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="btn-primary flex items-center gap-2"
                  >
                    سؤال بعدی
                    <HiOutlineChevronLeft className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="btn-success flex items-center gap-2"
                  >
                    اتمام و ارسال آزمون
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                نقشه سؤالات
              </h3>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                <div className="p-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <div className="font-bold text-success-700 dark:text-success-400">{stats.answered}</div>
                  <div className="text-success-600 dark:text-success-500">پاسخ داده</div>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="font-bold text-gray-700 dark:text-gray-300">{stats.unanswered}</div>
                  <div className="text-gray-600 dark:text-gray-400">بدون پاسخ</div>
                </div>
                <div className="p-2 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                  <div className="font-bold text-warning-700 dark:text-warning-400">{stats.marked}</div>
                  <div className="text-warning-600 dark:text-warning-500">علامت‌دار</div>
                </div>
              </div>

              {/* Question grid */}
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const answer = answers.get(q.id);
                  const isCurrent = index === currentIndex;
                  const isAnswered = !!answer?.selected_answer;
                  const isMarked = answer?.is_marked;

                  let bgColor = 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                  if (isCurrent) {
                    bgColor = 'bg-primary-600 text-white';
                  } else if (isMarked) {
                    bgColor = 'bg-warning-500 text-white';
                  } else if (isAnswered) {
                    bgColor = 'bg-success-500 text-white';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-full aspect-square rounded-lg font-medium text-sm flex items-center justify-center transition-colors ${bgColor}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-success-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">پاسخ داده شده</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-warning-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">علامت‌گذاری شده</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded border"></div>
                  <span className="text-gray-600 dark:text-gray-400">بدون پاسخ</span>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full btn-danger mt-4"
              >
                اتمام و ارسال آزمون
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              ارسال آزمون
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              آیا از ارسال آزمون مطمئن هستید؟
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                <span className="text-success-700 dark:text-success-400">پاسخ داده شده</span>
                <span className="font-bold text-success-700 dark:text-success-400">{stats.answered}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">بدون پاسخ</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{stats.unanswered}</span>
              </div>
              <div className="flex justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                <span className="text-warning-700 dark:text-warning-400">علامت‌گذاری شده</span>
                <span className="font-bold text-warning-700 dark:text-warning-400">{stats.marked}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 btn-secondary"
              >
                بازگشت
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 btn-success"
              >
                {isSubmitting ? 'در حال ارسال...' : 'تأیید و ارسال'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
