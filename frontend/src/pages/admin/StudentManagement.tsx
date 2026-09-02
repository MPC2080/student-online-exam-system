import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { User, Class } from '../../types';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineX,
} from 'react-icons/hi';

const StudentManagement = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    student_id: '',
    phone_number: '',
    class_ids: [] as number[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        adminService.getStudents(),
        adminService.getClasses(),
      ]);
      setStudents(studentsData.results);
      setClasses(classesData.results);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const data = await adminService.getStudents({ search });
      setStudents(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await adminService.updateStudent(editingStudent.id, formData);
        toast.success('دانش‌آموز با موفقیت ویرایش شد');
      } else {
        await adminService.createStudent(formData as any);
        toast.success('دانش‌آموز با موفقیت ایجاد شد');
      }
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'خطا در ذخیره اطلاعات';
      toast.error(message);
    }
  };

  const handleEdit = (student: User) => {
    setEditingStudent(student);
    setFormData({
      username: student.username,
      password: '',
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email || '',
      student_id: student.student_id || '',
      phone_number: student.phone_number || '',
      class_ids: student.classes?.map(c => c.id) || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این دانش‌آموز مطمئن هستید؟')) return;
    
    try {
      await adminService.deleteStudent(id);
      toast.success('دانش‌آموز با موفقیت حذف شد');
      fetchData();
    } catch (error) {
      toast.error('خطا در حذف دانش‌آموز');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      email: '',
      student_id: '',
      phone_number: '',
      class_ids: [],
    });
  };

  const openCreateModal = () => {
    setEditingStudent(null);
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
        <h1 className="text-2xl font-bold">مدیریت دانش‌آموزان</h1>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" />
          افزودن دانش‌آموز
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="جستجو بر اساس نام، نام خانوادگی، نام کاربری یا شناسه..."
              className="input pr-10"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary">
            جستجو
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th>نام</th>
                <th>نام کاربری</th>
                <th>شناسه دانش‌آموزی</th>
                <th>کلاس</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="font-medium">{student.full_name}</td>
                  <td className="font-mono text-sm">{student.username}</td>
                  <td>{student.student_id || '-'}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {student.classes?.map((cls) => (
                        <span key={cls.id} className="badge-info text-xs">
                          {cls.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={student.is_active_student ? 'badge-success' : 'badge-danger'}>
                      {student.is_active_student ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {students.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            دانش‌آموزی یافت نشد
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingStudent ? 'ویرایش دانش‌آموز' : 'افزودن دانش‌آموز'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingStudent(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">نام</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">نام خانوادگی</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">نام کاربری</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  required
                  disabled={!!editingStudent}
                />
              </div>

              {!editingStudent && (
                <div>
                  <label className="label">رمز عبور</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required={!editingStudent}
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="label">شناسه دانش‌آموزی</label>
                <input
                  type="text"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">ایمیل</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">شماره تلفن</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">کلاس‌ها</label>
                <div className="space-y-2">
                  {classes.map((cls) => (
                    <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.class_ids.includes(cls.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              class_ids: [...formData.class_ids, cls.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              class_ids: formData.class_ids.filter(id => id !== cls.id),
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStudent(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  انصراف
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingStudent ? 'ذخیره تغییرات' : 'ایجاد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
