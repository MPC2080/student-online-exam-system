import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { questionService } from '../../services/questionService';
import { Question } from '../../types';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUpload,
  HiOutlineX,
} from 'react-icons/hi';

const QuestionManagement = () => {
  const { examId } = useParams<{ examId: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    subject: '',
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    order: 1,
  });

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const fetchQuestions = async () => {
    try {
      const data = await questionService.getQuestions({ exam_id: examId });
      setQuestions(data.results);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingQuestion) {
        await questionService.updateQuestion(editingQuestion.id, {
          ...formData,
          exam: Number(examId),
        });
        toast.success('سؤال با موفقیت ویرایش شد');
      } else {
        await questionService.createQuestion({
          ...formData,
          exam: Number(examId),
        });
        toast.success('سؤال با موفقیت ایجاد شد');
      }
      setShowModal(false);
      setEditingQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'خطا در ذخیره سؤال';
      toast.error(message);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      text: question.text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer as 'A' | 'B' | 'C' | 'D',
      explanation: question.explanation || '',
      subject: question.subject || '',
      topic: question.topic || '',
      difficulty: question.difficulty,
      order: question.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این سؤال مطمئن هستید؟')) return;
    
    try {
      await questionService.deleteQuestion(id);
      toast.success('سؤال با موفقیت حذف شد');
      fetchQuestions();
    } catch (error) {
      toast.error('خطا در حذف سؤال');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    try {
      const result = await questionService.importQuestions(importFile, Number(examId));
      toast.success(`${result.imported_count} سؤال با موفقیت وارد شد`);
      if (result.error_count > 0) {
        toast.error(`${result.error_count} خطا در وارد کردن`);
      }
      setShowImportModal(false);
      setImportFile(null);
      fetchQuestions();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'خطا در وارد کردن سؤالات';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormData({
      text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      explanation: '',
      subject: '',
      topic: '',
      difficulty: 'medium',
      order: questions.length + 1,
    });
  };

  const openCreateModal = () => {
    setEditingQuestion(null);
    resetForm();
    setShowModal(true);
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">مدیریت سؤالات</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <HiOutlineUpload className="w-5 h-5" />
            وارد کردن از CSV
          </button>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-5 h-5" />
            افزودن سؤال
          </button>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            هنوز سؤالی اضافه نشده
          </h3>
          <p className="text-gray-500 mb-4">
            سؤالات را به صورت دستی یا از طریق فایل CSV وارد کنید.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={openCreateModal} className="btn-primary">
              افزودن سؤال
            </button>
            <button onClick={() => setShowImportModal(true)} className="btn-secondary">
              وارد کردن از CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
                    {question.order}
                  </span>
                  <div>
                    <span className={`badge ${
                      question.difficulty === 'easy' ? 'badge-success' :
                      question.difficulty === 'medium' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {question.difficulty === 'easy' ? 'آسان' :
                       question.difficulty === 'medium' ? 'متوسط' : 'سخت'}
                    </span>
                    {question.subject && (
                      <span className="badge-info mr-2">{question.subject}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(question)}
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-900 dark:text-white mb-3">{question.text}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
                  const isCorrect = question.correct_answer === option;
                  
                  return (
                    <div
                      key={option}
                      className={`p-2 rounded ${
                        isCorrect
                          ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <span className={`font-bold ${isCorrect ? 'text-success-700 dark:text-success-400' : ''}`}>
                        {option}.
                      </span>{' '}
                      {optionText}
                      {isCorrect && ' ✓'}
                    </div>
                  );
                })}
              </div>

              {question.explanation && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-400">
                  <strong>توضیح:</strong> {question.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingQuestion ? 'ویرایش سؤال' : 'افزودن سؤال'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingQuestion(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">متن سؤال</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="input"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">گزینه A</label>
                  <input
                    type="text"
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">گزینه B</label>
                  <input
                    type="text"
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">گزینه C</label>
                  <input
                    type="text"
                    value={formData.option_c}
                    onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">گزینه D</label>
                  <input
                    type="text"
                    value={formData.option_d}
                    onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">پاسخ صحیح</label>
                  <select
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as any })}
                    className="input"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="label">درس</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">سطح دشواری</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="input"
                  >
                    <option value="easy">آسان</option>
                    <option value="medium">متوسط</option>
                    <option value="hard">سخت</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">پاسخ تشریحی</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingQuestion(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  انصراف
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingQuestion ? 'ذخیره تغییرات' : 'ایجاد سؤال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">وارد کردن سؤالات</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">
                فایل CSV با ستون‌های زیر وارد کنید:
              </p>
              <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                text,option_a,option_b,option_c,option_d,correct_answer,explanation,subject,topic,difficulty
              </code>
            </div>

            <div className="mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="input"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 btn-secondary"
              >
                انصراف
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile}
                className="flex-1 btn-primary"
              >
                وارد کردن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionManagement;
