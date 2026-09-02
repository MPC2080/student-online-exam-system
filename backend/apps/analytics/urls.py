from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardAnalyticsView.as_view(), name='dashboard_analytics'),
    path('exam/<int:exam_id>/', views.ExamAnalyticsView.as_view(), name='exam_analytics'),
    path('exam/<int:exam_id>/export/', views.ExportResultsView.as_view(), name='export_results'),
]
