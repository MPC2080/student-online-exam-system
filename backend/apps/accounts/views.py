from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import authenticate
from django.db.models import Q

from .models import User, Class
from .serializers import (
    UserSerializer, StudentCreateSerializer, LoginSerializer,
    ChangePasswordSerializer, ClassSerializer, StudentProfileSerializer
)
from .permissions import IsAdmin, IsStudent


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'data': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'full_name': user.get_full_name(),
                    'role': user.role,
                    'student_id': user.student_id,
                }
            }
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'success': True, 'message': 'با موفقیت خارج شدید.'})
        except Exception:
            return Response({'success': True, 'message': 'با موفقیت خارج شدید.'})


class UserProfileView(APIView):
    def get(self, request):
        user = request.user
        if user.is_student:
            serializer = StudentProfileSerializer(user)
        else:
            serializer = UserSerializer(user)
        return Response({'success': True, 'data': serializer.data})


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response({'success': True, 'message': 'رمز عبور با موفقیت تغییر کرد.'})


# Admin Views
class StudentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    filterset_fields = ['is_active_student', 'classes']
    search_fields = ['username', 'first_name', 'last_name', 'student_id']
    ordering_fields = ['date_joined', 'last_name', 'student_id']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentCreateSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.filter(role='student').prefetch_related('classes')


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.filter(role='student').prefetch_related('classes')

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.is_active_student = False
        instance.save()


class ClassListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ClassSerializer
    queryset = Class.objects.all()
    search_fields = ['name']


class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ClassSerializer
    queryset = Class.objects.all()


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request):
        from apps.exams.models import Exam
        from apps.attempts.models import ExamAttempt
        from django.utils import timezone
        from django.db.models import Count, Avg
        
        today = timezone.now().date()
        
        total_students = User.objects.filter(role='student', is_active_student=True).count()
        total_exams = Exam.objects.count()
        active_exams = Exam.objects.filter(
            is_published=True,
            start_datetime__lte=timezone.now(),
            end_datetime__gte=timezone.now()
        ).count()
        
        today_attempts = ExamAttempt.objects.filter(
            started_at__date=today
        ).count()
        
        total_attempts = ExamAttempt.objects.filter(
            status__in=['submitted', 'auto_submitted', 'graded', 'result_released']
        ).count()
        
        # Average score of latest exam
        latest_exam = Exam.objects.filter(is_published=True).order_by('-created_at').first()
        latest_exam_avg = None
        if latest_exam:
            from apps.results.models import Result
            latest_result_avg = Result.objects.filter(
                attempt__exam=latest_exam
            ).aggregate(avg=Avg('score'))
            latest_exam_avg = latest_result_avg['avg']
        
        return Response({
            'success': True,
            'data': {
                'total_students': total_students,
                'total_exams': total_exams,
                'active_exams': active_exams,
                'today_attempts': today_attempts,
                'total_attempts': total_attempts,
                'latest_exam_avg': latest_exam_avg,
            }
        })
