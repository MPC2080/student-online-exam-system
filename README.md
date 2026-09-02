# سامانه آزمون آنلاین دانش‌آموزان

یک سامانه کامل، مدرن و حرفه‌ای برای برگزاری آزمون‌های آنلاین با قابلیت‌های پیشرفته مدیریت، تحلیل نتایج و گزارش‌گیری.

## ✨ ویژگی‌ها

### پنل مدیر (Admin)
- ✅ مدیریت کامل دانش‌آموزان (ایجاد، ویرایش، حذف)
- ✅ مدیریت کلاس‌ها و گروه‌ها
- ✅ ایجاد و مدیریت آزمون‌ها
- ✅ مدیریت سؤالات با بانک سؤالات
- ✅ وارد کردن سؤالات از فایل CSV
- ✅ تعیین زمان‌بندی و بازه دسترسی آزمون
- ✅ مشاهده نتایج و رتبه‌بندی
- ✅ آمار و تحلیل کامل آزمون‌ها
- ✅ خروجی گرفتن از نتایج (CSV/Excel)
- ✅ نمودارهای تحلیلی

### پنل دانش‌آموز (Student)
- ✅ داشبورد با آمار کلی
- ✅ مشاهده آزمون‌های فعال و آینده
- ✅ شرکت در آزمون با تایمر
- ✅ ذخیره خودکار پاسخ‌ها
- ✅ علامت‌گذاری سؤالات
- ✅ نقشه سؤالات برای ناوبری سریع
- ✅ مشاهده کارنامه و نتایج
- ✅ بررسی پاسخ‌ها با توضیحات تشریحی
- ✅ نمودار پیشرفت
- ✅ مقایسه عملکرد با میانگین

### امکانات فنی
- ✅ احراز هویت JWT
- ✅ کنترل دسترسی مبتنی بر نقش
- ✅ ذخیره خودکار پاسخ‌ها
- ✅ ارسال خودکار آزمون در پایان زمان
- ✅ جلوگیری از دستکاری تایمر
- ✅ حالت تاریک/روشن
- ✅ طراحی واکنش‌گرا (Responsive)
- ✅ پشتیبانی از 90 کاربر هم‌زمان

## 🛠️ تکنولوژی‌ها

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- React Icons

### Backend
- Django 4.2
- Django REST Framework
- Simple JWT
- PostgreSQL (آماده برای Production)
- SQLite (برای Development)

### DevOps
- Docker & Docker Compose
- Gunicorn
- Nginx (آماده برای Deployment)

## 📦 نصب و راه‌اندازی

### پیش‌نیازها
- Python 3.10+
- Node.js 18+
- npm یا yarn
- Docker و Docker Compose (اختیاری)

### روش 1: اجرای محلی (بدون Docker)

#### 1. کلون کردن پروژه
```bash
git clone <repository-url>
cd online-exam-system
```

#### 2. راه‌اندازی Backend
```bash
cd backend

# ایجاد محیط مجازی
python -m venv venv
source venv/bin/activate  # در ویندوز: venv\Scripts\activate

# نصب وابستگی‌ها
pip install -r requirements.txt

# ایجاد فایل محیطی
cp ../.env.example .env
# ویرایش فایل .env در صورت نیاز

# اجرای مایگریشن‌ها
python manage.py migrate

# ایجاد داده‌های آزمایشی
python manage.py seed_data

# اجرای سرور
python manage.py runserver
```

#### 3. راه‌اندازی Frontend
```bash
cd frontend

# نصب وابستگی‌ها
npm install

# اجرای سرور توسعه
npm run dev
```

#### 4. دسترسی به برنامه
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Django Admin: http://localhost:8000/admin/

### روش 2: اجرای با Docker

```bash
# کلون کردن پروژه
git clone <repository-url>
cd online-exam-system

# اجرای با Docker Compose
docker compose up --build
```

## 🔐 اطلاعات ورود دمو

### مدیر (Admin)
- **نام کاربری:** `admin`
- **رمز عبور:** `admin123`

### دانش‌آموز (Student)
- **نام کاربری:** `student001` تا `student040`
- **رمز عبور:** `student123`

## 📁 ساختار پروژه

```
online-exam-system/
│
├── frontend/                  # فرانت‌اند React
│   ├── src/
│   │   ├── components/        # کامپوننت‌های مشترک
│   │   ├── pages/             # صفحات
│   │   │   ├── admin/         # صفحات مدیر
│   │   │   └── student/       # صفحات دانش‌آموز
│   │   ├── layouts/           # لایه‌بندی‌ها
│   │   ├── hooks/             # هوک‌های سفارشی
│   │   ├── services/          # سرویس‌های API
│   │   ├── types/             # تایپ‌های TypeScript
│   │   ├── context/           # کانتکست‌ها
│   │   └── utils/             # ابزارهای کمکی
│   └── ...
│
├── backend/                   # بک‌اند Django
│   ├── apps/
│   │   ├── accounts/          # مدیریت کاربران
│   │   ├── exams/             # مدیریت آزمون‌ها
│   │   ├── questions/         # مدیریت سؤالات
│   │   ├── attempts/          # مدیریت تلاش‌ها
│   │   ├── results/           # مدیریت نتایج
│   │   └── analytics/         # آمار و تحلیل
│   ├── config/                # تنظیمات Django
│   └── manage.py
│
├── docker-compose.yml         # تنظیمات Docker
├── .env.example               # نمونه فایل محیطی
└── README.md                  # این فایل
```

## 🔌 API Endpoints

### احراز هویت
```
POST   /api/auth/login/                    # ورود
POST   /api/auth/logout/                   # خروج
POST   /api/auth/token/refresh/            # تازه‌سازی توکن
GET    /api/auth/profile/                  # پروفایل کاربر
```

### آزمون‌ها
```
GET    /api/exams/                         # لیست آزمون‌ها
GET    /api/exams/{id}/                    # جزئیات آزمون
GET    /api/exams/{id}/rules/              # قوانین آزمون
POST   /api/exams/admin/create/            # ایجاد آزمون (Admin)
PUT    /api/exams/admin/{id}/update/       # ویرایش آزمون (Admin)
DELETE /api/exams/admin/{id}/delete/       # حذف آزمون (Admin)
POST   /api/exams/admin/{id}/publish/      # انتشار آزمون (Admin)
```

### سؤالات
```
GET    /api/questions/                     # لیست سؤالات
POST   /api/questions/                     # ایجاد سؤال
PUT    /api/questions/{id}/                # ویرایش سؤال
DELETE /api/questions/{id}/                # حذف سؤال
POST   /api/questions/import/              # وارد کردن از CSV
```

### تلاش‌ها
```
POST   /api/attempts/start/                # شروع آزمون
GET    /api/attempts/{id}/continue/        # ادامه آزمون
POST   /api/attempts/{id}/answer/          # ذخیره پاسخ
POST   /api/attempts/{id}/submit/          # ارسال آزمون
```

### نتایج
```
GET    /api/results/student/attempt/{id}/  # نتیجه آزمون
GET    /api/results/student/history/       # تاریخچه
GET    /api/results/student/stats/         # آمار کلی
GET    /api/results/student/progress/      # روند پیشرفت
```

### آمار و تحلیل (Admin)
```
GET    /api/analytics/dashboard/           # داشبورد
GET    /api/analytics/exam/{id}/           # آمار آزمون
GET    /api/analytics/exam/{id}/export/    # خروجی نتایج
```

## 🗄️ دیتابیس

### مدل‌های اصلی
- **User**: کاربران سیستم با نقش‌های مختلف
- **Class**: کلاس‌ها و گروه‌ها
- **Exam**: آزمون‌ها با زمان‌بندی
- **Question**: سؤالات با گزینه‌ها
- **ExamAttempt**: تلاش‌های دانش‌آموزان
- **Answer**: پاسخ‌های ثبت شده
- **Result**: نتایج محاسبه شده

### مهاجرت به PostgreSQL
برای استفاده از PostgreSQL در محیط Development:

1. نصب PostgreSQL
2. ایجاد دیتابیس:
```sql
CREATE DATABASE exam_db;
CREATE USER exam_user WITH PASSWORD 'exam_password';
GRANT ALL PRIVILEGES ON DATABASE exam_db TO exam_user;
```
3. تغییر DATABASE_URL در فایل .env:
```
DATABASE_URL=postgres://exam_user:exam_password@localhost:5432/exam_db
```
4. اجرای مایگریشن‌ها:
```bash
python manage.py migrate
```

## 🚀 Deployment

### پیکربندی Production

1. تغییر تنظیمات امنیتی در .env:
```
DEBUG=False
SECRET_KEY=<your-secure-secret-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgres://user:password@localhost:5432/exam_db
```

2. جمع‌آوری فایل‌های استاتیک:
```bash
python manage.py collectstatic
```

3. اجرای با Gunicorn:
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

4. پیکربندی Nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /path/to/staticfiles/;
    }

    location /media/ {
        alias /path/to/media/;
    }
}
```

## ⚠️ محدودیت‌های نسخه Prototype

- سیستم ضدتقلب کامل پیاده‌سازی نشده (فقط اقدامات پایه)
- سیستم اعلان‌ها فقط داخلی است (بدون ایمیل/SMS)
- بدون سیستم پرداخت
- بدون پشتیبانی از فایل‌های صوتی/تصویری در سؤالات
- بدون سیستم چت یا پشتیبانی آنلاین
- بدون بکاپ خودکار دیتابیس

## 📝 نکات مهم

- تمام پاسخ‌ها در Backend محاسبه و ذخیره می‌شوند
- تایمر فقط برای نمایش است؛ زمان واقعی در Backend کنترل می‌شود
- پاسخ‌های صحیح قبل از انتشار نتایج به Client ارسال نمی‌شوند
- از Race Condition در شروع هم‌زمان آزمون جلوگیری شده
- تمام APIها دارای اعتبارسنجی و کنترل دسترسی هستند

## 🤝 مشارکت

برای مشارکت در توسعه:
1. Fork کنید
2. Branch ایجاد کنید
3. تغییرات را اعمال کنید
4. Pull Request ارسال کنید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.
