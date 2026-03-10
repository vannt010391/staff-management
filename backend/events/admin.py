from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'start_date', 'end_date', 'is_all_day', 'created_at']
    list_filter = ['is_all_day', 'start_date', 'user']
    search_fields = ['title', 'description', 'user__username']
    ordering = ['-start_date']
