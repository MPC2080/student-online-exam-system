from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django.db.models import Q

from .models import ExamAttempt, Answer
from .serializers import (
    AttemptSerializer, AttemptListSerializer, AttemptStartSerializer,
    AnswerSubmitSerializer, AnswerSerializer
)
from apps.accounts.permissions import IsStudent, IsAdmin
from apps.exams.models import Exam


class StartExamView(APIView):
    """Start an exam attempt"""
    permission_classes = [IsStudent]
    
    @transaction.atomic
    def post(self, request):
        serializer = AttemptStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        exam_id = serializer.validated_data['exam_id']
        student = request.user
        
        # Get exam
        try:
            exam = Exam.objects.get(pk=exam_id, is_published=True)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if student can access exam
        if not exam.can_student_access(student):
            return Response(
                {'success': False, 'error': 'شما دسترسی به این آزمون را ندارید.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if exam is active
        now = timezone.now()
        if now < exam.start_datetime:
            return Response(
                {'success': False, 'error': 'آزمون هنوز شروع نشده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if now > exam.end_datetime:
            return Response(
                {'success': False, 'error': 'زمان دسترسی به آزمون به پایان رسیده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for existing attempt
        existing_attempt = ExamAttempt.objects.filter(
            exam=exam,
            student=student
        ).first()
        
        if existing_attempt:
            if existing_attempt.status == 'in_progress':
                # Return existing attempt
                serializer = AttemptSerializer(existing_attempt)
                return Response({
                    'success': True,
                    'data': serializer.data,
                    'message': 'آزمون قبلاً شروع شده است.'
                })
            elif existing_attempt.status in ['submitted', 'auto_submitted', 'graded', 'result_released']:
                return Response(
                    {'success': False, 'error': 'شما قبلاً در این آزمون شرکت کرده‌اید.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create new attempt
        attempt = ExamAttempt(
            exam=exam,
            student=student,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        attempt.start()
        
        # Create empty answers for all questions
        questions = exam.questions.all()
        answers = [
            Answer(attempt=attempt, question=q)
            for q in questions
        ]
        Answer.objects.bulk_create(answers)
        
        serializer = AttemptSerializer(attempt)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class ContinueExamView(APIView):
    """Continue an in-progress exam"""
    permission_classes = [IsStudent]
    
    def get(self, request, attempt_id):
        try:
            attempt = ExamAttempt.objects.select_related('exam').get(
                pk=attempt_id,
                student=request.user
            )
        except ExamAttempt.DoesNotExist:
            return Response(
                {'success': False, 'error': 'تلاش آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if attempt.status != 'in_progress':
            return Response(
                {'success': False, 'error': 'این آزمون قابل ادامه دادن نیست.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if time is up
        if attempt.is_time_up:
            attempt.submit(auto=True)
            return Response(
                {'success': False, 'error': 'زمان آزمون به پایان رسیده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get questions and answers
        from apps.questions.models import Question
        questions = Question.objects.filter(exam=attempt.exam).order_by('order')
        answers = Answer.objects.filter(attempt=attempt).select_related('question')
        
        from apps.questions.serializers import QuestionForStudentSerializer
        
        return Response({
            'success': True,
            'data': {
                'attempt': AttemptSerializer(attempt).data,
                'questions': QuestionForStudentSerializer(questions, many=True).data,
                'answers': AnswerSerializer(answers, many=True).data,
                'time_remaining': attempt.time_remaining_seconds,
            }
        })


class SaveAnswerView(APIView):
    """Save or update an answer"""
    permission_classes = [IsStudent]
    
    def post(self, request, attempt_id):
        try:
            attempt = ExamAttempt.objects.get(
                pk=attempt_id,
                student=request.user,
                status='in_progress'
            )
        except ExamAttempt.DoesNotExist:
            return Response(
                {'success': False, 'error': 'تلاش آزمون یافت نشد یا غیرفعال است.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check time
        if attempt.is_time_up:
            attempt.submit(auto=True)
            return Response(
                {'success': False, 'error': 'زمان آزمون به پایان رسیده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AnswerSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        question_id = serializer.validated_data['question_id']
        selected_answer = serializer.validated_data.get('selected_answer')
        is_marked = serializer.validated_data.get('is_marked', False)
        
        # Update or create answer
        answer, created = Answer.objects.update_or_create(
            attempt=attempt,
            question_id=question_id,
            defaults={
                'selected_answer': selected_answer,
                'is_marked': is_marked,
            }
        )
        
        return Response({
            'success': True,
            'data': AnswerSerializer(answer).data
        })


class SaveBulkAnswersView(APIView):
    """Save multiple answers at once"""
    permission_classes = [IsStudent]
    
    def post(self, request, attempt_id):
        try:
            attempt = ExamAttempt.objects.get(
                pk=attempt_id,
                student=request.user,
                status='in_progress'
            )
        except ExamAttempt.DoesNotExist:
            return Response(
                {'success': False, 'error': 'تلاش آزمون یافت نشد یا غیرفعال است.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if attempt.is_time_up:
            attempt.submit(auto=True)
            return Response(
                {'success': False, 'error': 'زمان آزمون به پایان رسیده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        answers_data = request.data.get('answers', [])
        updated_count = 0
        
        for answer_data in answers_data:
            question_id = answer_data.get('question_id')
            selected_answer = answer_data.get('selected_answer')
            is_marked = answer_data.get('is_marked', False)
            
            if question_id:
                Answer.objects.update_or_create(
                    attempt=attempt,
                    question_id=question_id,
                    defaults={
                        'selected_answer': selected_answer,
                        'is_marked': is_marked,
                    }
                )
                updated_count += 1
        
        return Response({
            'success': True,
            'data': {
                'updated_count': updated_count
            }
        })


class SubmitExamView(APIView):
    """Submit an exam attempt"""
    permission_classes = [IsStudent]
    
    def post(self, request, attempt_id):
        try:
            attempt = ExamAttempt.objects.select_related('exam').get(
                pk=attempt_id,
                student=request.user,
                status='in_progress'
            )
        except ExamAttempt.DoesNotExist:
            return Response(
                {'success': False, 'error': 'تلاش آزمون یافت نشد یا قبلاً ارسال شده است.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Submit
        attempt.submit(auto=False)
        
        # Calculate result
        from apps.results.services import ResultService
        result = ResultService.calculate_result(attempt)
        
        return Response({
            'success': True,
            'data': {
                'attempt_id': attempt.id,
                'status': attempt.status,
                'submitted_at': attempt.submitted_at,
                'message': 'آزمون با موفقیت ارسال شد.'
            }
        })


class AutoSubmitView(APIView):
    """Auto-submit when time is up"""
    permission_classes = [IsStudent]
    
    def post(self, request, attempt_id):
        try:
            attempt = ExamAttempt.objects.get(
                pk=attempt_id,
                student=request.user,
                status='in_progress'
            )
        except ExamAttempt.DoesNotExist:
            return Response(
                {'success': False, 'error': 'تلاش آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if time is actually up
        if not attempt.is_time_up:
            return Response(
                {'success': False, 'error': 'هنوز زمان آزمون تمام نشده است.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attempt.submit(auto=True)
        
        from apps.results.services import ResultService
        result = ResultService.calculate_result(attempt)
        
        return Response({
            'success': True,
            'data': {
                'attempt_id': attempt.id,
                'status': attempt.status,
                'message': 'آزمون به صورت خودکار ارسال شد.'
            }
        })


# Admin Views
class AdminAttemptListView(generics.ListAPIView):
    """List all attempts (Admin only)"""
    permission_classes = [IsAdmin]
    serializer_class = AttemptListSerializer
    filterset_fields = ['exam', 'status', 'student']
    ordering_fields = ['started_at', 'submitted_at']
    
    def get_queryset(self):
        return ExamAttempt.objects.select_related('exam', 'student').all()


class AdminAttemptDetailView(generics.RetrieveAPIView):
    """Get attempt details (Admin only)"""
    permission_classes = [IsAdmin]
    serializer_class = AttemptSerializer
    queryset = ExamAttempt.objects.select_related('exam', 'student').all()
