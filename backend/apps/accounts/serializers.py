from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Class


class ClassSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Class
        fields = ['id', 'name', 'description', 'is_active', 'student_count', 'created_at']
        read_only_fields = ['created_at']

    def get_student_count(self, obj):
        return obj.students.filter(is_active_student=True).count()


class UserSerializer(serializers.ModelSerializer):
    classes = ClassSerializer(many=True, read_only=True)
    class_ids = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        many=True,
        write_only=True,
        source='classes',
        required=False
    )
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'student_id', 'phone_number', 'classes', 'class_ids',
            'is_active_student', 'full_name', 'date_joined'
        ]
        read_only_fields = ['date_joined', 'role']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def get_full_name(self, obj):
        return obj.get_full_name()

    def create(self, validated_data):
        classes = validated_data.pop('classes', [])
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password('defaultpass123')
        user.role = 'student'
        user.save()
        if classes:
            user.classes.set(classes)
        return user

    def update(self, instance, validated_data):
        classes = validated_data.pop('classes', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        
        if classes is not None:
            instance.classes.set(classes)
        
        return instance


class StudentCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    class_ids = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        many=True,
        write_only=True,
        source='classes',
        required=False
    )

    class Meta:
        model = User
        fields = [
            'username', 'password', 'first_name', 'last_name',
            'email', 'student_id', 'phone_number', 'class_ids'
        ]

    def create(self, validated_data):
        classes = validated_data.pop('classes', [])
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.role = 'student'
        user.save()
        if classes:
            user.classes.set(classes)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError('حساب کاربری غیرفعال شده است.')
                data['user'] = user
            else:
                raise serializers.ValidationError('نام کاربری یا رمز عبور اشتباه است.')
        else:
            raise serializers.ValidationError('لطفاً نام کاربری و رمز عبور را وارد کنید.')
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('رمز عبور فعلی اشتباه است.')
        return value


class StudentProfileSerializer(serializers.ModelSerializer):
    classes = ClassSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    exams_taken = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'student_id', 'phone_number', 'classes', 'full_name',
            'exams_taken', 'average_score', 'date_joined'
        ]
        read_only_fields = ['username', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_exams_taken(self, obj):
        from apps.attempts.models import ExamAttempt
        return ExamAttempt.objects.filter(
            student=obj,
            status__in=['submitted', 'auto_submitted', 'graded', 'result_released']
        ).count()

    def get_average_score(self, obj):
        from apps.results.models import Result
        results = Result.objects.filter(attempt__student=obj)
        if results.exists():
            from django.db.models import Avg
            return results.aggregate(avg=Avg('score'))['avg']
        return None
