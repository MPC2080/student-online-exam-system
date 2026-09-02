from django.contrib import admin
from .models import Exam, ExamNotification


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['title', 'start_datetime', 'end_datetime', 'duration_minutes', 'is_published', 'created_by']
    list_filter = ['is_published', 'start_datetime']
    search_fields = ['title', 'description']
    date_hierarchy = 'start_datetime'
    filter_horizontal = ['target_classes']


@admin.register(ExamNotification)
class ExamNotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'exam', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['user__username', 'exam__title']
