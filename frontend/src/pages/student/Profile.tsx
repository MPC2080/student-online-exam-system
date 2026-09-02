import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineAcademicCap,
} from 'react-icons/hi';
import { HiOutlineClock } from 'react-icons/hi2';
const StudentProfile = () => {
  const { user, updateUser } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('رمز عبور جدید و تکرار آن مطابقت ندارند');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('رمز عبور باید حداقل 8 کاراکتر باشد');
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      toast.success('رمز عبور با موفقیت تغییر کرد');
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'خطا در تغییر رمز عبور';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">پروفایل</h1>

      {/* User Info Card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-700 dark:text-primary-300">
              {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.full_name || user?.username}
            </h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <HiOutlineUser className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">نام کاربری</p>
              <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <HiOutlineAcademicCap className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">شناسه دانش‌آموزی</p>
              <p className="font-medium text-gray-900 dark:text-white">{user?.student_id || '-'}</p>
            </div>
          </div>
          {user?.classes && user.classes.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg sm:col-span-2">
              <HiOutlineAcademicCap className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">کلاس‌ها</p>
                <div className="flex gap-2 mt-1">
                  {user.classes.map((cls) => (
                    <span key={cls.id} className="badge-info">
                      {cls.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiOutlineLock className="w-5 h-5" />
            تغییر رمز عبور
          </h2>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="btn-secondary text-sm"
            >
              تغییر رمز عبور
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">رمز عبور فعلی</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">رمز عبور جدید</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="label">تکرار رمز عبور جدید</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
                minLength={8}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn-secondary"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? 'در حال ذخیره...' : 'ذخیره'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-500">
            برای تغییر رمز عبور خود، روی دکمه «تغییر رمز عبور» کلیک کنید.
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
