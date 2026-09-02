from django.contrib.auth.models import AbstractUser
from django.db import models


class Class(models.Model):
    """Student class/group model"""
    name = models.CharField(max_length=100, verbose_name='نام کلاس')
    description = models.TextField(blank=True, null=True, verbose_name='توضیحات')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'کلاس'
        verbose_name_plural = 'کلاس‌ها'
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    """Custom User model with role-based access"""
    
    ROLE_CHOICES = [
        ('admin', 'مدیر'),
        ('student', 'دانش‌آموز'),
    ]
    
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student', verbose_name='نقش')
    student_id = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='شناسه دانش‌آموزی')
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name='شماره تلفن')
    classes = models.ManyToManyField(Class, related_name='students', blank=True, verbose_name='کلاس‌ها')
    is_active_student = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_student(self):
        return self.role == 'student'

    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
