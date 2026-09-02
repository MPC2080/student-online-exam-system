from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from apps.accounts.models import User, Class
from apps.exams.models import Exam
from apps.questions.models import Question
from apps.attempts.models import ExamAttempt, Answer
from apps.results.models import Result
from apps.results.services import ResultService


class Command(BaseCommand):
    help = 'ایجاد داده‌های آزمایشی برای دمو'

    def handle(self, *args, **options):
        self.stdout.write('شروع ایجاد داده‌های آزمایشی...')
        
        # Create Admin
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'first_name': 'مدیر',
                'last_name': 'سیستم',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('ادمین ایجاد شد.'))
        
        # Create Classes
        classes = []
        for i, name in enumerate(['کلاس A', 'کلاس B', 'کلاس C'], 1):
            cls, _ = Class.objects.get_or_create(
                name=name,
                defaults={'description': f'کلاس شماره {i}'}
            )
            classes.append(cls)
        self.stdout.write(self.style.SUCCESS(f'{len(classes)} کلاس ایجاد شد.'))
        
        # Create Students
        students = []
        first_names = ['علی', 'محمد', 'زهرا', 'فاطمه', 'حسین', 'مهدی', 'نیما', 'سارا', 'مریم', 'رضا',
                       'امیر', 'حسن', 'مینا', 'لیلا', 'احمد', 'نازنین', 'پریسا', 'سعید', 'بهراد', 'آرش',
                       'الناز', 'مهسا', 'یاسمن', 'نگار', 'سمیرا', 'بهنام', 'فرهاد', 'کامران', 'شیما', 'مونا',
                       'رضا', 'میلاد', 'امین', 'هادی', 'جواد', 'محمدرضا', 'ابوالفضل', 'زینب', 'هدیه', 'مبینا',
                       'دانیال', 'پارسا', 'آرمین', 'سینا', 'محمدطاها', 'امیرعلی', 'محمدحسین', 'فاطمه‌زهرا', 'زهرا', 'مریم']
        
        last_names = ['احمدی', 'محمدی', 'حسینی', 'رضایی', 'کریمی', 'موسوی', 'علیزاده', 'نوری', 'جعفری', 'صادقی',
                      'قاسمی', 'عابدی', 'فرهادی', 'شریفی', 'هاشمی', 'رحمانی', 'فتحی', 'بهرامی', 'کاظمی', 'یوسفی',
                      'مهدوی', 'امینی', 'حیدری', 'سلطانی', 'عبداللهی', 'بهشتی', 'زارعی', 'پورمحمدی', 'گل محمدی', 'محمدپور']
        
        for i in range(40):
            username = f'student{i+1:03d}'
            student, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@example.com',
                    'first_name': random.choice(first_names),
                    'last_name': random.choice(last_names),
                    'role': 'student',
                    'student_id': f'S{2024}{i+1:04d}',
                    'is_active_student': True,
                }
            )
            if created:
                student.set_password('student123')
                student.save()
                # Assign to random class(es)
                student.classes.add(random.choice(classes))
                if random.random() > 0.7:
                    student.classes.add(random.choice(classes))
            students.append(student)
        
        self.stdout.write(self.style.SUCCESS(f'{len(students)} دانش‌آموز ایجاد شد.'))
        
        # Create Exams
        now = timezone.now()
        
        exams_data = [
            {
                'title': 'آزمون ریاضی - فصل اول',
                'description': 'آزمون مباحث فصل اول ریاضی دهم',
                'start_datetime': now - timedelta(hours=2),
                'end_datetime': now + timedelta(hours=10),
                'duration_minutes': 90,
                'result_release_datetime': now + timedelta(hours=12),
                'is_published': True,
            },
            {
                'title': 'آزمون فیزیک - فصل دوم',
                'description': 'آزمون مباحث فصل دوم فیزیک دهم',
                'start_datetime': now + timedelta(days=1),
                'end_datetime': now + timedelta(days=1, hours=12),
                'duration_minutes': 60,
                'result_release_datetime': now + timedelta(days=1, hours=14),
                'is_published': True,
            },
            {
                'title': 'آزمون شیمی - فصل اول',
                'description': 'آزمون مباحث فصل اول شیمی دهم',
                'start_datetime': now - timedelta(days=2),
                'end_datetime': now - timedelta(days=1),
                'duration_minutes': 75,
                'result_release_datetime': now - timedelta(hours=12),
                'is_published': True,
            },
            {
                'title': 'آزمون زبان انگلیسی',
                'description': 'آزمون مباحث درس 1 تا 3 زبان انگلیسی',
                'start_datetime': now - timedelta(days=5),
                'end_datetime': now - timedelta(days=4),
                'duration_minutes': 45,
                'result_release_datetime': now - timedelta(days=3),
                'is_published': True,
            },
        ]
        
        exams = []
        for exam_data in exams_data:
            exam, _ = Exam.objects.get_or_create(
                title=exam_data['title'],
                defaults={**exam_data, 'created_by': admin}
            )
            exams.append(exam)
        
        self.stdout.write(self.style.SUCCESS(f'{len(exams)} آزمون ایجاد شد.'))
        
        # Create Questions for Math exam
        math_exam = exams[0]
        if math_exam.questions.count() == 0:
            questions_data = [
                {
                    'text': 'حاصل عبارت 2x + 3x برابر است با:',
                    'option_a': '5x',
                    'option_b': '6x',
                    'option_c': '5x²',
                    'option_d': '6x²',
                    'correct_answer': 'A',
                    'explanation': 'با جمع ضرایب x: 2x + 3x = (2+3)x = 5x',
                    'subject': 'ریاضی',
                    'topic': 'جبر',
                    'difficulty': 'easy',
                },
                {
                    'text': 'مقدار عبارت 3² + 4² برابر است با:',
                    'option_a': '7',
                    'option_b': '12',
                    'option_c': '25',
                    'option_d': '14',
                    'correct_answer': 'C',
                    'explanation': '3² = 9 و 4² = 16، پس 9 + 16 = 25',
                    'subject': 'ریاضی',
                    'topic': 'توان',
                    'difficulty': 'easy',
                },
                {
                    'text': 'اگر f(x) = 2x - 1 باشد، مقدار f(3) برابر است با:',
                    'option_a': '4',
                    'option_b': '5',
                    'option_c': '6',
                    'option_d': '7',
                    'correct_answer': 'B',
                    'explanation': 'f(3) = 2(3) - 1 = 6 - 1 = 5',
                    'subject': 'ریاضی',
                    'topic': 'تابع',
                    'difficulty': 'easy',
                },
                {
                    'text': 'شیب خط y = 3x + 2 برابر است با:',
                    'option_a': '2',
                    'option_b': '3',
                    'option_c': '5',
                    'option_d': '1',
                    'correct_answer': 'B',
                    'explanation': 'در معادله y = mx + b، m شیب خط است. پس شیب = 3',
                    'subject': 'ریاضی',
                    'topic': 'خط',
                    'difficulty': 'easy',
                },
                {
                    'text': 'حل معادله 2x - 6 = 0 کدام است؟',
                    'option_a': 'x = 2',
                    'option_b': 'x = 3',
                    'option_c': 'x = -3',
                    'option_d': 'x = 6',
                    'correct_answer': 'B',
                    'explanation': '2x - 6 = 0 → 2x = 6 → x = 3',
                    'subject': 'ریاضی',
                    'topic': 'معادله',
                    'difficulty': 'easy',
                },
            ]
            
            for i, q_data in enumerate(questions_data, 1):
                Question.objects.create(
                    exam=math_exam,
                    order=i,
                    created_by=admin,
                    **q_data
                )
            
            self.stdout.write(self.style.SUCCESS(f'{len(questions_data)} سؤال برای آزمون ریاضی ایجاد شد.'))
        
        # Create Questions for Physics exam
        physics_exam = exams[1]
        if physics_exam.questions.count() == 0:
            questions_data = [
                {
                    'text': 'واحد اندازه‌گیری نیرو در SI کدام است؟',
                    'option_a': 'ژول',
                    'option_b': 'وات',
                    'option_c': 'نیوتن',
                    'option_d': 'پاسکال',
                    'correct_answer': 'C',
                    'explanation': 'واحد نیوتن (N) واحد اندازه‌گیری نیرو در سیستم SI است.',
                    'subject': 'فیزیک',
                    'topic': 'مکانیک',
                    'difficulty': 'easy',
                },
                {
                    'text': 'قانون دوم نیوتن بیان می‌کند که:',
                    'option_a': 'F = mv',
                    'option_b': 'F = ma',
                    'option_c': 'F = mg',
                    'option_d': 'F = m/a',
                    'correct_answer': 'B',
                    'explanation': 'قانون دوم نیوتن: نیرو برابر است با حاصل‌ضرب جرم در شتاب (F = ma)',
                    'subject': 'فیزیک',
                    'topic': 'نیوتن',
                    'difficulty': 'easy',
                },
                {
                    'text': 'سرعت نور در خلأ تقریباً برابر است با:',
                    'option_a': '3 × 10⁶ m/s',
                    'option_b': '3 × 10⁸ m/s',
                    'option_c': '3 × 10¹⁰ m/s',
                    'option_d': '3 × 10⁴ m/s',
                    'correct_answer': 'B',
                    'explanation': 'سرعت نور در خلأ تقریباً 3 × 10⁸ متر بر ثانیه است.',
                    'subject': 'فیزیک',
                    'topic': 'نور',
                    'difficulty': 'medium',
                },
            ]
            
            for i, q_data in enumerate(questions_data, 1):
                Question.objects.create(
                    exam=physics_exam,
                    order=i,
                    created_by=admin,
                    **q_data
                )
            
            self.stdout.write(self.style.SUCCESS(f'{len(questions_data)} سؤال برای آزمون فیزیک ایجاد شد.'))
        
        # Create Questions for Chemistry exam
        chem_exam = exams[2]
        if chem_exam.questions.count() == 0:
            questions_data = [
                {
                    'text': 'نماد شیمیایی آب کدام است؟',
                    'option_a': 'HO',
                    'option_b': 'H₂O',
                    'option_c': 'H₂O₂',
                    'option_d': 'OH',
                    'correct_answer': 'B',
                    'explanation': 'آب از دو اتم هیدروژن و یک اتم اکسیژن تشکیل شده: H₂O',
                    'subject': 'شیمی',
                    'topic': 'ترکیبات',
                    'difficulty': 'easy',
                },
                {
                    'text': 'عدد اتمی کربن چند است؟',
                    'option_a': '4',
                    'option_b': '6',
                    'option_c': '8',
                    'option_d': '12',
                    'correct_answer': 'B',
                    'explanation': 'عدد اتمی کربن (C) برابر 6 است (6 پروتون در هسته).',
                    'subject': 'شیمی',
                    'topic': 'اتم',
                    'difficulty': 'easy',
                },
            ]
            
            for i, q_data in enumerate(questions_data, 1):
                Question.objects.create(
                    exam=chem_exam,
                    order=i,
                    created_by=admin,
                    **q_data
                )
            
            self.stdout.write(self.style.SUCCESS(f'{len(questions_data)} سؤال برای آزمون شیمی ایجاد شد.'))
        
        # Create some attempts and results for past exams
        past_exams = [exams[2], exams[3]]  # Chemistry and English
        
        for exam in past_exams:
            # Create attempts for some students
            participating_students = random.sample(students, min(25, len(students)))
            
            for student in participating_students:
                attempt, created = ExamAttempt.objects.get_or_create(
                    exam=exam,
                    student=student,
                    defaults={
                        'status': 'graded',
                        'started_at': exam.start_datetime + timedelta(minutes=random.randint(0, 60)),
                        'submitted_at': exam.end_datetime - timedelta(minutes=random.randint(0, 30)),
                        'effective_duration': exam.duration_minutes,
                        'ip_address': '192.168.1.1',
                    }
                )
                
                if created:
                    # Create answers
                    questions = exam.questions.all()
                    for question in questions:
                        # Random answer with bias towards correct
                        if random.random() < 0.6:
                            selected = question.correct_answer
                        elif random.random() < 0.8:
                            wrong_options = ['A', 'B', 'C', 'D']
                            wrong_options.remove(question.correct_answer)
                            selected = random.choice(wrong_options)
                        else:
                            selected = None  # Unanswered
                        
                        Answer.objects.create(
                            attempt=attempt,
                            question=question,
                            selected_answer=selected,
                        )
                    
                    # Calculate result
                    ResultService.calculate_result(attempt)
            
            # Calculate rankings
            ResultService.calculate_rankings(exam)
            ResultService.calculate_question_statistics(exam)
            
            # Release results for past exams
            if exam.result_release_datetime <= now:
                ResultService.release_results(exam)
        
        self.stdout.write(self.style.SUCCESS('نتایج آزمون‌های قبلی ایجاد شد.'))
        
        # Print summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('داده‌های آزمایشی با موفقیت ایجاد شدند!'))
        self.stdout.write('='*50)
        self.stdout.write('\nاطلاعات ورود:')
        self.stdout.write('-'*30)
        self.stdout.write('ادمین:')
        self.stdout.write('  نام کاربری: admin')
        self.stdout.write('  رمز عبور: admin123')
        self.stdout.write('\nدانش‌آموز (نمونه):')
        self.stdout.write('  نام کاربری: student001')
        self.stdout.write('  رمز عبور: student123')
        self.stdout.write('\n' + '='*50)
