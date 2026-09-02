# خلاصه پروژه سامانه آزمون آنلاین

## ✅ وضعیت پروژه: آماده اجرا

پروژه با موفقیت ساخته و تست شده است. هر دو بخش Backend و Frontend کار می‌کنند.

## 🚀 نحوه اجرا

### Backend (پورت 8000)
```bash
cd backend
python manage.py migrate
python manage.py seed_data
python manage.py runserver 0.0.0.0:8000
```

### Frontend (پورت 5173)
```bash
cd frontend
npm install
npm run dev
```

### Docker (همه خدمات)
```bash
docker compose up --build
```

## 🔐 اطلاعات ورود

| نقش | نام کاربری | رمز عبور |
|------|-----------|----------|
| مدیر | admin | admin123 |
| دانش‌آموز | student001 | student123 |
| دانش‌آموز | student002 | student123 |
| ... | student003 تا student040 | student123 |

## 📊 داده‌های آزمایشی

- ✅ 1 مدیر
- ✅ 40 دانش‌آموز
- ✅ 3 کلاس
- ✅ 4 آزمون (2 فعال، 1 آینده، 1 پایان‌یافته)
- ✅ 10 سؤال (5 ریاضی، 3 فیزیک، 2 شیمی)
- ✅ نتایج آزمون‌های قبلی

## 🎯 ویژگی‌های پیاده‌سازی شده

### Backend (Django)
- ✅ مدل‌های دیتابیس با روابط مناسب
- ✅ APIهای RESTful کامل
- ✅ احراز هویت JWT
- ✅ کنترل دسترسی مبتنی بر نقش
- ✅ مدیریت زمان‌بندی آزمون
- ✅ محاسبه خودکار نتایج
- ✅ رتبه‌بندی با مدیریت تساوی
- ✅ آمار و تحلیل سؤالات
- ✅ خروجی CSV/Excel
- ✅ Seed data

### Frontend (React)
- ✅ طراحی مدرن و واکنش‌گرا
- ✅ حالت تاریک/روشن
- ✅ داشبورد دانش‌آموز با نمودار
- ✅ صفحه آزمون با تایمر
- ✅ نقشه سؤالات
- ✅ ذخیره خودکار پاسخ‌ها
- ✅ ارسال خودکار در پایان زمان
- ✅ کارنامه با نمودار مقایسه
- ✅ بررسی پاسخ‌ها با توضیحات
- ✅ پنل مدیریت کامل
- ✅ مدیریت دانش‌آموزان
- ✅ مدیریت آزمون‌ها و سؤالات
- ✅ آمار و تحلیل با نمودار

## 📁 ساختار فایل‌ها

```
online-exam-system/
├── backend/
│   ├── apps/
│   │   ├── accounts/      # مدیریت کاربران
│   │   ├── exams/         # آزمون‌ها
│   │   ├── questions/     # سؤالات
│   │   ├── attempts/      # تلاش‌ها
│   │   ├── results/       # نتایج
│   │   └── analytics/     # آمار
│   ├── config/            # تنظیمات
│   └── manage.py
├── frontend/
│   └── src/
│       ├── pages/         # صفحات
│       ├── services/      # سرویس‌ها
│       ├── context/       # کانتکست‌ها
│       └── types/         # تایپ‌ها
├── docker-compose.yml
└── README.md
```

## ⚠️ محدودیت‌ها

1. سیستم ضدتقلب کامل نیست (فقط اقدامات پایه)
2. بدون ارسال ایمیل/SMS
3. بدون سیستم پرداخت
4. بدون بکاپ خودکار

## 🔧 تست API

```bash
# ورود
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# لیست آزمون‌ها (با توکن)
curl http://localhost:8000/api/exams/ \
  -H "Authorization: Bearer <token>"
```
