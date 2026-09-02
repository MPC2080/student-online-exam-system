from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Class


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'student_id', 'is_active_student']
    list_filter = ['role', 'is_active_student', 'classes']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    fieldsets = UserAdmin.fieldsets + (
        ('اطلاعات اضافی', {'fields': ('role', 'student_id', 'phone_number', 'classes', 'is_active_student')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('اطلاعات اضافی', {'fields': ('role', 'student_id', 'phone_number')}),
    )


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
