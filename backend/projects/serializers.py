from rest_framework import serializers
from .models import Project, Topic, DesignRule
from hr.serializers import DepartmentSerializer
from hr.models import Department
from accounts.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class DesignRuleSerializer(serializers.ModelSerializer):
    """Serializer for DesignRule model"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = DesignRule
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'project', 'is_required', 'order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic model"""
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'description', 'project', 'order',
            'task_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        """Get number of tasks in this topic"""
        return obj.tasks.count()


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for listing projects"""
    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_tasks = serializers.IntegerField(read_only=True)
    completed_tasks = serializers.IntegerField(read_only=True)
    progress = serializers.FloatField(read_only=True)
    department_names = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'client_name', 'budget',
            'status', 'status_display', 'start_date', 'end_date',
            'created_by', 'created_by_username',
            'total_tasks', 'completed_tasks', 'progress',
            'department_names', 'member_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_department_names(self, obj):
        return list(obj.departments.values_list('name', flat=True))

    def get_member_count(self, obj):
        return obj.members.count()

    def to_representation(self, instance):
        """Hide budget field from staff users"""
        data = super().to_representation(instance)
        request = self.context.get('request')

        # If user is staff, remove budget field
        if request and hasattr(request, 'user') and request.user.role == 'staff':
            data.pop('budget', None)

        return data


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Serializer for project detail with related data"""
    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    topics = TopicSerializer(many=True, read_only=True)
    design_rules = DesignRuleSerializer(many=True, read_only=True)
    total_tasks = serializers.IntegerField(read_only=True)
    completed_tasks = serializers.IntegerField(read_only=True)
    progress = serializers.FloatField(read_only=True)
    departments_details = DepartmentSerializer(source='departments', many=True, read_only=True)
    members_details = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'client_name', 'budget',
            'status', 'status_display', 'start_date', 'end_date',
            'created_by', 'created_by_username',
            'topics', 'design_rules',
            'total_tasks', 'completed_tasks', 'progress',
            'departments', 'departments_details',
            'members', 'members_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_members_details(self, obj):
        return [
            {'id': u.id, 'username': u.username, 'full_name': u.get_full_name() or u.username, 'role': u.role}
            for u in obj.members.all()
        ]

    def to_representation(self, instance):
        """Hide budget field from staff users"""
        data = super().to_representation(instance)
        request = self.context.get('request')

        # If user is staff, remove budget field
        if request and hasattr(request, 'user') and request.user.role == 'staff':
            data.pop('budget', None)

        return data


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating projects"""
    departments = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Department.objects.all(),
        required=False
    )
    members = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False
    )

    class Meta:
        model = Project
        fields = [
            'name', 'description', 'client_name', 'budget',
            'status', 'start_date', 'end_date',
            'departments', 'members'
        ]

    def validate(self, attrs):
        """Validate start and end dates"""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })

        return attrs
