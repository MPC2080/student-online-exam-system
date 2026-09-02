from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path('student/attempt/<int:attempt_id>/', views.StudentResultView.as_view(), name='student_result'),
    path('student/history/', views.StudentHistoryView.as_view(), name='student_history'),
    path('student/stats/', views.StudentStatsView.as_view(), name='student_stats'),
    path('student/progress/', views.StudentProgressView.as_view(), name='student_progress'),
    
    # Admin endpoints
    path('admin/', views.AdminResultListView.as_view(), name='admin_result_list'),
    path('admin/exam/<int:exam_id>/', views.AdminExamResultsView.as_view(), name='admin_exam_results'),
    path('admin/exam/<int:exam_id>/recalculate/', views.AdminRecalculateResultsView.as_view(), name='admin_recalculate'),
    path('admin/exam/<int:exam_id>/release/', views.AdminReleaseResultsView.as_view(), name='admin_release_results'),
]
