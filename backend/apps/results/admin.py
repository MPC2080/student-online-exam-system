from django.contrib import admin
from .models import Result, QuestionStatistics


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'score', 'rank', 'total_participants', 'correct_count', 'wrong_count']
    list_filter = ['attempt__exam']
    search_fields = ['attempt__student__username', 'attempt__exam__title']
    ordering = ['rank']


@admin.register(QuestionStatistics)
class QuestionStatisticsAdmin(admin.ModelAdmin):
    list_display = ['exam', 'question', 'correct_percentage', 'difficulty_index']
    list_filter = ['exam']
