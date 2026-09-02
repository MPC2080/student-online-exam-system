from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg, Max, Min, Count, Q, F
from django.db.models.functions import TruncMonth

from apps.accounts.permissions import IsAdmin
from apps.exams.models import Exam
from apps.attempts.models import ExamAttempt
from apps.results.models import Result, QuestionStatistics
from apps.accounts.models import User, Class


class ExamAnalyticsView(APIView):
    """Get detailed analytics for an exam"""
    permission_classes = [IsAdmin]
    
    def get(self, request, exam_id):
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        results = Result.objects.filter(attempt__exam=exam)
        
        if not results.exists():
            return Response({
                'success': True,
                'data': {
                    'exam_id': exam.id,
                    'exam_title': exam.title,
                    'total_participants': 0,
                    'message': 'هنوز شرکت‌کننده‌ای وجود ندارد.'
                }
            })
        
        # Basic stats
        stats = results.aggregate(
            average=Avg('score'),
            highest=Max('score'),
            lowest=Min('score'),
            total=Count('id')
        )
        
        # Median calculation
        all_scores = list(results.values_list('score', flat=True).order_by('score'))
        n = len(all_scores)
        if n % 2 == 0:
            median = (all_scores[n//2 - 1] + all_scores[n//2]) / 2
        else:
            median = all_scores[n//2]
        
        # Score distribution
        distribution = [
            {'range': '0-10%', 'count': results.filter(score__gte=0, score__lt=10).count()},
            {'range': '10-20%', 'count': results.filter(score__gte=10, score__lt=20).count()},
            {'range': '20-30%', 'count': results.filter(score__gte=20, score__lt=30).count()},
            {'range': '30-40%', 'count': results.filter(score__gte=30, score__lt=40).count()},
            {'range': '40-50%', 'count': results.filter(score__gte=40, score__lt=50).count()},
            {'range': '50-60%', 'count': results.filter(score__gte=50, score__lt=60).count()},
            {'range': '60-70%', 'count': results.filter(score__gte=60, score__lt=70).count()},
            {'range': '70-80%', 'count': results.filter(score__gte=70, score__lt=80).count()},
            {'range': '80-90%', 'count': results.filter(score__gte=80, score__lt=90).count()},
            {'range': '90-100%', 'count': results.filter(score__gte=90, score__lte=100).count()},
        ]
        
        # Question statistics
        question_stats = QuestionStatistics.objects.filter(
            exam=exam
        ).select_related('question').order_by('question__order')
        
        from apps.results.serializers import QuestionStatisticsSerializer
        
        # Class comparison
        class_comparison = []
        classes = Class.objects.filter(students__exam_attempts__exam=exam).distinct()
        for cls in classes:
            class_results = results.filter(attempt__student__classes=cls)
            if class_results.exists():
                class_avg = class_results.aggregate(avg=Avg('score'))['avg']
                class_comparison.append({
                    'class_name': cls.name,
                    'average': round(class_avg, 2),
                    'count': class_results.count()
                })
        
        return Response({
            'success': True,
            'data': {
                'exam_id': exam.id,
                'exam_title': exam.title,
                'total_participants': stats['total'],
                'average_score': round(stats['average'], 2),
                'median_score': round(median, 2),
                'highest_score': round(stats['highest'], 2),
                'lowest_score': round(stats['lowest'], 2),
                'score_distribution': distribution,
                'question_statistics': QuestionStatisticsSerializer(question_stats, many=True).data,
                'class_comparison': class_comparison,
            }
        })


class DashboardAnalyticsView(APIView):
    """Get dashboard analytics for admin"""
    permission_classes = [IsAdmin]
    
    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Overall stats
        total_students = User.objects.filter(role='student', is_active_student=True).count()
        total_exams = Exam.objects.count()
        active_exams = Exam.objects.filter(
            is_published=True,
            start_datetime__lte=now,
            end_datetime__gte=now
        ).count()
        
        # Recent activity
        today_attempts = ExamAttempt.objects.filter(started_at__date=today).count()
        week_attempts = ExamAttempt.objects.filter(started_at__gte=week_ago).count()
        
        # Recent exams performance
        recent_exams = Exam.objects.filter(
            is_published=True
        ).order_by('-created_at')[:5]
        
        recent_exam_data = []
        for exam in recent_exams:
            results = Result.objects.filter(attempt__exam=exam)
            if results.exists():
                avg = results.aggregate(avg=Avg('score'))['avg']
                recent_exam_data.append({
                    'id': exam.id,
                    'title': exam.title,
                    'participants': results.count(),
                    'average': round(avg, 2),
                })
        
        # Monthly exam count
        monthly_exams = Exam.objects.filter(
            created_at__gte=month_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        return Response({
            'success': True,
            'data': {
                'total_students': total_students,
                'total_exams': total_exams,
                'active_exams': active_exams,
                'today_attempts': today_attempts,
                'week_attempts': week_attempts,
                'recent_exams': recent_exam_data,
                'monthly_exams': list(monthly_exams),
            }
        })


class ExportResultsView(APIView):
    """Export exam results to CSV/Excel"""
    permission_classes = [IsAdmin]
    
    def get(self, request, exam_id):
        import csv
        from django.http import HttpResponse
        from io import BytesIO
        
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        format_type = request.query_params.get('format', 'csv')
        
        results = Result.objects.filter(
            attempt__exam=exam
        ).select_related('attempt__student').order_by('rank')
        
        if format_type == 'excel':
            import openpyxl
            from django.http import HttpResponse
            
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = 'نتایج آزمون'
            
            # Headers
            headers = [
                'رتبه', 'نام دانش‌آموز', 'شناسه دانش‌آموزی', 'درصد',
                'تعداد صحیح', 'تعداد غلط', 'تعداد نزده', 'زمان ارسال'
            ]
            ws.append(headers)
            
            # Data
            for result in results:
                ws.append([
                    result.rank,
                    result.attempt.student.get_full_name(),
                    result.attempt.student.student_id,
                    result.score,
                    result.correct_count,
                    result.wrong_count,
                    result.unanswered_count,
                    result.attempt.submitted_at.strftime('%Y-%m-%d %H:%M') if result.attempt.submitted_at else '',
                ])
            
            response = HttpResponse(
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{exam.title}_results.xlsx"'
            wb.save(response)
            return response
        
        else:  # CSV
            response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
            response['Content-Disposition'] = f'attachment; filename="{exam.title}_results.csv"'
            
            # Write BOM for Excel
            response.write('\ufeff')
            
            writer = csv.writer(response)
            writer.writerow([
                'رتبه', 'نام دانش‌آموز', 'شناسه دانش‌آموزی', 'درصد',
                'تعداد صحیح', 'تعداد غلط', 'تعداد نزده', 'زمان ارسال'
            ])
            
            for result in results:
                writer.writerow([
                    result.rank,
                    result.attempt.student.get_full_name(),
                    result.attempt.student.student_id,
                    result.score,
                    result.correct_count,
                    result.wrong_count,
                    result.unanswered_count,
                    result.attempt.submitted_at.strftime('%Y-%m-%d %H:%M') if result.attempt.submitted_at else '',
                ])
            
            return response
