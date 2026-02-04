from django.contrib import admin
from .models import Project, Topic, DesignRule


class TopicInline(admin.TabularInline):
    model = Topic
    extra = 1
    fields = ['name', 'description', 'order']


class DesignRuleInline(admin.TabularInline):
    model = DesignRule
    extra = 1
    fields = ['name', 'category', 'is_required', 'order']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'client_name', 'status', 'created_by', 'start_date', 'end_date', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'client_name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [TopicInline, DesignRuleInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'client_name')
        }),
        ('Project Details', {
            'fields': ('status', 'start_date', 'end_date', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'order', 'created_at']
    list_filter = ['project', 'created_at']
    search_fields = ['name', 'description', 'project__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(DesignRule)
class DesignRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'category', 'is_required', 'order', 'created_at']
    list_filter = ['project', 'category', 'is_required', 'created_at']
    search_fields = ['name', 'description', 'project__name']
    readonly_fields = ['created_at']
