from django.db import models
from django.conf import settings
from django.utils import timezone


class Exam(models.Model):
    """Exam model with scheduling and access control"""
    
    title = models.CharField(max_length=200, verbose_name='عنوان آزمون')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    
    # Scheduling
    start_datetime = models.DateTimeField(verbose_name='زمان شروع دسترسی')
    end_datetime = models.DateTimeField(verbose_name='زمان پایان دسترسی')
    duration_minutes = models.PositiveIntegerField(verbose_name='مدت آزمون (دقیقه)')
    
    # Result release
    result_release_datetime = models.DateTimeField(
        verbose_name='زمان انتشار نتایج',
        help_text='نتایج قبل از این زمان قابل مشاهده نخواهند بود.'
    )
    
    # Settings
    is_published = models.BooleanField(default=False, verbose_name='منتشر شده')
    show_correct_answers = models.BooleanField(
        default=True,
        verbose_name='نمایش پاسخ‌های صحیح',
        help_text='آیا پاسخ‌های صحیح پس از انتشار نتایج نمایش داده شوند؟'
    )
    show_explanations = models.BooleanField(
        default=True,
        verbose_name='نمایش پاسخ تشریحی',
        help_text='آیا پاسخ تشریحی پس از انتشار نتایج نمایش داده شود؟'
    )
    shuffle_questions = models.BooleanField(default=False, verbose_name='ترتیب تصادفی سؤالات')
    shuffle_options = models.BooleanField(default=False, verbose_name='ترتیب تصادفی گزینه‌ها')
    
    # Scoring
    negative_marking_enabled = models.BooleanField(
        default=False,
        verbose_name='نمره منفی فعال',
        help_text='آیا نمره منفی اعمال شود؟'
    )
    negative_marking_ratio = models.FloatField(
        default=3.0,
        verbose_name='ضریب نمره منفی',
        help_text='هر چند پاسخ غلط = حذف یک پاسخ صحیح (پیش‌فرض: 3)'
    )
    
    # Target classes
    target_classes = models.ManyToManyField(
        'accounts.Class',
        related_name='exams',
        blank=True,
        verbose_name='کلاس‌های هدف',
        help_text='خالی بودن به معنای دسترسی همه دانش‌آموزان است.'
    )
    
    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_exams',
        verbose_name='ایجاد شده توسط'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'آزمون'
        verbose_name_plural = 'آزمون‌ها'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['start_datetime', 'end_datetime']),
            models.Index(fields=['is_published']),
            models.Index(fields=['result_release_datetime']),
        ]

    def __str__(self):
        return self.title

    @property
    def is_active(self):
        """Check if exam is currently within access window"""
        now = timezone.now()
        return self.is_published and self.start_datetime <= now <= self.end_datetime

    @property
    def is_upcoming(self):
        """Check if exam hasn't started yet"""
        return self.is_published and timezone.now() < self.start_datetime

    @property
    def is_expired(self):
        """Check if exam access window has passed"""
        return timezone.now() > self.end_datetime

    @property
    def results_released(self):
        """Check if results should be shown"""
        return timezone.now() >= self.result_release_datetime

    @property
    def question_count(self):
        return self.questions.count()

    def get_effective_duration(self, start_time=None):
        """Calculate effective duration considering access window end"""
        if start_time is None:
            start_time = timezone.now()
        
        from datetime import timedelta
        exam_end = self.end_datetime
        requested_end = start_time + timedelta(minutes=self.duration_minutes)
        
        if requested_end > exam_end:
            remaining = (exam_end - start_time).total_seconds() / 60
            return max(0, int(remaining))
        
        return self.duration_minutes

    def can_student_access(self, student):
        """Check if a specific student can access this exam"""
        if not self.is_published:
            return False
        
        if not student.is_active_student:
            return False
        
        # Check class access
        if self.target_classes.exists():
            student_classes = student.classes.all()
            if not self.target_classes.filter(id__in=student_classes).exists():
                return False
        
        return True


class ExamNotification(models.Model):
    """Notifications for exam events"""
    
    NOTIFICATION_TYPES = [
        ('exam_published', 'آزمون جدید منتشر شد'),
        ('result_released', 'نتیجه آزمون منتشر شد'),
        ('exam_reminder', 'یادآوری آزمون'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'اعلان'
        verbose_name_plural = 'اعلان‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.notification_type}"
