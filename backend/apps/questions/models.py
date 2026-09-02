from django.db import models
from django.conf import settings


class Question(models.Model):
    """Question model for exams"""
    
    ANSWER_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'آسان'),
        ('medium', 'متوسط'),
        ('hard', 'سخت'),
    ]
    
    exam = models.ForeignKey(
        'exams.Exam',
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name='آزمون'
    )
    
    # Question content
    text = models.TextField(verbose_name='متن سؤال')
    image = models.ImageField(
        upload_to='questions/',
        blank=True,
        null=True,
        verbose_name='تصویر سؤال'
    )
    
    # Options
    option_a = models.CharField(max_length=500, verbose_name='گزینه A')
    option_b = models.CharField(max_length=500, verbose_name='گزینه B')
    option_c = models.CharField(max_length=500, verbose_name='گزینه C')
    option_d = models.CharField(max_length=500, verbose_name='گزینه D')
    
    # Correct answer and explanation
    correct_answer = models.CharField(
        max_length=1,
        choices=ANSWER_CHOICES,
        verbose_name='پاسخ صحیح'
    )
    explanation = models.TextField(
        blank=True,
        null=True,
        verbose_name='پاسخ تشریحی'
    )
    
    # Metadata
    subject = models.CharField(max_length=100, blank=True, null=True, verbose_name='درس')
    topic = models.CharField(max_length=100, blank=True, null=True, verbose_name='مبحث')
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='medium',
        verbose_name='سطح دشواری'
    )
    tags = models.CharField(max_length=500, blank=True, null=True, verbose_name='برچسب‌ها')
    
    # Ordering
    order = models.PositiveIntegerField(default=0, verbose_name='ترتیب')
    
    # Metadata
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_questions',
        verbose_name='ایجاد شده توسط'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'سؤال'
        verbose_name_plural = 'سؤالات'
        ordering = ['exam', 'order', 'id']
        indexes = [
            models.Index(fields=['exam', 'order']),
            models.Index(fields=['subject']),
            models.Index(fields=['difficulty']),
        ]

    def __str__(self):
        return f"{self.exam.title} - سؤال {self.order}: {self.text[:50]}..."

    def get_options(self):
        """Return options as dictionary"""
        return {
            'A': self.option_a,
            'B': self.option_b,
            'C': self.option_c,
            'D': self.option_d,
        }


class QuestionBank(models.Model):
    """Question bank for storing reusable questions"""
    
    text = models.TextField(verbose_name='متن سؤال')
    image = models.ImageField(
        upload_to='question_bank/',
        blank=True,
        null=True,
        verbose_name='تصویر سؤال'
    )
    
    option_a = models.CharField(max_length=500, verbose_name='گزینه A')
    option_b = models.CharField(max_length=500, verbose_name='گزینه B')
    option_c = models.CharField(max_length=500, verbose_name='گزینه C')
    option_d = models.CharField(max_length=500, verbose_name='گزینه D')
    
    correct_answer = models.CharField(
        max_length=1,
        choices=Question.ANSWER_CHOICES,
        verbose_name='پاسخ صحیح'
    )
    explanation = models.TextField(blank=True, null=True, verbose_name='پاسخ تشریحی')
    
    subject = models.CharField(max_length=100, blank=True, null=True, verbose_name='درس')
    topic = models.CharField(max_length=100, blank=True, null=True, verbose_name='مبحث')
    difficulty = models.CharField(
        max_length=10,
        choices=Question.DIFFICULTY_CHOICES,
        default='medium',
        verbose_name='سطح دشواری'
    )
    tags = models.CharField(max_length=500, blank=True, null=True, verbose_name='برچسب‌ها')
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='ایجاد شده توسط'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'سؤال بانک'
        verbose_name_plural = 'بانک سؤالات'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['subject']),
            models.Index(fields=['topic']),
            models.Index(fields=['difficulty']),
        ]

    def __str__(self):
        return f"{self.subject or 'عمومی'} - {self.text[:50]}..."
