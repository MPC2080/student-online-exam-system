# Online Exam System

A full-stack web application for managing and taking online exams.

The system provides separate dashboards for students and administrators, supports scheduled and timed exams, saves answers during an exam, calculates results on the backend, and provides performance analytics.

The project is built with a Django REST API and a React + TypeScript frontend. It can be run locally or with Docker Compose.

## Features

### Student

- View available, upcoming, and completed exams
- Start and continue timed exams
- Answer multiple-choice questions
- Automatically save answers while taking an exam
- Mark questions for review
- Navigate between questions using a question map
- Automatic submission when the exam time expires
- View exam results and answer explanations
- View exam history
- View performance statistics
- Compare performance with exam averages
- Track progress using charts
- Light and dark themes
- Responsive interface

### Administrator

- Manage students and user accounts
- Manage classes and groups
- Create, edit, publish, and delete exams
- Manage the question bank
- Import questions from CSV files
- Configure exam schedules and access windows
- View student results and rankings
- View exam statistics
- View question-level analytics
- Export exam results

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts
- React Icons
- React Hot Toast
- date-fns
- persian calender

### Backend

- Python
- Django 4.2
- Django REST Framework
- Simple JWT
- SQLite for development
- PostgreSQL for production-style environments
- Redis

### Infrastructure

- Docker
- Docker Compose
- Gunicorn
- Nginx-ready deployment setup

## Architecture

The application is divided into a React frontend and a Django REST API backend.

```text
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │  TypeScript + Vite  │
                    └──────────┬──────────┘
                               │
                            REST API
                               │
                              JWT
                               │
                    ┌──────────▼──────────┐
                    │    Django API       │
                    │ Django REST Framework│
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
      ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
      │ PostgreSQL  │   │    Redis     │   │ Django Apps │
      │  Database   │   │   Services   │   │   & Logic   │
      └─────────────┘   └──────────────┘   └─────────────┘
```

The backend is organized into separate Django applications for different parts of the system, while the frontend is divided into pages, components, services, contexts, hooks, types, and utilities.

## Project Structure

```text
student-online-exam-system/
│
├── backend/
│   ├── apps/
│   │   ├── accounts/       # Users, authentication, permissions
│   │   ├── exams/          # Exam management and scheduling
│   │   ├── questions/      # Question bank and CSV import
│   │   ├── attempts/       # Exam attempts and answers
│   │   ├── results/        # Results and performance data
│   │   └── analytics/      # Statistics and exports
│   ├── config/             # Django project configuration
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── layouts/        # Page layouts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API communication
│   │   ├── types/          # TypeScript types
│   │   ├── context/        # React contexts
│   │   └── utils/          # Utility functions
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── PROJECT_SUMMARY.md
└── README.md
```

## API

The backend exposes REST endpoints for authentication, exams, questions, attempts, results, and analytics.

### Authentication

```text
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/token/refresh/
GET    /api/auth/profile/
```

### Exams

```text
GET    /api/exams/
GET    /api/exams/{id}/
GET    /api/exams/{id}/rules/
POST   /api/exams/admin/create/
PUT    /api/exams/admin/{id}/update/
DELETE /api/exams/admin/{id}/delete/
POST   /api/exams/admin/{id}/publish/
```

### Questions

```text
GET    /api/questions/
POST   /api/questions/
PUT    /api/questions/{id}/
DELETE /api/questions/{id}/
POST   /api/questions/import/
```

### Attempts

```text
POST   /api/attempts/start/
GET    /api/attempts/{id}/continue/
POST   /api/attempts/{id}/answer/
POST   /api/attempts/{id}/submit/
```

### Results

```text
GET    /api/results/student/attempt/{id}/
GET    /api/results/student/history/
GET    /api/results/student/stats/
GET    /api/results/student/progress/
```

### Analytics

```text
GET    /api/analytics/dashboard/
GET    /api/analytics/exam/{id}/
GET    /api/analytics/exam/{id}/export/
```

## Running Locally

### Requirements

- Python 3.10+
- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/MPC2080/student-online-exam-system.git
cd student-online-exam-system
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create the environment file:

```bash
cp ../.env.example .env
```

Run database migrations:

```bash
python manage.py migrate
```

Load development data:

```bash
python manage.py seed_data
```

Start the Django server:

```bash
python manage.py runserver
```

The backend will be available at:

```text
http://localhost:8000
```

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

## Running with Docker

Docker Compose starts the database, Redis, backend, and frontend together.

```bash
git clone https://github.com/MPC2080/student-online-exam-system.git
cd student-online-exam-system

docker compose up --build
```

Services:

| Service | Address |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8000/api` |
| Django Admin | `http://localhost:8000/admin/` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

To stop the containers:

```bash
docker compose down
```

## Demo Accounts

The development seed command creates sample accounts and exam data.

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Student | `student001` | `student123` |
| Student | `student002` | `student123` |
| Student | `student003` - `student040` | `student123` |

These credentials are intended for local development and testing only.

## Development Data

The seed command creates:

- 1 administrator
- 40 students
- 3 classes
- 4 exams
- 10 questions
- Mathematics, physics, and chemistry questions
- Previous exam results

This makes it possible to start the application and test the main workflows without manually creating everything first.

## Exam Timing and Submission

Exam timing is controlled by the backend rather than relying only on the browser timer.

During an exam:

1. The student starts an exam through the API.
2. The backend creates an exam attempt and records the relevant timing information.
3. Answers are saved through the API while the student works.
4. The frontend displays the remaining time.
5. The backend validates the attempt against the allowed exam time.
6. The student can submit the exam manually.
7. The exam can also be submitted automatically when the allowed time expires.
8. Results are calculated and stored on the server.

This means the frontend timer is used for displaying the remaining time, while the backend remains the source of truth for exam validity.

## Authentication and Security

The application includes:

- JWT-based authentication
- Role-based permissions
- Protected API endpoints
- Backend-side validation
- Server-side result calculation
- Backend-controlled exam timing
- Access control for student and administrator functionality
- Backend logic for preventing conflicting exam starts
- Separation of correct-answer data from the normal exam-taking flow

For a production deployment, additional security configuration is required, including:

- HTTPS
- Secure environment variables
- Strong production secrets
- Production Django settings
- Proper CORS configuration
- Database backups
- Production-ready infrastructure

## Database

The main domain models include:

- **User** - application users and roles
- **Class** - student classes and groups
- **Exam** - exam configuration and scheduling
- **Question** - questions and answer choices
- **ExamAttempt** - a student's attempt at an exam
- **Answer** - answers submitted during an attempt
- **Result** - calculated exam results

SQLite can be used during development, while PostgreSQL is included in the Docker setup for a more production-oriented environment.

## Production Deployment

The project includes support for a production-style deployment using PostgreSQL and Gunicorn, with Nginx-ready configuration.

Example environment configuration:

```env
DEBUG=False
SECRET_KEY=<secure-secret-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgres://user:password@localhost:5432/exam_db
```

Collect static files:

```bash
python manage.py collectstatic
```

Run the application with Gunicorn:

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

The exact deployment configuration should be adapted to the hosting environment.

## Current Scope

The project currently focuses on the core online examination workflow.

It does not currently include:

- Full online proctoring
- Advanced anti-cheating detection
- Email or SMS notification infrastructure
- Payment processing
- Audio/video questions
- Online chat or support system
- Automated database backup management

## Project Goals

This project was built to go beyond a basic CRUD application.

It combines:

- Authentication
- Role-based access control
- Exam scheduling
- Timed exam attempts
- Answer persistence
- Server-side result calculation
- Analytics
- CSV question import
- Administrative management
- REST API design
- Database relationships
- Frontend state management
- Docker-based development

The goal was to build a complete application with a realistic frontend/backend architecture rather than a simple demonstration project.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the changes locally.
5. Open a pull request.

