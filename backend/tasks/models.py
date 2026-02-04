from django.db import models
from django.conf import settings
from projects.models import Project, Topic, DesignRule


class Task(models.Model):
    """
    Model để quản lý công việc (task)
    """
    STATUS_CHOICES = [
        ('new', 'New'),
        ('assigned', 'Assigned'),
        ('working', 'Working'),
        ('review_pending', 'Review Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Basic Info
    title = models.CharField(max_length=200, help_text='Tiêu đề task')
    description = models.TextField(help_text='Mô tả chi tiết task')

    # Relationships
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text='Dự án chứa task này'
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        help_text='Chủ đề của task'
    )

    # Task Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        help_text='Freelancer được giao task'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tasks',
        help_text='Người giao task (Manager/Admin)'
    )

    # Task Details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        help_text='Trạng thái task'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text='Độ ưu tiên'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Giá tiền cho task này'
    )

    # Dates
    due_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Hạn chót hoàn thành'
    )
    started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Thời gian bắt đầu làm'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Thời gian hoàn thành'
    )

    # Design Rules
    design_rules = models.ManyToManyField(
        DesignRule,
        related_name='tasks',
        blank=True,
        help_text='Các quy tắc thiết kế áp dụng cho task này'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"

    @property
    def is_overdue(self):
        """Kiểm tra task có quá hạn không"""
        from django.utils import timezone
        if self.due_date and self.status not in ['completed', 'approved']:
            return timezone.now() > self.due_date
        return False


class TaskFile(models.Model):
    """
    Model để quản lý files đính kèm trong task
    """
    FILE_TYPE_CHOICES = [
        ('reference', 'Reference'),  # File tham khảo
        ('submission', 'Submission'),  # Bài làm
        ('revision', 'Revision'),  # File sửa
        ('other', 'Other'),
    ]

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='files',
        help_text='Task chứa file này'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        help_text='Người upload file'
    )
    file = models.FileField(
        upload_to='task_files/',
        help_text='File đính kèm'
    )
    file_type = models.CharField(
        max_length=20,
        choices=FILE_TYPE_CHOICES,
        default='other',
        help_text='Loại file'
    )
    filename = models.CharField(
        max_length=255,
        help_text='Tên file gốc'
    )
    file_size = models.IntegerField(
        help_text='Kích thước file (bytes)'
    )
    comment = models.TextField(
        blank=True,
        help_text='Ghi chú về file'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Task File'
        verbose_name_plural = 'Task Files'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.task.title} - {self.filename}"


class TaskComment(models.Model):
    """
    Model để quản lý comments trong task
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text='Task chứa comment này'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        help_text='Người comment'
    )
    comment = models.TextField(help_text='Nội dung comment')
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        help_text='Comment cha (nếu là reply)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Task Comment'
        verbose_name_plural = 'Task Comments'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username if self.user else 'Unknown'} - {self.task.title}"

    @property
    def is_reply(self):
        """Kiểm tra có phải là reply không"""
        return self.parent is not None
