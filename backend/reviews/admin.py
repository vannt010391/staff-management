from django.contrib import admin
from .models import TaskReview, ReviewCriteria


class ReviewCriteriaInline(admin.TabularInline):
    model = ReviewCriteria
    extra = 0
    fields = ['design_rule', 'is_met', 'comment']


@admin.register(TaskReview)
class TaskReviewAdmin(admin.ModelAdmin):
    list_display = [
        'task', 'reviewer', 'overall_status',
        'met_criteria_display', 'reviewed_at'
    ]
    list_filter = ['overall_status', 'reviewed_at']
    search_fields = ['task__title', 'reviewer__username', 'comment']
    readonly_fields = ['reviewed_at', 'criteria_percentage']
    inlines = [ReviewCriteriaInline]

    fieldsets = (
        ('Review Information', {
            'fields': ('task', 'reviewer', 'overall_status', 'comment')
        }),
        ('Statistics', {
            'fields': ('criteria_percentage',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('reviewed_at',),
            'classes': ('collapse',)
        }),
    )

    def met_criteria_display(self, obj):
        """Display met criteria as a fraction"""
        return f"{obj.met_criteria}/{obj.total_criteria}"
    met_criteria_display.short_description = 'Criteria Met'


@admin.register(ReviewCriteria)
class ReviewCriteriaAdmin(admin.ModelAdmin):
    list_display = ['review', 'design_rule', 'is_met', 'created_at']
    list_filter = ['is_met', 'created_at']
    search_fields = ['review__task__title', 'design_rule__name', 'comment']
    readonly_fields = ['created_at']
