from django.contrib import admin
from .models import Task, TaskFile, TaskComment


class TaskFileInline(admin.TabularInline):
    model = TaskFile
    extra = 1
    fields = ['file', 'file_type', 'uploaded_by', 'comment']
    readonly_fields = ['uploaded_by']


class TaskCommentInline(admin.TabularInline):
    model = TaskComment
    extra = 1
    fields = ['user', 'comment', 'parent']
    readonly_fields = ['user']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'project', 'assigned_to', 'status',
        'priority', 'price', 'due_date', 'created_at'
    ]
    list_filter = ['status', 'priority', 'project', 'created_at']
    search_fields = ['title', 'description', 'project__name', 'assigned_to__username']
    readonly_fields = ['created_at', 'updated_at', 'started_at', 'completed_at']
    filter_horizontal = ['design_rules']
    inlines = [TaskFileInline, TaskCommentInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'project', 'topic')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'assigned_by', 'status', 'priority')
        }),
        ('Financial', {
            'fields': ('price',)
        }),
        ('Dates', {
            'fields': ('due_date', 'started_at', 'completed_at')
        }),
        ('Design Rules', {
            'fields': ('design_rules',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskFile)
class TaskFileAdmin(admin.ModelAdmin):
    list_display = ['filename', 'task', 'file_type', 'uploaded_by', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['filename', 'task__title', 'uploaded_by__username']
    readonly_fields = ['uploaded_at']


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'user', 'comment_preview', 'parent', 'created_at']
    list_filter = ['created_at']
    search_fields = ['comment', 'task__title', 'user__username']
    readonly_fields = ['created_at', 'updated_at']

    def comment_preview(self, obj):
        """Show first 50 characters of comment"""
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Comment Preview'
