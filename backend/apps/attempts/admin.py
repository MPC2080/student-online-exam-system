from django.contrib import admin
from .models import ExamAttempt, Answer


@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'status', 'started_at', 'submitted_at']
    list_filter = ['status', 'exam']
    search_fields = ['student__username', 'exam__title']
    date_hierarchy = 'started_at'


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'selected_answer', 'is_marked']
    list_filter = ['is_marked']
    search_fields = ['attempt__student__username']
