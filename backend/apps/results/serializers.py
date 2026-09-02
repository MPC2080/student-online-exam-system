from rest_framework import serializers
from .models import Result, QuestionStatistics


class ResultSerializer(serializers.ModelSerializer):
    """Serializer for exam result"""
    exam_title = serializers.CharField(source='attempt.exam.title', read_only=True)
    student_name = serializers.SerializerMethodField()
    difference_from_average = serializers.FloatField(read_only=True)
    percentile = serializers.FloatField(read_only=True)

    class Meta:
        model = Result
        fields = [
            'id', 'attempt', 'exam_title', 'student_name',
            'total_questions', 'correct_count', 'wrong_count', 'unanswered_count',
            'score', 'raw_score', 'rank', 'total_participants',
            'exam_average', 'exam_highest', 'exam_lowest',
            'difference_from_average', 'percentile', 'calculated_at'
        ]

    def get_student_name(self, obj):
        return obj.attempt.student.get_full_name()


class ResultDetailSerializer(serializers.ModelSerializer):
    """Detailed result serializer with question review"""
    exam_title = serializers.CharField(source='attempt.exam.title', read_only=True)
    student_name = serializers.SerializerMethodField()
    difference_from_average = serializers.FloatField(read_only=True)
    questions_review = serializers.SerializerMethodField()

    class Meta:
        model = Result
        fields = [
            'id', 'attempt', 'exam_title', 'student_name',
            'total_questions', 'correct_count', 'wrong_count', 'unanswered_count',
            'score', 'raw_score', 'rank', 'total_participants',
            'exam_average', 'exam_highest', 'exam_lowest',
            'difference_from_average', 'questions_review', 'calculated_at'
        ]

    def get_student_name(self, obj):
        return obj.attempt.student.get_full_name()

    def get_questions_review(self, obj):
        from apps.questions.serializers import QuestionForReviewSerializer
        from apps.questions.models import Question
        
        questions = Question.objects.filter(
            exam=obj.attempt.exam
        ).order_by('order')
        
        return QuestionForReviewSerializer(
            questions,
            many=True,
            context={
                'request': self.context.get('request'),
                'attempt_id': obj.attempt.id
            }
        ).data


class QuestionStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for question statistics"""
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_order = serializers.IntegerField(source='question.order', read_only=True)
    correct_answer = serializers.CharField(source='question.correct_answer', read_only=True)

    class Meta:
        model = QuestionStatistics
        fields = [
            'id', 'question', 'question_text', 'question_order', 'correct_answer',
            'total_attempts', 'correct_count', 'wrong_count', 'unanswered_count',
            'option_a_count', 'option_b_count', 'option_c_count', 'option_d_count',
            'correct_percentage', 'wrong_percentage', 'unanswered_percentage',
            'difficulty_index'
        ]


class ExamAnalyticsSerializer(serializers.Serializer):
    """Serializer for exam analytics"""
    exam_id = serializers.IntegerField()
    exam_title = serializers.CharField()
    total_participants = serializers.IntegerField()
    average_score = serializers.FloatField()
    median_score = serializers.FloatField()
    highest_score = serializers.FloatField()
    lowest_score = serializers.FloatField()
    score_distribution = serializers.ListField()
    question_statistics = QuestionStatisticsSerializer(many=True)
    class_comparison = serializers.ListField(required=False)


class StudentHistorySerializer(serializers.ModelSerializer):
    """Serializer for student exam history"""
    exam_title = serializers.CharField(source='attempt.exam.title', read_only=True)
    exam_date = serializers.DateTimeField(source='attempt.exam.start_datetime', read_only=True)
    submitted_at = serializers.DateTimeField(source='attempt.submitted_at', read_only=True)

    class Meta:
        model = Result
        fields = [
            'id', 'attempt', 'exam_title', 'exam_date', 'submitted_at',
            'total_questions', 'correct_count', 'wrong_count', 'unanswered_count',
            'score', 'rank', 'total_participants', 'exam_average'
        ]
