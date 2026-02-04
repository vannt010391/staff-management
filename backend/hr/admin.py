from django.contrib import admin
from .models import Department, CareerPath, Employee, KPI, Evaluation, SalaryReview, PersonalReport


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['created_at']


@admin.register(CareerPath)
class CareerPathAdmin(admin.ModelAdmin):
    list_display = ['level', 'min_years_experience', 'min_salary', 'max_salary']
    list_filter = ['level']
    ordering = ['min_years_experience']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'user', 'department', 'position', 'career_level', 'current_salary', 'join_date', 'is_active']
    search_fields = ['employee_id', 'user__username', 'user__first_name', 'user__last_name', 'position']
    list_filter = ['department', 'career_level', 'contract_type', 'is_active', 'join_date']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'employee_id', 'is_active')
        }),
        ('Job Info', {
            'fields': ('department', 'position', 'career_level', 'contract_type', 'join_date')
        }),
        ('Salary Info', {
            'fields': ('current_salary', 'last_salary_review')
        }),
        ('Personal Info', {
            'fields': ('date_of_birth', 'citizen_id', 'address', 'emergency_contact_name', 'emergency_contact_phone')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(KPI)
class KPIAdmin(admin.ModelAdmin):
    list_display = ['employee', 'month', 'overall_score', 'tasks_completed', 'tasks_on_time', 'created_by']
    list_filter = ['month', 'created_by']
    search_fields = ['employee__employee_id', 'employee__user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ['employee', 'period_type', 'period_start', 'period_end', 'overall_rating', 'salary_increase_recommended', 'employee_acknowledged']
    list_filter = ['period_type', 'overall_rating', 'promotion_recommended', 'salary_increase_recommended', 'employee_acknowledged']
    search_fields = ['employee__employee_id', 'employee__user__username']
    readonly_fields = ['created_at', 'updated_at', 'employee_acknowledged_at']
    fieldsets = (
        ('Evaluation Info', {
            'fields': ('employee', 'evaluator', 'period_type', 'period_start', 'period_end')
        }),
        ('Rating', {
            'fields': ('overall_rating', 'strengths', 'areas_for_improvement', 'achievements', 'goals_next_period')
        }),
        ('Recommendations', {
            'fields': ('promotion_recommended', 'salary_increase_recommended', 'recommended_increase_percentage')
        }),
        ('Employee Feedback', {
            'fields': ('employee_comments', 'employee_acknowledged', 'employee_acknowledged_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(SalaryReview)
class SalaryReviewAdmin(admin.ModelAdmin):
    list_display = ['employee', 'current_salary', 'proposed_salary', 'increase_percentage', 'status', 'effective_date', 'requested_by']
    list_filter = ['status', 'effective_date', 'created_at']
    search_fields = ['employee__employee_id', 'employee__user__username']
    readonly_fields = ['increase_percentage', 'created_at', 'updated_at', 'reviewed_at']
    fieldsets = (
        ('Employee & Request Info', {
            'fields': ('employee', 'requested_by')
        }),
        ('Salary Info', {
            'fields': ('current_salary', 'proposed_salary', 'increase_percentage', 'effective_date')
        }),
        ('Justification', {
            'fields': ('reason', 'justification')
        }),
        ('Review', {
            'fields': ('status', 'reviewed_by', 'reviewed_at', 'review_comments')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(PersonalReport)
class PersonalReportAdmin(admin.ModelAdmin):
    list_display = ['employee', 'report_type', 'period_start', 'period_end', 'tasks_completed', 'hours_worked', 'manager_reviewed_by']
    list_filter = ['report_type', 'period_start', 'manager_reviewed_by']
    search_fields = ['employee__employee_id', 'employee__user__username']
    readonly_fields = ['created_at', 'updated_at', 'manager_reviewed_at']
    fieldsets = (
        ('Report Info', {
            'fields': ('employee', 'report_type', 'period_start', 'period_end')
        }),
        ('Content', {
            'fields': ('summary', 'achievements', 'challenges', 'plan_next_period')
        }),
        ('Metrics', {
            'fields': ('tasks_completed', 'hours_worked')
        }),
        ('Manager Feedback', {
            'fields': ('manager_feedback', 'manager_reviewed_by', 'manager_reviewed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
