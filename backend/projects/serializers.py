from rest_framework import serializers
from .models import Project, Topic, DesignRule


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

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'client_name',
            'status', 'status_display', 'start_date', 'end_date',
            'created_by', 'created_by_username',
            'total_tasks', 'completed_tasks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


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

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'client_name',
            'status', 'status_display', 'start_date', 'end_date',
            'created_by', 'created_by_username',
            'topics', 'design_rules',
            'total_tasks', 'completed_tasks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating projects"""

    class Meta:
        model = Project
        fields = [
            'name', 'description', 'client_name',
            'status', 'start_date', 'end_date'
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
