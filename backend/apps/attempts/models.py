from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class ExamAttempt(models.Model):
    """Student's attempt at an exam"""
    
    STATUS_CHOICES = [
        ('not_started', 'شروع نشده'),
        ('in_progress', 'در حال انجام'),
        ('submitted', 'ارسال شده'),
        ('auto_submitted', 'ارسال خودکار'),
        ('graded', 'نمره‌دهی شده'),
        ('result_released', 'نتیجه منتشر شده'),
    ]
    
    exam = models.ForeignKey(
        'exams.Exam',
        on_delete=models.CASCADE,
        related_name='attempts',
        verbose_name='آزمون'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_attempts',
        verbose_name='دانش‌آموز'
    )
    
    # Timing
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='زمان شروع')
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='زمان ارسال')
    effective_duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='مدت زمان مؤثر (دقیقه)',
        help_text='مدت زمان واقعی آزمون با در نظر گرفتن پایان بازه دسترسی'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started',
        verbose_name='وضعیت'
    )
    
    # Security
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='آدرس IP')
    user_agent = models.TextField(blank=True, null=True, verbose_name='User Agent')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تلاش آزمون'
        verbose_name_plural = 'تلاش‌های آزمون'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['exam', 'student']),
            models.Index(fields=['status']),
            models.Index(fields=['started_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['exam', 'student'],
                name='unique_exam_attempt'
            )
        ]

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.exam.title}"

    @property
    def is_active(self):
        """Check if attempt is currently in progress"""
        return self.status == 'in_progress'

    @property
    def time_remaining_seconds(self):
        """Calculate remaining time in seconds"""
        if not self.started_at or not self.effective_duration:
            return 0
        
        end_time = self.started_at + timedelta(minutes=self.effective_duration)
        remaining = (end_time - timezone.now()).total_seconds()
        return max(0, int(remaining))

    @property
    def is_time_up(self):
        """Check if time is up"""
        return self.time_remaining_seconds <= 0

    def start(self):
        """Start the attempt"""
        if self.status != 'not_started':
            raise ValueError('این آزمون قبلاً شروع شده است.')
        
        self.started_at = timezone.now()
        self.effective_duration = self.exam.get_effective_duration(self.started_at)
        self.status = 'in_progress'
        self.ip_address = self._get_client_ip()
        self.save()

    def submit(self, auto=False):
        """Submit the attempt"""
        if self.status != 'in_progress':
            raise ValueError('این آزمون قابل ارسال نیست.')
        
        self.submitted_at = timezone.now()
        self.status = 'auto_submitted' if auto else 'submitted'
        self.save()

    def _get_client_ip(self):
        """Get client IP from request context"""
        return None  # Will be set from view


class Answer(models.Model):
    """Student's answer to a question"""
    
    attempt = models.ForeignKey(
        ExamAttempt,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name='تلاش'
    )
    question = models.ForeignKey(
        'questions.Question',
        on_delete=models.CASCADE,
        related_name='student_answers',
        verbose_name='سؤال'
    )
    selected_answer = models.CharField(
        max_length=1,
        choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')],
        null=True,
        blank=True,
        verbose_name='پاسخ انتخابی'
    )
    is_marked = models.BooleanField(default=False, verbose_name='علامت‌گذاری شده')
    
    # Timing
    answered_at = models.DateTimeField(auto_now=True, verbose_name='زمان پاسخ')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'پاسخ'
        verbose_name_plural = 'پاسخ‌ها'
        ordering = ['question__order']
        indexes = [
            models.Index(fields=['attempt', 'question']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['attempt', 'question'],
                name='unique_answer_per_question'
            )
        ]

    def __str__(self):
        return f"{self.attempt} - سؤال {self.question.order}: {self.selected_answer or 'نزده'}"

    @property
    def is_correct(self):
        """Check if answer is correct"""
        if self.selected_answer is None:
            return None
        return self.selected_answer == self.question.correct_answer
