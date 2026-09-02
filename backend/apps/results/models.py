from django.db import models
from django.conf import settings


class Result(models.Model):
    """Exam result for a student attempt"""
    
    attempt = models.OneToOneField(
        'attempts.ExamAttempt',
        on_delete=models.CASCADE,
        related_name='result',
        verbose_name='تلاش'
    )
    
    # Scores
    total_questions = models.PositiveIntegerField(verbose_name='تعداد کل سؤالات')
    correct_count = models.PositiveIntegerField(default=0, verbose_name='تعداد صحیح')
    wrong_count = models.PositiveIntegerField(default=0, verbose_name='تعداد غلط')
    unanswered_count = models.PositiveIntegerField(default=0, verbose_name='تعداد نزده')
    
    # Percentage
    score = models.FloatField(default=0, verbose_name='درصد')
    raw_score = models.FloatField(
        default=0,
        verbose_name='نمره خام',
        help_text='نمره قبل از اعمال نمره منفی'
    )
    
    # Ranking
    rank = models.PositiveIntegerField(null=True, blank=True, verbose_name='رتبه')
    total_participants = models.PositiveIntegerField(null=True, blank=True, verbose_name='تعداد شرکت‌کنندگان')
    
    # Statistics
    exam_average = models.FloatField(null=True, blank=True, verbose_name='میانگین آزمون')
    exam_highest = models.FloatField(null=True, blank=True, verbose_name='بالاترین درصد')
    exam_lowest = models.FloatField(null=True, blank=True, verbose_name='پایین‌ترین درصد')
    
    # Metadata
    calculated_at = models.DateTimeField(auto_now_add=True, verbose_name='زمان محاسبه')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'نتیجه'
        verbose_name_plural = 'نتایج'
        ordering = ['-calculated_at']
        indexes = [
            models.Index(fields=['attempt']),
            models.Index(fields=['score']),
            models.Index(fields=['rank']),
        ]

    def __str__(self):
        return f"{self.attempt.student.get_full_name()} - {self.attempt.exam.title}: {self.score}%"

    @property
    def difference_from_average(self):
        """Calculate difference from exam average"""
        if self.exam_average is not None:
            return self.score - self.exam_average
        return None

    @property
    def percentile(self):
        """Calculate percentile rank"""
        if self.total_participants and self.rank:
            return ((self.total_participants - self.rank) / self.total_participants) * 100
        return None


class QuestionStatistics(models.Model):
    """Statistics for each question in an exam"""
    
    exam = models.ForeignKey(
        'exams.Exam',
        on_delete=models.CASCADE,
        related_name='question_stats',
        verbose_name='آزمون'
    )
    question = models.ForeignKey(
        'questions.Question',
        on_delete=models.CASCADE,
        related_name='statistics',
        verbose_name='سؤال'
    )
    
    # Answer distribution
    total_attempts = models.PositiveIntegerField(default=0, verbose_name='تعداد پاسخ‌ها')
    correct_count = models.PositiveIntegerField(default=0, verbose_name='تعداد صحیح')
    wrong_count = models.PositiveIntegerField(default=0, verbose_name='تعداد غلط')
    unanswered_count = models.PositiveIntegerField(default=0, verbose_name='تعداد نزده')
    
    # Option distribution
    option_a_count = models.PositiveIntegerField(default=0, verbose_name='تعداد انتخاب A')
    option_b_count = models.PositiveIntegerField(default=0, verbose_name='تعداد انتخاب B')
    option_c_count = models.PositiveIntegerField(default=0, verbose_name='تعداد انتخاب C')
    option_d_count = models.PositiveIntegerField(default=0, verbose_name='تعداد انتخاب D')
    
    # Percentages
    correct_percentage = models.FloatField(default=0, verbose_name='درصد صحیح')
    wrong_percentage = models.FloatField(default=0, verbose_name='درصد غلط')
    unanswered_percentage = models.FloatField(default=0, verbose_name='درصد نزده')
    
    # Difficulty index
    difficulty_index = models.FloatField(
        default=0,
        verbose_name='شاخص دشواری',
        help_text='درصد پاسخ صحیح - هرچه کمتر، سؤال سخت‌تر'
    )
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'آمار سؤال'
        verbose_name_plural = 'آمار سؤالات'
        unique_together = ['exam', 'question']

    def __str__(self):
        return f"{self.exam.title} - سؤال {self.question.order}: {self.correct_percentage}%"
