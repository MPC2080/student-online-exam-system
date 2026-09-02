from rest_framework import serializers
from django.utils import timezone
from .models import ExamAttempt, Answer


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for answers"""
    
    class Meta:
        model = Answer
        fields = ['id', 'question', 'selected_answer', 'is_marked', 'answered_at']
        read_only_fields = ['answered_at']


class AnswerSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a single answer"""
    question_id = serializers.IntegerField()
    selected_answer = serializers.ChoiceField(
        choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')],
        required=False,
        allow_null=True
    )
    is_marked = serializers.BooleanField(required=False, default=False)


class AttemptStartSerializer(serializers.Serializer):
    """Serializer for starting an attempt"""
    exam_id = serializers.IntegerField()


class AttemptSerializer(serializers.ModelSerializer):
    """Serializer for attempt details"""
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    student_name = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    answers = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'exam_title', 'student', 'student_name',
            'started_at', 'submitted_at', 'effective_duration',
            'status', 'time_remaining', 'answers', 'question_count',
            'created_at'
        ]
        read_only_fields = ['created_at', 'started_at', 'submitted_at']

    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def get_time_remaining(self, obj):
        return obj.time_remaining_seconds

    def get_answers(self, obj):
        answers = obj.answers.select_related('question').all()
        return AnswerSerializer(answers, many=True).data

    def get_question_count(self, obj):
        return obj.exam.question_count


class AttemptListSerializer(serializers.ModelSerializer):
    """Serializer for attempt list view"""
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    student_name = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()

    class Meta:
        model = ExamAttempt
        fields = [
            'id', 'exam', 'exam_title', 'student', 'student_name',
            'started_at', 'submitted_at', 'status', 'score', 'created_at'
        ]

    def get_student_name(self, obj):
        return obj.student.get_full_name()

    def get_score(self, obj):
        from apps.results.models import Result
        result = Result.objects.filter(attempt=obj).first()
        if result:
            return result.score
        return None


class ExamQuestionsSerializer(serializers.Serializer):
    """Serializer for exam questions during attempt"""
    questions = serializers.SerializerMethodField()
    attempt = AttemptSerializer()
    time_remaining = serializers.IntegerField()

    def get_questions(self, obj):
        from apps.questions.serializers import QuestionForStudentSerializer
        return QuestionForStudentSerializer(obj['questions'], many=True).data
