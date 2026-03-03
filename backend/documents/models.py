from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Document(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='documents/', null=True, blank=True)
    external_url = models.URLField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='documents',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def clean(self):
        if not self.file and not self.external_url:
            raise ValidationError('Either file or external_url is required.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
