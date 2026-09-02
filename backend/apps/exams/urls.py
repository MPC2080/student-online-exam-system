from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path('', views.ExamListView.as_view(), name='exam_list'),
    path('<int:pk>/', views.ExamDetailView.as_view(), name='exam_detail'),
    path('<int:pk>/rules/', views.ExamRulesView.as_view(), name='exam_rules'),
    
    # Admin endpoints
    path('admin/create/', views.ExamCreateView.as_view(), name='exam_create'),
    path('admin/<int:pk>/update/', views.ExamUpdateView.as_view(), name='exam_update'),
    path('admin/<int:pk>/delete/', views.ExamDeleteView.as_view(), name='exam_delete'),
    path('admin/<int:pk>/duplicate/', views.ExamDuplicateView.as_view(), name='exam_duplicate'),
    path('admin/<int:pk>/publish/', views.ExamPublishView.as_view(), name='exam_publish'),
    
    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', views.NotificationReadView.as_view(), name='notification_read'),
    path('notifications/read-all/', views.NotificationReadAllView.as_view(), name='notification_read_all'),
]
