from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import Result, QuestionStatistics
from .serializers import (
    ResultSerializer, ResultDetailSerializer,
    QuestionStatisticsSerializer, StudentHistorySerializer
)
from .services import ResultService
from apps.accounts.permissions import IsStudent, IsAdmin


class StudentResultView(APIView):
    """Get result for a specific attempt"""
    permission_classes = [IsStudent]
    
    def get(self, request, attempt_id):
        from apps.attempts.models import ExamAttempt
        
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
        
        # Check if results are released
        if not attempt.exam.results_released:
            return Response({
                'success': True,
                'data': {
                    'status': 'not_released',
                    'message': 'نتایج این آزمون هنوز منتشر نشده است.',
                    'release_time': attempt.exam.result_release_datetime,
                }
            })
        
        try:
            result = Result.objects.get(attempt=attempt)
        except Result.DoesNotExist:
            return Response(
                {'success': False, 'error': 'نتیجه‌ای یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ResultDetailSerializer(result, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data
        })


class StudentHistoryView(generics.ListAPIView):
    """Get student's exam history"""
    permission_classes = [IsStudent]
    serializer_class = StudentHistorySerializer
    
    def get_queryset(self):
        return Result.objects.filter(
            attempt__student=self.request.user,
            attempt__status__in=['graded', 'result_released']
        ).select_related('attempt__exam').order_by('-attempt__submitted_at')


class StudentStatsView(APIView):
    """Get student's overall statistics"""
    permission_classes = [IsStudent]
    
    def get(self, request):
        stats = ResultService.get_student_stats(request.user)
        return Response({
            'success': True,
            'data': stats
        })


class StudentProgressView(APIView):
    """Get student's progress over time"""
    permission_classes = [IsStudent]
    
    def get(self, request):
        results = Result.objects.filter(
            attempt__student=request.user,
            attempt__status__in=['graded', 'result_released']
        ).select_related('attempt__exam').order_by('attempt__submitted_at')
        
        progress = [
            {
                'exam_title': r.attempt.exam.title,
                'score': r.score,
                'date': r.attempt.submitted_at,
                'rank': r.rank,
                'average': r.exam_average,
            }
            for r in results
        ]
        
        return Response({
            'success': True,
            'data': progress
        })


# Admin Views
class AdminResultListView(generics.ListAPIView):
    """List all results (Admin only)"""
    permission_classes = [IsAdmin]
    serializer_class = ResultSerializer
    filterset_fields = ['attempt__exam', 'attempt__student']
    ordering_fields = ['score', 'rank', 'calculated_at']
    
    def get_queryset(self):
        return Result.objects.select_related(
            'attempt__exam', 'attempt__student'
        ).all()


class AdminExamResultsView(APIView):
    """Get all results for a specific exam (Admin only)"""
    permission_classes = [IsAdmin]
    
    def get(self, request, exam_id):
        from apps.exams.models import Exam
        
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        results = Result.objects.filter(
            attempt__exam=exam
        ).select_related('attempt__student').order_by('rank')
        
        serializer = ResultSerializer(results, many=True)
        
        # Calculate stats
        from django.db.models import Avg, Max, Min, Count
        stats = results.aggregate(
            average=Avg('score'),
            highest=Max('score'),
            lowest=Min('score'),
            count=Count('id')
        )
        
        return Response({
            'success': True,
            'data': {
                'exam': {
                    'id': exam.id,
                    'title': exam.title,
                },
                'results': serializer.data,
                'statistics': stats,
            }
        })


class AdminRecalculateResultsView(APIView):
    """Recalculate results for an exam (Admin only)"""
    permission_classes = [IsAdmin]
    
    def post(self, request, exam_id):
        from apps.exams.models import Exam
        
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Recalculate all results
        from apps.attempts.models import ExamAttempt
        attempts = ExamAttempt.objects.filter(
            exam=exam,
            status__in=['submitted', 'auto_submitted', 'graded', 'result_released']
        )
        
        for attempt in attempts:
            ResultService.calculate_result(attempt)
        
        # Recalculate rankings
        ResultService.calculate_rankings(exam)
        
        # Recalculate question statistics
        ResultService.calculate_question_statistics(exam)
        
        return Response({
            'success': True,
            'message': 'نتایج با موفقیت بازمحاسبه شدند.'
        })


class AdminReleaseResultsView(APIView):
    """Release results for an exam (Admin only)"""
    permission_classes = [IsAdmin]
    
    def post(self, request, exam_id):
        from apps.exams.models import Exam
        
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate rankings first
        ResultService.calculate_rankings(exam)
        ResultService.calculate_question_statistics(exam)
        
        # Release results
        ResultService.release_results(exam)
        
        return Response({
            'success': True,
            'message': 'نتایج با موفقیت منتشر شدند.'
        })
