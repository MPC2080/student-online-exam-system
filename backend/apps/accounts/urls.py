from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # Admin endpoints
    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin_dashboard'),
    path('admin/students/', views.StudentListCreateView.as_view(), name='student_list_create'),
    path('admin/students/<int:pk>/', views.StudentDetailView.as_view(), name='student_detail'),
    path('admin/classes/', views.ClassListCreateView.as_view(), name='class_list_create'),
    path('admin/classes/<int:pk>/', views.ClassDetailView.as_view(), name='class_detail'),
]
