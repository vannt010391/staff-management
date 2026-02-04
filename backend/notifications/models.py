from django.db import models
from django.conf import settings
from tasks.models import Task


class Notification(models.Model):
    """
    Model để quản lý thông báo cho người dùng
    """
    NOTIFICATION_TYPES = [
        ('task_assigned', 'Task Assigned'),
        ('task_status_changed', 'Task Status Changed'),
        ('new_comment', 'New Comment'),
        ('review_completed', 'Review Completed'),
        ('file_uploaded', 'File Uploaded'),
        ('task_due_soon', 'Task Due Soon'),
        ('task_overdue', 'Task Overdue'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='Người nhận thông báo'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        help_text='Loại thông báo'
    )
    title = models.CharField(
        max_length=200,
        help_text='Tiêu đề thông báo'
    )
    message = models.TextField(
        help_text='Nội dung thông báo'
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text='Task liên quan (nếu có)'
    )
    is_read = models.BooleanField(
        default=False,
        help_text='Đã đọc hay chưa'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.recipient.username}"

    def mark_as_read(self):
        """Đánh dấu thông báo đã đọc"""
        self.is_read = True
        self.save()
