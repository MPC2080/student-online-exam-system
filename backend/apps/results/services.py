from django.db import transaction
from django.db.models import Avg, Max, Min, Count, Q, F
from django.utils import timezone

from .models import Result, QuestionStatistics
from apps.attempts.models import ExamAttempt, Answer


class ResultService:
    """Service for calculating and managing exam results"""
    
    @staticmethod
    @transaction.atomic
    def calculate_result(attempt):
        """Calculate result for an exam attempt"""
        
        # Get all answers for this attempt
        answers = Answer.objects.filter(attempt=attempt).select_related('question')
        
        total_questions = attempt.exam.question_count
        correct_count = 0
        wrong_count = 0
        unanswered_count = 0
        
        for answer in answers:
            if answer.selected_answer is None:
                unanswered_count += 1
            elif answer.is_correct:
                correct_count += 1
            else:
                wrong_count += 1
        
        # Calculate score
        if attempt.exam.negative_marking_enabled:
            ratio = attempt.exam.negative_marking_ratio
            effective_correct = correct_count - (wrong_count / ratio)
            effective_correct = max(0, effective_correct)
            score = (effective_correct / total_questions) * 100 if total_questions > 0 else 0
        else:
            score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        
        raw_score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        
        # Create or update result
        result, created = Result.objects.update_or_create(
            attempt=attempt,
            defaults={
                'total_questions': total_questions,
                'correct_count': correct_count,
                'wrong_count': wrong_count,
                'unanswered_count': unanswered_count,
                'score': round(score, 2),
                'raw_score': round(raw_score, 2),
            }
        )
        
        # Update attempt status
        attempt.status = 'graded'
        attempt.save()
        
        return result
    
    @staticmethod
    @transaction.atomic
    def calculate_rankings(exam):
        """Calculate rankings for all participants of an exam"""
        
        # Get all graded results for this exam
        results = Result.objects.filter(
            attempt__exam=exam,
            attempt__status__in=['graded', 'result_released']
        ).select_related('attempt').order_by('-score', 'attempt__submitted_at')
        
        total_participants = results.count()
        
        # Calculate exam statistics
        stats = results.aggregate(
            average=Avg('score'),
            highest=Max('score'),
            lowest=Min('score')
        )
        
        # Assign ranks with tie handling
        current_rank = 1
        prev_score = None
        skip_count = 0
        
        for i, result in enumerate(results):
            if prev_score is not None and result.score < prev_score:
                current_rank = i + 1
            
            result.rank = current_rank
            result.total_participants = total_participants
            result.exam_average = stats['average']
            result.exam_highest = stats['highest']
            result.exam_lowest = stats['lowest']
            result.save()
            
            prev_score = result.score
            skip_count += 1
        
        return results
    
    @staticmethod
    @transaction.atomic
    def calculate_question_statistics(exam):
        """Calculate statistics for each question in an exam"""
        
        questions = exam.questions.all()
        attempts = ExamAttempt.objects.filter(
            exam=exam,
            status__in=['submitted', 'auto_submitted', 'graded', 'result_released']
        )
        total_attempts = attempts.count()
        
        if total_attempts == 0:
            return
        
        for question in questions:
            answers = Answer.objects.filter(
                attempt__exam=exam,
                question=question,
                attempt__status__in=['submitted', 'auto_submitted', 'graded', 'result_released']
            )
            
            correct_count = answers.filter(selected_answer=question.correct_answer).count()
            unanswered_count = answers.filter(selected_answer__isnull=True).count()
            wrong_count = total_attempts - correct_count - unanswered_count
            
            option_a_count = answers.filter(selected_answer='A').count()
            option_b_count = answers.filter(selected_answer='B').count()
            option_c_count = answers.filter(selected_answer='C').count()
            option_d_count = answers.filter(selected_answer='D').count()
            
            correct_percentage = (correct_count / total_attempts * 100) if total_attempts > 0 else 0
            wrong_percentage = (wrong_count / total_attempts * 100) if total_attempts > 0 else 0
            unanswered_percentage = (unanswered_count / total_attempts * 100) if total_attempts > 0 else 0
            
            QuestionStatistics.objects.update_or_create(
                exam=exam,
                question=question,
                defaults={
                    'total_attempts': total_attempts,
                    'correct_count': correct_count,
                    'wrong_count': wrong_count,
                    'unanswered_count': unanswered_count,
                    'option_a_count': option_a_count,
                    'option_b_count': option_b_count,
                    'option_c_count': option_c_count,
                    'option_d_count': option_d_count,
                    'correct_percentage': round(correct_percentage, 2),
                    'wrong_percentage': round(wrong_percentage, 2),
                    'unanswered_percentage': round(unanswered_percentage, 2),
                    'difficulty_index': round(correct_percentage, 2),
                }
            )
    
    @staticmethod
    def release_results(exam):
        """Release results for an exam"""
        attempts = ExamAttempt.objects.filter(
            exam=exam,
            status='graded'
        )
        attempts.update(status='result_released')
        
        # Create notifications
        from apps.exams.models import ExamNotification
        notifications = []
        for attempt in attempts:
            notifications.append(
                ExamNotification(
                    user=attempt.student,
                    exam=exam,
                    notification_type='result_released',
                    message=f'نتیجه آزمون "{exam.title}" منتشر شد.'
                )
            )
        ExamNotification.objects.bulk_create(notifications)
    
    @staticmethod
    def get_student_history(student):
        """Get exam history for a student"""
        results = Result.objects.filter(
            attempt__student=student,
            attempt__status__in=['graded', 'result_released']
        ).select_related('attempt__exam').order_by('-attempt__submitted_at')
        
        return results
    
    @staticmethod
    def get_student_stats(student):
        """Get overall statistics for a student"""
        results = Result.objects.filter(
            attempt__student=student,
            attempt__status__in=['graded', 'result_released']
        )
        
        if not results.exists():
            return {
                'exams_taken': 0,
                'average_score': 0,
                'best_score': 0,
                'latest_rank': None,
                'best_rank': None,
            }
        
        from django.db.models import Avg
        
        stats = results.aggregate(
            average_score=Avg('score'),
            best_score=Max('score'),
        )
        
        latest_result = results.order_by('-attempt__submitted_at').first()
        best_rank_result = results.filter(rank__isnull=False).order_by('rank').first()
        
        return {
            'exams_taken': results.count(),
            'average_score': round(stats['average_score'], 2),
            'best_score': round(stats['best_score'], 2),
            'latest_rank': latest_result.rank if latest_result else None,
            'best_rank': best_rank_result.rank if best_rank_result else None,
        }
