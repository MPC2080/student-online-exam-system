from rest_framework import serializers
from django.utils import timezone
from .models import Exam, ExamNotification
from apps.accounts.models import Class


class ExamListSerializer(serializers.ModelSerializer):
    """Serializer for exam list view"""
    question_count = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    results_released = serializers.BooleanField(read_only=True)
    created_by_name = serializers.SerializerMethodField()
    target_class_names = serializers.SerializerMethodField()
    student_status = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'start_datetime', 'end_datetime',
            'duration_minutes', 'result_release_datetime', 'is_published',
            'question_count', 'is_active', 'is_upcoming', 'is_expired',
            'results_released', 'created_by_name', 'target_class_names',
            'student_status', 'created_at'
        ]

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name()

    def get_target_class_names(self, obj):
        return list(obj.target_classes.values_list('name', flat=True))

    def get_student_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.is_student:
            from apps.attempts.models import ExamAttempt
            attempt = ExamAttempt.objects.filter(
                exam=obj,
                student=request.user
            ).first()
            
            if attempt:
                return attempt.status
            if obj.is_active:
                return 'available'
            if obj.is_upcoming:
                return 'upcoming'
            if obj.is_expired:
                return 'expired'
        return None


class ExamDetailSerializer(serializers.ModelSerializer):
    """Serializer for exam detail view"""
    question_count = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    results_released = serializers.BooleanField(read_only=True)
    questions = serializers.SerializerMethodField()
    target_class_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True,
        source='target_classes'
    )

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'start_datetime', 'end_datetime',
            'duration_minutes', 'result_release_datetime', 'is_published',
            'show_correct_answers', 'show_explanations', 'shuffle_questions',
            'shuffle_options', 'negative_marking_enabled', 'negative_marking_ratio',
            'target_class_ids', 'question_count', 'is_active', 'is_upcoming',
            'is_expired', 'results_released', 'questions', 'created_at', 'updated_at'
        ]

    def get_questions(self, obj):
        from apps.questions.serializers import QuestionSerializer
        request = self.context.get('request')
        
        # Only show questions to admin or if exam is active for student
        if request and request.user.is_admin:
            return QuestionSerializer(obj.questions.all(), many=True).data
        
        return None


class ExamCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating exams"""
    target_class_ids = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        many=True,
        write_only=True,
        source='target_classes',
        required=False
    )

    class Meta:
        model = Exam
        fields = [
            'title', 'description', 'start_datetime', 'end_datetime',
            'duration_minutes', 'result_release_datetime', 'is_published',
            'show_correct_answers', 'show_explanations', 'shuffle_questions',
            'shuffle_options', 'negative_marking_enabled', 'negative_marking_ratio',
            'target_class_ids'
        ]

    def validate(self, data):
        if data.get('start_datetime') and data.get('end_datetime'):
            if data['start_datetime'] >= data['end_datetime']:
                raise serializers.ValidationError({
                    'end_datetime': 'زمان پایان باید بعد از زمان شروع باشد.'
                })
        
        if data.get('result_release_datetime') and data.get('end_datetime'):
            if data['result_release_datetime'] < data['end_datetime']:
                raise serializers.ValidationError({
                    'result_release_datetime': 'زمان انتشار نتایج باید بعد از زمان پایان آزمون باشد.'
                })
        
        return data


class ExamRulesSerializer(serializers.ModelSerializer):
    """Serializer for exam rules display before starting"""
    question_count = serializers.IntegerField(read_only=True)
    effective_duration = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'start_datetime', 'end_datetime',
            'duration_minutes', 'question_count', 'effective_duration',
            'negative_marking_enabled', 'negative_marking_ratio',
            'shuffle_questions'
        ]

    def get_effective_duration(self, obj):
        request = self.context.get('request')
        if request:
            return obj.get_effective_duration()
        return obj.duration_minutes


class NotificationSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = ExamNotification
        fields = ['id', 'exam', 'exam_title', 'notification_type', 'message', 'is_read', 'created_at']
        read_only_fields = ['created_at']
