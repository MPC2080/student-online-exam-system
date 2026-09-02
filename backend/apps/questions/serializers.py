from rest_framework import serializers
from .models import Question, QuestionBank


class QuestionSerializer(serializers.ModelSerializer):
    """Full question serializer for admin"""
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'exam', 'text', 'image', 'option_a', 'option_b',
            'option_c', 'option_d', 'correct_answer', 'explanation',
            'subject', 'topic', 'difficulty', 'tags', 'order',
            'options', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_options(self, obj):
        return obj.get_options()


class QuestionForStudentSerializer(serializers.ModelSerializer):
    """Question serializer for student - hides correct answer and explanation"""
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'text', 'image', 'option_a', 'option_b',
            'option_c', 'option_d', 'order', 'options'
        ]

    def get_options(self, obj):
        return obj.get_options()


class QuestionForReviewSerializer(serializers.ModelSerializer):
    """Question serializer for review after results - shows correct answer"""
    options = serializers.SerializerMethodField()
    student_answer = serializers.SerializerMethodField()
    is_correct = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            'id', 'text', 'image', 'option_a', 'option_b',
            'option_c', 'option_d', 'correct_answer', 'explanation',
            'order', 'options', 'student_answer', 'is_correct'
        ]

    def get_options(self, obj):
        return obj.get_options()

    def get_student_answer(self, obj):
        request = self.context.get('request')
        attempt_id = self.context.get('attempt_id')
        if request and attempt_id:
            from apps.attempts.models import Answer
            answer = Answer.objects.filter(
                attempt_id=attempt_id,
                question=obj
            ).first()
            if answer:
                return answer.selected_answer
        return None

    def get_is_correct(self, obj):
        student_answer = self.get_student_answer(obj)
        if student_answer is None:
            return None
        return student_answer == obj.correct_answer


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating questions"""

    class Meta:
        model = Question
        fields = [
            'exam', 'text', 'image', 'option_a', 'option_b',
            'option_c', 'option_d', 'correct_answer', 'explanation',
            'subject', 'topic', 'difficulty', 'tags', 'order'
        ]

    def validate_correct_answer(self, value):
        if value not in ['A', 'B', 'C', 'D']:
            raise serializers.ValidationError('پاسخ صحیح باید یکی از A, B, C, D باشد.')
        return value


class QuestionBankSerializer(serializers.ModelSerializer):
    """Serializer for question bank"""

    class Meta:
        model = QuestionBank
        fields = [
            'id', 'text', 'image', 'option_a', 'option_b',
            'option_c', 'option_d', 'correct_answer', 'explanation',
            'subject', 'topic', 'difficulty', 'tags', 'created_at'
        ]
        read_only_fields = ['created_at']


class QuestionImportSerializer(serializers.Serializer):
    """Serializer for importing questions from CSV/Excel"""
    file = serializers.FileField()
    exam_id = serializers.IntegerField(required=False)

    def validate_file(self, value):
        if not value.name.endswith(('.csv', '.xlsx', '.xls')):
            raise serializers.ValidationError('فقط فایل‌های CSV و Excel پذیرفته می‌شوند.')
        return value


class QuestionBulkCreateSerializer(serializers.Serializer):
    """Serializer for bulk question creation"""
    questions = QuestionCreateUpdateSerializer(many=True)
