import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import {
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineChartBar,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await analyticsService.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
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

  const statCards = [
    {
      title: 'تعداد دانش‌آموزان',
      value: dashboard?.total_students || 0,
      icon: HiOutlineUserGroup,
      color: 'bg-blue-500',
      link: '/admin/students',
    },
    {
      title: 'تعداد آزمون‌ها',
      value: dashboard?.total_exams || 0,
      icon: HiOutlineDocumentText,
      color: 'bg-green-500',
      link: '/admin/exams',
    },
    {
      title: 'آزمون‌های فعال',
      value: dashboard?.active_exams || 0,
      icon: HiOutlineClipboardCheck,
      color: 'bg-yellow-500',
      link: '/admin/exams',
    },
    {
      title: 'شرکت‌کنندگان امروز',
      value: dashboard?.today_attempts || 0,
      icon: HiOutlineChartBar,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">داشبورد مدیریت</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const Card = stat.link ? Link : 'div';
          return (
            <Card
              key={index}
              to={stat.link}
              className="card-hover cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Exams */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">آخرین آزمون‌ها</h2>
          <Link
            to="/admin/exams"
            className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
          >
            مشاهده همه
            <HiOutlineArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {dashboard?.recent_exams && dashboard.recent_exams.length > 0 ? (
          <div className="space-y-3">
            {dashboard.recent_exams.map((exam: any) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{exam.title}</h3>
                  <p className="text-sm text-gray-500">
                    {exam.participants} شرکت‌کننده
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-primary-600">
                    {exam.average?.toFixed(1) || 0}%
                  </p>
                  <p className="text-xs text-gray-500">میانگین</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">هنوز آزمونی وجود ندارد</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/students"
          className="card-hover flex items-center gap-4"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
            <HiOutlineUserGroup className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">مدیریت دانش‌آموزان</h3>
            <p className="text-sm text-gray-500">افزودن، ویرایش و حذف دانش‌آموزان</p>
          </div>
        </Link>
        <Link
          to="/admin/exams"
          className="card-hover flex items-center gap-4"
        >
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
            <HiOutlineDocumentText className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">مدیریت آزمون‌ها</h3>
            <p className="text-sm text-gray-500">ایجاد و مدیریت آزمون‌ها</p>
          </div>
        </Link>
        <div className="card-hover flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
            <HiOutlineChartBar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">آمار و گزارش</h3>
            <p className="text-sm text-gray-500">مشاهده آمار و خروجی گرفتن</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
