import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examService } from '../../services/examService';
import { adminService } from '../../services/adminService';
import { Exam, Class } from '../../types';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDocumentDuplicate,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineX,
} from 'react-icons/hi';

const ExamManagement = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    duration_minutes: 60,
    result_release_datetime: '',
    is_published: false,
    show_correct_answers: true,
    show_explanations: true,
    shuffle_questions: false,
    shuffle_options: false,
    negative_marking_enabled: false,
    negative_marking_ratio: 3,
    target_class_ids: [] as number[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsData, classesData] = await Promise.all([
        examService.getExams(),
        adminService.getClasses(),
      ]);
      setExams(examsData.results);
      setClasses(classesData.results);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await examService.updateExam(editingExam.id, formData);
        toast.success('آزمون با موفقیت ویرایش شد');
      } else {
        await examService.createExam(formData);
        toast.success('آزمون با موفقیت ایجاد شد');
      }
      setShowModal(false);
      setEditingExam(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'خطا در ذخیره اطلاعات';
      toast.error(message);
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      start_datetime: exam.start_datetime.slice(0, 16),
      end_datetime: exam.end_datetime.slice(0, 16),
      duration_minutes: exam.duration_minutes,
      result_release_datetime: exam.result_release_datetime.slice(0, 16),
      is_published: exam.is_published,
      show_correct_answers: exam.show_correct_answers,
      show_explanations: exam.show_explanations,
      shuffle_questions: exam.shuffle_questions,
      shuffle_options: exam.shuffle_options,
      negative_marking_enabled: exam.negative_marking_enabled,
      negative_marking_ratio: exam.negative_marking_ratio,
      target_class_ids: exam.target_class_ids || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این آزمون مطمئن هستید؟')) return;
    
    try {
      await examService.deleteExam(id);
      toast.success('آزمون با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      toast.error('خطا در حذف آزمون');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await examService.duplicateExam(id);
      toast.success('آزمون با موفقیت کپی شد');
      fetchData();
    } catch (error) {
      toast.error('خطا در کپی آزمون');
    }
  };

  const handleTogglePublish = async (id: number) => {
    try {
      const result = await examService.togglePublish(id);
      toast.success(result.message);
      fetchData();
    } catch (error) {
      toast.error('خطا در تغییر وضعیت انتشار');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_datetime: '',
      end_datetime: '',
      duration_minutes: 60,
      result_release_datetime: '',
      is_published: false,
      show_correct_answers: true,
      show_explanations: true,
      shuffle_questions: false,
      shuffle_options: false,
      negative_marking_enabled: false,
      negative_marking_ratio: 3,
      target_class_ids: [],
    });
  };

  const openCreateModal = () => {
    setEditingExam(null);
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
        <h1 className="text-2xl font-bold">مدیریت آزمون‌ها</h1>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" />
          ایجاد آزمون
        </button>
      </div>

      {/* Exams Grid */}
      {exams.length === 0 ? (
        <div className="card text-center py-12">
          <HiOutlineDocumentDuplicate className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            هنوز آزمونی ایجاد نشده
          </h3>
          <button onClick={openCreateModal} className="btn-primary mt-4">
            ایجاد اولین آزمون
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <div key={exam.id} className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {exam.title}
                  </h3>
                  {exam.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {exam.description}
                    </p>
                  )}
                </div>
                <span className={exam.is_published ? 'badge-success' : 'badge-warning'}>
                  {exam.is_published ? 'منتشر شده' : 'پیش‌نویس'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div>سؤالات: {exam.question_count}</div>
                <div>مدت: {exam.duration_minutes} دقیقه</div>
                <div>
                  شروع: {new Date(exam.start_datetime).toLocaleDateString('fa-IR')}
                </div>
                <div>
                  پایان: {new Date(exam.end_datetime).toLocaleDateString('fa-IR')}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/admin/exams/${exam.id}/questions`}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <HiOutlineClipboardList className="w-4 h-4" />
                  سؤالات
                </Link>
                <Link
                  to={`/admin/exams/${exam.id}/results`}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <HiOutlineChartBar className="w-4 h-4" />
                  نتایج
                </Link>
                <Link
                  to={`/admin/exams/${exam.id}/analytics`}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <HiOutlineChartBar className="w-4 h-4" />
                  آمار
                </Link>
                <button
                  onClick={() => handleEdit(exam)}
                  className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTogglePublish(exam.id)}
                  className={`p-2 rounded-lg ${
                    exam.is_published
                      ? 'text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20'
                      : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'
                  }`}
                >
                  {exam.is_published ? (
                    <HiOutlineEyeOff className="w-4 h-4" />
                  ) : (
                    <HiOutlineEye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDuplicate(exam.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <HiOutlineDocumentDuplicate className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(exam.id)}
                  className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingExam ? 'ویرایش آزمون' : 'ایجاد آزمون'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingExam(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">عنوان آزمون</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">توضیحات</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">زمان شروع دسترسی</label>
                  <input
                    type="datetime-local"
                    value={formData.start_datetime}
                    onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">زمان پایان دسترسی</label>
                  <input
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">مدت آزمون (دقیقه)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="input"
                    required
                    min={1}
                  />
                </div>
                <div>
                  <label className="label">زمان انتشار نتایج</label>
                  <input
                    type="datetime-local"
                    value={formData.result_release_datetime}
                    onChange={(e) => setFormData({ ...formData, result_release_datetime: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">کلاس‌های هدف (خالی = همه)</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.target_class_ids.includes(cls.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              target_class_ids: [...formData.target_class_ids, cls.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              target_class_ids: formData.target_class_ids.filter(id => id !== cls.id),
                            });
                          }
                        }}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{cls.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_correct_answers}
                    onChange={(e) => setFormData({ ...formData, show_correct_answers: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">نمایش پاسخ‌های صحیح پس از انتشار</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_explanations}
                    onChange={(e) => setFormData({ ...formData, show_explanations: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">نمایش پاسخ تشریحی پس از انتشار</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.negative_marking_enabled}
                    onChange={(e) => setFormData({ ...formData, negative_marking_enabled: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">فعال‌سازی نمره منفی</span>
                </label>
                {formData.negative_marking_enabled && (
                  <div className="mr-6">
                    <label className="label">ضریب نمره منفی (هر چند غلط = حذف 1 صحیح)</label>
                    <input
                      type="number"
                      value={formData.negative_marking_ratio}
                      onChange={(e) => setFormData({ ...formData, negative_marking_ratio: Number(e.target.value) })}
                      className="input w-32"
                      min={1}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingExam(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  انصراف
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingExam ? 'ذخیره تغییرات' : 'ایجاد آزمون'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;
