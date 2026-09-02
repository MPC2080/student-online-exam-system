from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
import csv
import io

from .models import Question, QuestionBank
from .serializers import (
    QuestionSerializer, QuestionCreateUpdateSerializer,
    QuestionBankSerializer, QuestionImportSerializer,
    QuestionBulkCreateSerializer
)
from apps.accounts.permissions import IsAdmin


class QuestionListCreateView(generics.ListCreateAPIView):
    """List and create questions for an exam"""
    permission_classes = [IsAdmin]
    filterset_fields = ['exam', 'subject', 'difficulty', 'topic']
    search_fields = ['text', 'subject', 'topic']
    ordering_fields = ['order', 'created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuestionCreateUpdateSerializer
        return QuestionSerializer

    def get_queryset(self):
        queryset = Question.objects.select_related('exam')
        exam_id = self.request.query_params.get('exam_id')
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a question"""
    permission_classes = [IsAdmin]
    serializer_class = QuestionSerializer
    queryset = Question.objects.select_related('exam')


class QuestionBulkCreateView(APIView):
    """Bulk create questions for an exam"""
    permission_classes = [IsAdmin]
    
    @transaction.atomic
    def post(self, request):
        serializer = QuestionBulkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        questions_data = serializer.validated_data['questions']
        created_questions = []
        
        for q_data in questions_data:
            q_data['created_by'] = request.user
            question = Question.objects.create(**q_data)
            created_questions.append(question)
        
        return Response({
            'success': True,
            'data': {
                'created_count': len(created_questions),
                'questions': QuestionSerializer(created_questions, many=True).data
            }
        }, status=status.HTTP_201_CREATED)


class QuestionImportView(APIView):
    """Import questions from CSV file"""
    permission_classes = [IsAdmin]
    
    @transaction.atomic
    def post(self, request):
        serializer = QuestionImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        exam_id = serializer.validated_data.get('exam_id')
        
        if not exam_id:
            return Response(
                {'success': False, 'error': 'شناسه آزمون الزامی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.exams.models import Exam
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Parse CSV
        try:
            decoded_file = file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(decoded_file))
            
            questions = []
            errors = []
            
            for i, row in enumerate(reader, start=1):
                try:
                    question = Question(
                        exam=exam,
                        text=row.get('text', row.get('question', '')),
                        option_a=row.get('option_a', ''),
                        option_b=row.get('option_b', ''),
                        option_c=row.get('option_c', ''),
                        option_d=row.get('option_d', ''),
                        correct_answer=row.get('correct_answer', '').upper(),
                        explanation=row.get('explanation', ''),
                        subject=row.get('subject', ''),
                        topic=row.get('topic', ''),
                        difficulty=row.get('difficulty', 'medium'),
                        order=i,
                        created_by=request.user,
                    )
                    
                    if question.correct_answer not in ['A', 'B', 'C', 'D']:
                        errors.append(f'سطر {i}: پاسخ صحیح نامعتبر')
                        continue
                    
                    questions.append(question)
                except Exception as e:
                    errors.append(f'سطر {i}: {str(e)}')
            
            if questions:
                Question.objects.bulk_create(questions)
            
            return Response({
                'success': True,
                'data': {
                    'imported_count': len(questions),
                    'error_count': len(errors),
                    'errors': errors[:10],  # Show first 10 errors
                }
            })
        except Exception as e:
            return Response(
                {'success': False, 'error': f'خطا در خواندن فایل: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class QuestionImportPreviewView(APIView):
    """Preview questions before import"""
    permission_classes = [IsAdmin]
    
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'success': False, 'error': 'فایل ارسال نشده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            decoded_file = file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(decoded_file))
            
            preview = []
            for i, row in enumerate(reader, start=1):
                if i > 10:  # Preview first 10 rows
                    break
                preview.append({
                    'row': i,
                    'text': row.get('text', row.get('question', '')),
                    'option_a': row.get('option_a', ''),
                    'option_b': row.get('option_b', ''),
                    'option_c': row.get('option_c', ''),
                    'option_d': row.get('option_d', ''),
                    'correct_answer': row.get('correct_answer', ''),
                    'subject': row.get('subject', ''),
                })
            
            return Response({
                'success': True,
                'data': {
                    'preview': preview,
                    'total_rows': len(preview),
                }
            })
        except Exception as e:
            return Response(
                {'success': False, 'error': f'خطا در خواندن فایل: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


# Question Bank Views
class QuestionBankListCreateView(generics.ListCreateAPIView):
    """List and create questions in bank"""
    permission_classes = [IsAdmin]
    serializer_class = QuestionBankSerializer
    filterset_fields = ['subject', 'difficulty', 'topic']
    search_fields = ['text', 'subject', 'topic', 'tags']
    queryset = QuestionBank.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QuestionBankDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete bank question"""
    permission_classes = [IsAdmin]
    serializer_class = QuestionBankSerializer
    queryset = QuestionBank.objects.all()


class QuestionBankAddToExamView(APIView):
    """Add questions from bank to exam"""
    permission_classes = [IsAdmin]
    
    @transaction.atomic
    def post(self, request):
        question_ids = request.data.get('question_ids', [])
        exam_id = request.data.get('exam_id')
        
        if not exam_id:
            return Response(
                {'success': False, 'error': 'شناسه آزمون الزامی است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.exams.models import Exam
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        bank_questions = QuestionBank.objects.filter(id__in=question_ids)
        
        # Get current max order
        current_max = Question.objects.filter(exam=exam).order_by('-order').first()
        start_order = (current_max.order + 1) if current_max else 1
        
        created = []
        for i, bq in enumerate(bank_questions):
            question = Question.objects.create(
                exam=exam,
                text=bq.text,
                image=bq.image,
                option_a=bq.option_a,
                option_b=bq.option_b,
                option_c=bq.option_c,
                option_d=bq.option_d,
                correct_answer=bq.correct_answer,
                explanation=bq.explanation,
                subject=bq.subject,
                topic=bq.topic,
                difficulty=bq.difficulty,
                tags=bq.tags,
                order=start_order + i,
                created_by=request.user,
            )
            created.append(question)
        
        return Response({
            'success': True,
            'data': {
                'added_count': len(created),
            }
        })
