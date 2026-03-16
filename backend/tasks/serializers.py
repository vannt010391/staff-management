from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Task, TaskFile, TaskComment
from projects.serializers import DesignRuleSerializer

User = get_user_model()


class TaskFileSerializer(serializers.ModelSerializer):
    """Serializer for TaskFile model"""
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True
    )
    uploaded_by_full_name = serializers.SerializerMethodField()
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
            'uploaded_by', 'uploaded_by_username', 'uploaded_by_full_name', 'uploaded_at'
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

    def get_uploaded_by_full_name(self, obj):
        if not obj.uploaded_by:
            return None
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for TaskComment model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    user_role = serializers.CharField(source='user.role', read_only=True)
    design_rule_name = serializers.CharField(source='design_rule.name', read_only=True)
    pass_fail_display = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    is_reply = serializers.BooleanField(read_only=True)

    class Meta:
        model = TaskComment
        fields = [
            'id', 'task', 'user', 'user_username', 'user_role',
            'user_full_name', 'comment', 'parent', 'is_reply', 'replies',
            'design_rule', 'design_rule_name', 'is_passed', 'pass_fail_display',
            'attachment', 'attachment_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate(self, attrs):
        task = attrs.get('task') or getattr(self.instance, 'task', None)
        design_rule = attrs.get('design_rule')

        if design_rule and task and design_rule.project_id != task.project_id:
            raise serializers.ValidationError('Design rule must belong to the same project as task.')

        return attrs

    def create(self, validated_data):
        if not validated_data.get('comment') and not validated_data.get('attachment'):
            raise serializers.ValidationError('Either comment text or attachment is required.')
        return super().create(validated_data)

    def get_replies(self, obj):
        """Get nested replies"""
        if obj.replies.exists():
            return TaskCommentSerializer(
                obj.replies.all(),
                many=True,
                context=self.context
            ).data
        return []

    def get_user_full_name(self, obj):
        if not obj.user:
            return None
        return obj.user.get_full_name() or obj.user.username

    def get_pass_fail_display(self, obj):
        if obj.is_passed is True:
            return 'pass'
        if obj.is_passed is False:
            return 'failed'
        return None

    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.attachment and request:
            return request.build_absolute_uri(obj.attachment.url)
        return None


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for listing tasks"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    assigned_to_username = serializers.CharField(
        source='assigned_to.username',
        read_only=True
    )
    assigned_to_full_name = serializers.SerializerMethodField()
    assigned_by_username = serializers.CharField(
        source='assigned_by.username',
        read_only=True
    )
    reviewer_username = serializers.CharField(
        source='reviewer.username',
        read_only=True
    )
    reviewer_full_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    freelancer_earning = serializers.SerializerMethodField()
    resource_count = serializers.SerializerMethodField()
    upload_count = serializers.SerializerMethodField()
    assignee_names = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description',
            'project', 'project_name', 'topic', 'topic_name',
            'assigned_to', 'assigned_to_username', 'assigned_to_full_name',
            'assigned_by', 'assigned_by_username',
            'reviewer', 'reviewer_username', 'reviewer_full_name',
            'assignees', 'assignee_names',
            'status', 'status_display', 'priority', 'priority_display',
            'stage', 'stage_display',
            'price', 'due_date', 'is_overdue', 'freelancer_earning',
            'resource_count', 'upload_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'assigned_by', 'created_at', 'updated_at']

    def get_assigned_to_full_name(self, obj):
        if not obj.assigned_to:
            return None
        return obj.assigned_to.get_full_name() or obj.assigned_to.username

    def get_freelancer_earning(self, obj):
        if obj.assigned_to and obj.status in ['approved', 'completed'] and obj.price is not None:
            return obj.price
        return 0

    def get_reviewer_full_name(self, obj):
        if not obj.reviewer:
            return None
        return obj.reviewer.get_full_name() or obj.reviewer.username

    def get_resource_count(self, obj):
        return obj.files.filter(file_type='reference').count()

    def get_upload_count(self, obj):
        return obj.files.exclude(file_type='reference').count()

    def get_assignee_names(self, obj):
        return [
            {'id': u.id, 'full_name': u.get_full_name() or u.username, 'username': u.username}
            for u in obj.assignees.all()
        ]


class TaskDetailSerializer(serializers.ModelSerializer):
    """Serializer for task detail with all related data"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    assigned_to_username = serializers.CharField(
        source='assigned_to.username',
        read_only=True
    )
    assigned_to_full_name = serializers.SerializerMethodField()
    assigned_by_username = serializers.CharField(
        source='assigned_by.username',
        read_only=True
    )
    reviewer_username = serializers.CharField(
        source='reviewer.username',
        read_only=True
    )
    reviewer_full_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    design_rules = DesignRuleSerializer(many=True, read_only=True)
    files = TaskFileSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    freelancer_earning = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()
    uploads = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description',
            'project', 'project_name', 'topic', 'topic_name',
            'assigned_to', 'assigned_to_username', 'assigned_to_full_name',
            'assigned_by', 'assigned_by_username',
            'reviewer', 'reviewer_username', 'reviewer_full_name',
            'status', 'status_display', 'priority', 'priority_display',
            'stage', 'stage_display',
            'price', 'due_date', 'is_overdue', 'freelancer_earning',
            'started_at', 'completed_at',
            'design_rules', 'files', 'resources', 'uploads', 'comments',
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

    def get_assigned_to_full_name(self, obj):
        if not obj.assigned_to:
            return None
        return obj.assigned_to.get_full_name() or obj.assigned_to.username

    def get_freelancer_earning(self, obj):
        if obj.assigned_to and obj.status in ['approved', 'completed'] and obj.price is not None:
            return obj.price
        return 0

    def get_reviewer_full_name(self, obj):
        if not obj.reviewer:
            return None
        return obj.reviewer.get_full_name() or obj.reviewer.username

    def get_resources(self, obj):
        queryset = obj.files.filter(file_type='reference')
        return TaskFileSerializer(queryset, many=True, context=self.context).data

    def get_uploads(self, obj):
        queryset = obj.files.exclude(file_type='reference')
        return TaskFileSerializer(queryset, many=True, context=self.context).data


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating tasks"""
    design_rule_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    assignees = serializers.PrimaryKeyRelatedField(
        many=True,
        required=False,
        queryset=User.objects.all()
    )

    class Meta:
        model = Task
        fields = [
            'title', 'description', 'project', 'topic',
            'assigned_to', 'assignees', 'reviewer', 'status', 'priority', 'stage', 'price', 'due_date',
            'design_rule_ids'
        ]

    def validate_reviewer(self, value):
        if value and value.role not in ['admin', 'manager', 'team_lead', 'staff'] and not value.is_superuser:
            raise serializers.ValidationError('Reviewer must be admin, manager, team lead, or staff.')
        return value

    def validate_price(self, value):
        """Validate price is positive if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Price must be positive.")
        return value

    def create(self, validated_data):
        """Create task with design rules and assignees"""
        design_rule_ids = validated_data.pop('design_rule_ids', [])
        assignees = validated_data.pop('assignees', [])
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

        # Add assignees
        if assignees:
            task.assignees.set(assignees)

        return task

    def update(self, instance, validated_data):
        """Update task with design rules and assignees"""
        design_rule_ids = validated_data.pop('design_rule_ids', None)
        assignees = validated_data.pop('assignees', None)

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

        # Update assignees if provided
        if assignees is not None:
            instance.assignees.set(assignees)

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


class TaskReviewerAssignSerializer(serializers.Serializer):
    """Serializer for assigning reviewer to a task"""
    reviewer = serializers.IntegerField(required=False, allow_null=True)

    def validate_reviewer(self, value):
        if value in [None, '']:
            return None

        from accounts.models import User

        try:
            reviewer = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Reviewer not found.')

        if reviewer.role not in ['admin', 'manager', 'team_lead', 'staff'] and not reviewer.is_superuser:
            raise serializers.ValidationError('Reviewer must be admin, manager, team lead, or staff.')

        return value
