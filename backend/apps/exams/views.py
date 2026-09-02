from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q

from .models import Exam, ExamNotification
from .serializers import (
    ExamListSerializer, ExamDetailSerializer, ExamCreateUpdateSerializer,
    ExamRulesSerializer, NotificationSerializer
)
from apps.accounts.permissions import IsAdmin, IsStudent


class ExamListView(generics.ListAPIView):
    """List exams - different behavior for admin and student"""
    serializer_class = ExamListSerializer
    filterset_fields = ['is_published']
    search_fields = ['title', 'description']
    ordering_fields = ['start_datetime', 'created_at', 'title']

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Exam.objects.all().prefetch_related('target_classes', 'questions')
        
        # Student: show published exams they have access to
        now = timezone.now()
        queryset = Exam.objects.filter(
            is_published=True
        ).prefetch_related('target_classes', 'questions')
        
        # Filter by class access
        if user.classes.exists():
            queryset = queryset.filter(
                Q(target_classes__isnull=True) |
                Q(target_classes__in=user.classes.all())
            ).distinct()
        
        return queryset


class ExamDetailView(generics.RetrieveAPIView):
    """Get exam details"""
    serializer_class = ExamDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Exam.objects.all().prefetch_related('target_classes', 'questions')
        
        return Exam.objects.filter(
            is_published=True
        ).prefetch_related('target_classes', 'questions')


class ExamCreateView(generics.CreateAPIView):
    """Create new exam (Admin only)"""
    permission_classes = [IsAdmin]
    serializer_class = ExamCreateUpdateSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ExamUpdateView(generics.UpdateAPIView):
    """Update exam (Admin only)"""
    permission_classes = [IsAdmin]
    serializer_class = ExamCreateUpdateSerializer
    queryset = Exam.objects.all()


class ExamDeleteView(generics.DestroyAPIView):
    """Delete exam (Admin only)"""
    permission_classes = [IsAdmin]
    queryset = Exam.objects.all()

    def perform_destroy(self, instance):
        # Soft delete or check if attempts exist
        from apps.attempts.models import ExamAttempt
        if ExamAttempt.objects.filter(exam=instance).exists():
            instance.is_published = False
            instance.save()
        else:
            instance.delete()


class ExamDuplicateView(APIView):
    """Duplicate an exam (Admin only)"""
    permission_classes = [IsAdmin]
    
    def post(self, request, pk):
        try:
            original = Exam.objects.get(pk=pk)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create copy
        new_exam = Exam.objects.create(
            title=f"{original.title} (کپی)",
            description=original.description,
            start_datetime=original.start_datetime,
            end_datetime=original.end_datetime,
            duration_minutes=original.duration_minutes,
            result_release_datetime=original.result_release_datetime,
            is_published=False,
            show_correct_answers=original.show_correct_answers,
            show_explanations=original.show_explanations,
            shuffle_questions=original.shuffle_questions,
            shuffle_options=original.shuffle_options,
            negative_marking_enabled=original.negative_marking_enabled,
            negative_marking_ratio=original.negative_marking_ratio,
            created_by=request.user,
        )
        new_exam.target_classes.set(original.target_classes.all())
        
        # Copy questions
        from apps.questions.models import Question
        for q in original.questions.all():
            Question.objects.create(
                exam=new_exam,
                text=q.text,
                image=q.image,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                correct_answer=q.correct_answer,
                explanation=q.explanation,
                subject=q.subject,
                topic=q.topic,
                difficulty=q.difficulty,
                order=q.order,
            )
        
        serializer = ExamDetailSerializer(new_exam, context={'request': request})
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)


class ExamPublishView(APIView):
    """Toggle exam publish status (Admin only)"""
    permission_classes = [IsAdmin]
    
    def post(self, request, pk):
        try:
            exam = Exam.objects.get(pk=pk)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        exam.is_published = not exam.is_published
        exam.save()
        
        # Create notifications if published
        if exam.is_published:
            from apps.accounts.models import User
            students = User.objects.filter(role='student', is_active_student=True)
            if exam.target_classes.exists():
                students = students.filter(classes__in=exam.target_classes.all()).distinct()
            
            notifications = [
                ExamNotification(
                    user=student,
                    exam=exam,
                    notification_type='exam_published',
                    message=f'آزمون "{exam.title}" منتشر شد.'
                )
                for student in students
            ]
            ExamNotification.objects.bulk_create(notifications)
        
        return Response({
            'success': True,
            'data': {
                'is_published': exam.is_published,
                'message': 'آزمون منتشر شد.' if exam.is_published else 'آزمون از انتشار خارج شد.'
            }
        })


class ExamRulesView(APIView):
    """Get exam rules before starting"""
    permission_classes = [IsStudent]
    
    def get(self, request, pk):
        try:
            exam = Exam.objects.get(pk=pk, is_published=True)
        except Exam.DoesNotExist:
            return Response(
                {'success': False, 'error': 'آزمون یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ExamRulesSerializer(exam, context={'request': request})
        return Response({'success': True, 'data': serializer.data})


# Notification Views
class NotificationListView(generics.ListAPIView):
    """List user notifications"""
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        return ExamNotification.objects.filter(user=self.request.user)


class NotificationReadView(APIView):
    """Mark notification as read"""
    def post(self, request, pk):
        try:
            notification = ExamNotification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'success': True})
        except ExamNotification.DoesNotExist:
            return Response(
                {'success': False, 'error': 'اعلان یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationReadAllView(APIView):
    """Mark all notifications as read"""
    def post(self, request):
        ExamNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'success': True})
