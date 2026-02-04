from rest_framework import serializers
from django.utils import timezone
from .models import Task, TaskFile, TaskComment
from projects.serializers import DesignRuleSerializer


class TaskFileSerializer(serializers.ModelSerializer):
    """Serializer for TaskFile model"""
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True
    )
    file_type_display = serializers.CharField(
        source='get_file_type_display',
        read_only=True
    )
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskFile
        fields = [
            'id', 'task', 'file', 'file_url', 'file_type', 'file_type_display',
            'filename', 'file_size', 'comment',
            'uploaded_by', 'uploaded_by_username', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at', 'file_size', 'filename']

    def get_file_url(self, obj):
        """Get full URL for file"""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def create(self, validated_data):
        """Auto-populate filename and file_size"""
        file = validated_data.get('file')
        if file:
            validated_data['filename'] = file.name
            validated_data['file_size'] = file.size

        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for TaskComment model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    replies = serializers.SerializerMethodField()
    is_reply = serializers.BooleanField(read_only=True)

    class Meta:
        model = TaskComment
        fields = [
            'id', 'task', 'user', 'user_username', 'user_role',
            'comment', 'parent', 'is_reply', 'replies',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_replies(self, obj):
        """Get nested replies"""
        if obj.replies.exists():
            return TaskCommentSerializer(
                obj.replies.all(),
                many=True,
                context=self.context
            ).data
        return []


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for listing tasks"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    assigned_to_username = serializers.CharField(
        source='assigned_to.username',
        read_only=True
    )
    assigned_by_username = serializers.CharField(
        source='assigned_by.username',
        read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description',
            'project', 'project_name', 'topic', 'topic_name',
            'assigned_to', 'assigned_to_username',
            'assigned_by', 'assigned_by_username',
            'status', 'status_display', 'priority', 'priority_display',
            'price', 'due_date', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'assigned_by', 'created_at', 'updated_at']


class TaskDetailSerializer(serializers.ModelSerializer):
    """Serializer for task detail with all related data"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    assigned_to_username = serializers.CharField(
        source='assigned_to.username',
        read_only=True
    )
    assigned_by_username = serializers.CharField(
        source='assigned_by.username',
        read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    design_rules = DesignRuleSerializer(many=True, read_only=True)
    files = TaskFileSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description',
            'project', 'project_name', 'topic', 'topic_name',
            'assigned_to', 'assigned_to_username',
            'assigned_by', 'assigned_by_username',
            'status', 'status_display', 'priority', 'priority_display',
            'price', 'due_date', 'is_overdue',
            'started_at', 'completed_at',
            'design_rules', 'files', 'comments',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'assigned_by', 'started_at', 'completed_at',
            'created_at', 'updated_at'
        ]

    def get_comments(self, obj):
        """Get only top-level comments (not replies)"""
        comments = obj.comments.filter(parent=None)
        return TaskCommentSerializer(
            comments,
            many=True,
            context=self.context
        ).data


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating tasks"""
    design_rule_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Task
        fields = [
            'title', 'description', 'project', 'topic',
            'assigned_to', 'status', 'priority', 'price', 'due_date',
            'design_rule_ids'
        ]

    def validate_price(self, value):
        """Validate price is positive"""
        if value < 0:
            raise serializers.ValidationError("Price must be positive.")
        return value

    def create(self, validated_data):
        """Create task with design rules"""
        design_rule_ids = validated_data.pop('design_rule_ids', [])
        validated_data['assigned_by'] = self.context['request'].user

        # Auto-set started_at when status is 'working'
        if validated_data.get('status') == 'working' and not validated_data.get('started_at'):
            validated_data['started_at'] = timezone.now()

        # Auto-set completed_at when status is 'completed'
        if validated_data.get('status') == 'completed' and not validated_data.get('completed_at'):
            validated_data['completed_at'] = timezone.now()

        task = Task.objects.create(**validated_data)

        # Add design rules
        if design_rule_ids:
            task.design_rules.set(design_rule_ids)

        return task

    def update(self, instance, validated_data):
        """Update task with design rules"""
        design_rule_ids = validated_data.pop('design_rule_ids', None)

        # Auto-set started_at when status changes to 'working'
        if validated_data.get('status') == 'working' and not instance.started_at:
            validated_data['started_at'] = timezone.now()

        # Auto-set completed_at when status changes to 'completed'
        if validated_data.get('status') == 'completed' and not instance.completed_at:
            validated_data['completed_at'] = timezone.now()

        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update design rules if provided
        if design_rule_ids is not None:
            instance.design_rules.set(design_rule_ids)

        return instance


class TaskAssignSerializer(serializers.Serializer):
    """Serializer for assigning task to freelancer"""
    assigned_to = serializers.IntegerField(required=True)

    def validate_assigned_to(self, value):
        """Validate that user exists and is a freelancer"""
        from accounts.models import User

        try:
            user = User.objects.get(id=value)
            if user.role != 'freelancer':
                raise serializers.ValidationError(
                    "Can only assign tasks to freelancers."
                )
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")


class TaskStatusChangeSerializer(serializers.Serializer):
    """Serializer for changing task status"""
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, required=True)
    comment = serializers.CharField(required=False, allow_blank=True)
