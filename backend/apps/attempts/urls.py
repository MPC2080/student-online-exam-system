from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path('start/', views.StartExamView.as_view(), name='start_exam'),
    path('<int:attempt_id>/continue/', views.ContinueExamView.as_view(), name='continue_exam'),
    path('<int:attempt_id>/answer/', views.SaveAnswerView.as_view(), name='save_answer'),
    path('<int:attempt_id>/answers/bulk/', views.SaveBulkAnswersView.as_view(), name='save_bulk_answers'),
    path('<int:attempt_id>/submit/', views.SubmitExamView.as_view(), name='submit_exam'),
    path('<int:attempt_id>/auto-submit/', views.AutoSubmitView.as_view(), name='auto_submit'),
    
    # Admin endpoints
    path('admin/', views.AdminAttemptListView.as_view(), name='admin_attempt_list'),
    path('admin/<int:pk>/', views.AdminAttemptDetailView.as_view(), name='admin_attempt_detail'),
]
