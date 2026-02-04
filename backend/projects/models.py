from django.db import models
from django.conf import settings


class Project(models.Model):
    """
    Model để quản lý dự án
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    name = models.CharField(max_length=200, help_text='Tên dự án')
    description = models.TextField(blank=True, help_text='Mô tả dự án')
    client_name = models.CharField(max_length=200, blank=True, help_text='Tên khách hàng')
    start_date = models.DateField(null=True, blank=True, help_text='Ngày bắt đầu')
    end_date = models.DateField(null=True, blank=True, help_text='Ngày kết thúc')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        help_text='Trạng thái dự án'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_projects',
        help_text='Người tạo dự án'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def total_tasks(self):
        """Tổng số tasks trong dự án"""
        return self.tasks.count()

    @property
    def completed_tasks(self):
        """Số tasks đã hoàn thành"""
        return self.tasks.filter(status='completed').count()


class Topic(models.Model):
    """
    Model để quản lý chủ đề trong dự án
    """
    name = models.CharField(max_length=200, help_text='Tên chủ đề')
    description = models.TextField(blank=True, help_text='Mô tả chủ đề')
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='topics',
        help_text='Dự án chứa chủ đề này'
    )
    order = models.IntegerField(default=0, help_text='Thứ tự sắp xếp')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Topic'
        verbose_name_plural = 'Topics'
        ordering = ['project', 'order', 'created_at']
        unique_together = ['project', 'name']

    def __str__(self):
        return f"{self.project.name} - {self.name}"


class DesignRule(models.Model):
    """
    Model để quản lý quy tắc thiết kế cho dự án
    """
    CATEGORY_CHOICES = [
        ('layout', 'Layout'),
        ('typography', 'Typography'),
        ('color', 'Color Scheme'),
        ('content', 'Content'),
        ('animation', 'Animation'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=200, help_text='Tên quy tắc')
    description = models.TextField(help_text='Mô tả chi tiết quy tắc')
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='other',
        help_text='Danh mục quy tắc'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='design_rules',
        help_text='Dự án áp dụng quy tắc này'
    )
    is_required = models.BooleanField(
        default=True,
        help_text='Quy tắc bắt buộc hay tùy chọn'
    )
    order = models.IntegerField(default=0, help_text='Thứ tự sắp xếp')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Design Rule'
        verbose_name_plural = 'Design Rules'
        ordering = ['project', 'order', 'created_at']

    def __str__(self):
        return f"{self.project.name} - {self.name} ({self.get_category_display()})"
