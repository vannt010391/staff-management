from django.db import models
from django.conf import settings
from tasks.models import Task
from projects.models import DesignRule


class TaskReview(models.Model):
    """
    Model để quản lý review của task
    """
    STATUS_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_revision', 'Needs Revision'),
    ]

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='reviews',
        help_text='Task được review'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        help_text='Người review (Manager/Admin)'
    )
    overall_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        help_text='Kết quả review tổng thể'
    )
    comment = models.TextField(
        blank=True,
        help_text='Nhận xét chung về task'
    )
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Task Review'
        verbose_name_plural = 'Task Reviews'
        ordering = ['-reviewed_at']

    def __str__(self):
        return f"Review of {self.task.title} - {self.get_overall_status_display()}"

    @property
    def total_criteria(self):
        """Tổng số tiêu chí được review"""
        return self.criteria.count()

    @property
    def met_criteria(self):
        """Số tiêu chí đã đáp ứng"""
        return self.criteria.filter(is_met=True).count()

    @property
    def criteria_percentage(self):
        """Phần trăm tiêu chí đạt được"""
        total = self.total_criteria
        if total == 0:
            return 0
        return (self.met_criteria / total) * 100


class ReviewCriteria(models.Model):
    """
    Model để chi tiết review từng quy tắc thiết kế
    """
    review = models.ForeignKey(
        TaskReview,
        on_delete=models.CASCADE,
        related_name='criteria',
        help_text='Review chứa criteria này'
    )
    design_rule = models.ForeignKey(
        DesignRule,
        on_delete=models.CASCADE,
        help_text='Quy tắc thiết kế được đánh giá'
    )
    is_met = models.BooleanField(
        help_text='Đã đáp ứng quy tắc hay chưa'
    )
    comment = models.TextField(
        blank=True,
        help_text='Nhận xét cụ thể về quy tắc này'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Review Criteria'
        verbose_name_plural = 'Review Criteria'
        ordering = ['design_rule__order', 'created_at']
        unique_together = ['review', 'design_rule']

    def __str__(self):
        status = "✓" if self.is_met else "✗"
        return f"{status} {self.design_rule.name}"
