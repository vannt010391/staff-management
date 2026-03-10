from django.conf import settings
from django.db import models


class Event(models.Model):
    """
    Calendar event model for personal events
    """
    title = models.CharField(max_length=255, help_text='Event title')
    description = models.TextField(blank=True, help_text='Event description')
    start_date = models.DateField(help_text='Event start date')
    end_date = models.DateField(help_text='Event end date')
    start_time = models.TimeField(null=True, blank=True, help_text='Event start time (optional)')
    end_time = models.TimeField(null=True, blank=True, help_text='Event end time (optional)')
    is_all_day = models.BooleanField(default=True, help_text='Is this an all-day event')
    color = models.CharField(
        max_length=7,
        default='#3b82f6',
        help_text='Event color (hex format)'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='events',
        help_text='Event owner'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date', 'start_time']
        indexes = [
            models.Index(fields=['user', 'start_date']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.title} - {self.start_date}"
