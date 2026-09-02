from django.contrib import admin
from .models import Question, QuestionBank


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['exam', 'order', 'text', 'correct_answer', 'subject', 'difficulty']
    list_filter = ['exam', 'subject', 'difficulty']
    search_fields = ['text', 'subject', 'topic']
    ordering = ['exam', 'order']


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ['text', 'subject', 'topic', 'difficulty', 'correct_answer']
    list_filter = ['subject', 'difficulty']
    search_fields = ['text', 'subject', 'topic', 'tags']
