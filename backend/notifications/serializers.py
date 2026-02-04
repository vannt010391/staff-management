from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    notification_type_display = serializers.CharField(
        source='get_notification_type_display',
        read_only=True
    )
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_username',
            'notification_type', 'notification_type_display',
            'title', 'message', 'task', 'task_title',
            'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'recipient', 'created_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""

    class Meta:
        model = Notification
        fields = [
            'recipient', 'notification_type', 'title',
            'message', 'task'
        ]

    def validate(self, attrs):
        """Validate notification data"""
        notification_type = attrs.get('notification_type')
        task = attrs.get('task')

        # Some notification types require a task
        task_required_types = [
            'task_assigned',
            'task_status_changed',
            'new_comment',
            'review_completed',
            'file_uploaded',
            'task_due_soon',
            'task_overdue'
        ]

        if notification_type in task_required_types and not task:
            raise serializers.ValidationError({
                'task': f'Task is required for notification type: {notification_type}'
            })

        return attrs
