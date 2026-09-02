from django.urls import path
from . import views

urlpatterns = [
    # Questions
    path('', views.QuestionListCreateView.as_view(), name='question_list_create'),
    path('<int:pk>/', views.QuestionDetailView.as_view(), name='question_detail'),
    path('bulk-create/', views.QuestionBulkCreateView.as_view(), name='question_bulk_create'),
    path('import/', views.QuestionImportView.as_view(), name='question_import'),
    path('import/preview/', views.QuestionImportPreviewView.as_view(), name='question_import_preview'),
    
    # Question Bank
    path('bank/', views.QuestionBankListCreateView.as_view(), name='question_bank_list_create'),
    path('bank/<int:pk>/', views.QuestionBankDetailView.as_view(), name='question_bank_detail'),
    path('bank/add-to-exam/', views.QuestionBankAddToExamView.as_view(), name='question_bank_add_to_exam'),
]
