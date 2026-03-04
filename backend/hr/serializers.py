from rest_framework import serializers
from .models import (
    Department, CareerPath, Employee, KPI, Evaluation, SalaryReview,
    PersonalReport, Plan, PlanGoal, PlanNote, PlanDailyProgress,
    PlanUpdateHistory, Attendance, AttendanceSettings
)
from accounts.serializers import UserSerializer


class DepartmentSerializer(serializers.ModelSerializer):
    manager_details = UserSerializer(source='manager', read_only=True)
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'manager', 'manager_details', 'employee_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class CareerPathSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model = CareerPath
        fields = ['id', 'level', 'level_display', 'min_years_experience', 'min_salary', 'max_salary',
                  'requirements', 'benefits', 'employee_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    career_level_details = CareerPathSerializer(source='career_level', read_only=True)
    contract_type_display = serializers.CharField(source='get_contract_type_display', read_only=True)
    years_of_service = serializers.ReadOnlyField()

    class Meta:
        model = Employee
        fields = ['id', 'user', 'user_details', 'employee_id', 'department', 'department_details',
                  'career_level', 'career_level_details', 'position', 'contract_type', 'contract_type_display',
                  'join_date', 'current_salary', 'last_salary_review', 'date_of_birth', 'citizen_id',
                  'address', 'emergency_contact_name', 'emergency_contact_phone', 'is_active', 'notes',
                  'years_of_service', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'years_of_service', 'user']  # user is read-only on update
        extra_kwargs = {
            'current_salary': {'write_only': False},
            'citizen_id': {'write_only': True},
            'address': {'write_only': True},
            'emergency_contact_name': {'write_only': True},
            'emergency_contact_phone': {'write_only': True},
        }


class EmployeeListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views - includes current_salary for salary reviews"""
    user_details = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    career_level_display = serializers.CharField(source='career_level.get_level_display', read_only=True)
    years_of_service = serializers.ReadOnlyField()

    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'user_details', 'department_name', 'position',
                  'career_level_display', 'join_date', 'current_salary', 'years_of_service', 'is_active']

    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.get_full_name() or obj.user.username,
            'email': obj.user.email,
            'role': obj.user.role,
        }


class KPISerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    on_time_percentage = serializers.SerializerMethodField()

    class Meta:
        model = KPI
        fields = ['id', 'employee', 'employee_details', 'month', 'tasks_completed', 'tasks_on_time',
                  'on_time_percentage', 'quality_score', 'collaboration_score', 'innovation_score',
                  'overall_score', 'notes', 'created_by', 'created_by_details', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_on_time_percentage(self, obj):
        if obj.tasks_completed > 0:
            return round((obj.tasks_on_time / obj.tasks_completed) * 100, 2)
        return 0


class EvaluationSerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    evaluator_details = UserSerializer(source='evaluator', read_only=True)
    period_type_display = serializers.CharField(source='get_period_type_display', read_only=True)
    overall_rating_display = serializers.CharField(source='get_overall_rating_display', read_only=True)

    class Meta:
        model = Evaluation
        fields = ['id', 'employee', 'employee_details', 'evaluator', 'evaluator_details',
                  'period_type', 'period_type_display', 'period_start', 'period_end',
                  'overall_rating', 'overall_rating_display', 'strengths', 'areas_for_improvement',
                  'achievements', 'goals_next_period', 'promotion_recommended', 'salary_increase_recommended',
                  'recommended_increase_percentage', 'employee_comments', 'employee_acknowledged',
                  'employee_acknowledged_at', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'employee_acknowledged_at']


class EvaluationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    employee_name = serializers.SerializerMethodField()
    evaluator_name = serializers.SerializerMethodField()
    period_type_display = serializers.CharField(source='get_period_type_display', read_only=True)
    overall_rating_display = serializers.CharField(source='get_overall_rating_display', read_only=True)

    class Meta:
        model = Evaluation
        fields = ['id', 'employee', 'employee_name', 'evaluator_name', 'period_type', 'period_type_display',
                  'period_start', 'period_end', 'overall_rating', 'overall_rating_display',
                  'salary_increase_recommended', 'employee_acknowledged']

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name() or obj.employee.user.username

    def get_evaluator_name(self, obj):
        return obj.evaluator.get_full_name() or obj.evaluator.username if obj.evaluator else None


class SalaryReviewSerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    requested_by_details = UserSerializer(source='requested_by', read_only=True)
    reviewed_by_details = UserSerializer(source='reviewed_by', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SalaryReview
        fields = ['id', 'employee', 'employee_details', 'requested_by', 'requested_by_details',
                  'current_salary', 'proposed_salary', 'increase_percentage', 'reason', 'justification',
                  'effective_date', 'status', 'status_display', 'reviewed_by', 'reviewed_by_details',
                  'reviewed_at', 'review_comments', 'created_at', 'updated_at']
        read_only_fields = ['increase_percentage', 'created_at', 'updated_at', 'reviewed_at']


class SalaryReviewListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    employee_name = serializers.SerializerMethodField()
    requested_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SalaryReview
        fields = ['id', 'employee', 'employee_name', 'requested_by_name', 'current_salary',
                  'proposed_salary', 'increase_percentage', 'effective_date', 'status', 'status_display', 'created_at']

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name() or obj.employee.user.username

    def get_requested_by_name(self, obj):
        return obj.requested_by.get_full_name() or obj.requested_by.username if obj.requested_by else None


class PersonalReportSerializer(serializers.ModelSerializer):
    employee_details = EmployeeListSerializer(source='employee', read_only=True)
    manager_reviewed_by_details = UserSerializer(source='manager_reviewed_by', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    is_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = PersonalReport
        fields = ['id', 'employee', 'employee_details', 'report_type', 'report_type_display',
                  'period_start', 'period_end', 'summary', 'achievements', 'challenges', 'plan_next_period',
                  'tasks_completed', 'hours_worked', 'manager_feedback', 'manager_reviewed_by',
                  'manager_reviewed_by_details', 'manager_reviewed_at', 'is_reviewed', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'manager_reviewed_at']

    def get_is_reviewed(self, obj):
        return obj.manager_reviewed_by is not None


class PersonalReportListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    employee_name = serializers.SerializerMethodField()
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    is_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = PersonalReport
        fields = ['id', 'employee', 'employee_name', 'report_type', 'report_type_display',
                  'period_start', 'period_end', 'tasks_completed', 'hours_worked', 'is_reviewed', 'created_at']

    def get_employee_name(self, obj):
        return obj.employee.user.get_full_name() or obj.employee.user.username

    def get_is_reviewed(self, obj):
        return obj.manager_reviewed_by is not None


class PlanGoalSerializer(serializers.ModelSerializer):
    related_task_details = serializers.SerializerMethodField()
    related_project_details = serializers.SerializerMethodField()
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = PlanGoal
        fields = [
            'id', 'title', 'description', 'priority', 'priority_display', 'is_completed',
            'completed_at', 'progress_notes', 'related_task', 'related_project',
            'related_task_details', 'related_project_details', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['completed_at', 'created_at', 'updated_at']

    def get_related_task_details(self, obj):
        if obj.related_task:
            return {
                'id': obj.related_task.id,
                'title': obj.related_task.title,
                'status': obj.related_task.status
            }
        return None

    def get_related_project_details(self, obj):
        if obj.related_project:
            return {
                'id': obj.related_project.id,
                'name': obj.related_project.name,
                'status': obj.related_project.status
            }
        return None


class PlanNoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = PlanNote
        fields = ['id', 'note', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['created_by', 'created_at']


class PlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    user_name = serializers.SerializerMethodField()
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active_period = serializers.ReadOnlyField()

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name if full_name else obj.user.username

    class Meta:
        model = Plan
        fields = [
            'id', 'user', 'user_name', 'plan_type', 'plan_type_display',
            'period_start', 'period_end', 'title', 'status', 'status_display',
            'completion_percentage', 'is_active_period', 'created_at'
        ]
        read_only_fields = ['completion_percentage', 'created_at']


class PlanSerializer(serializers.ModelSerializer):
    """Full serializer with nested data"""
    user_name = serializers.SerializerMethodField()
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active_period = serializers.ReadOnlyField()
    total_goals = serializers.ReadOnlyField()
    completed_goals = serializers.ReadOnlyField()

    goals = PlanGoalSerializer(many=True, read_only=True)
    notes = PlanNoteSerializer(many=True, read_only=True)
    daily_progress = serializers.SerializerMethodField()
    update_history = serializers.SerializerMethodField()

    reviewed_by_name = serializers.CharField(
        source='reviewed_by.get_full_name',
        read_only=True,
        allow_null=True
    )
    parent_plan_title = serializers.CharField(
        source='parent_plan.title',
        read_only=True,
        allow_null=True
    )

    def get_user_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name if full_name else obj.user.username

    class Meta:
        model = Plan
        fields = [
            'id', 'user', 'user_name', 'plan_type', 'plan_type_display',
            'period_start', 'period_end', 'title', 'description', 'status',
            'status_display', 'completion_percentage', 'manager_feedback',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'parent_plan',
            'parent_plan_title', 'is_active_period', 'total_goals', 'completed_goals',
            'goals', 'notes', 'daily_progress', 'update_history', 'created_at', 'updated_at'
        ]
        read_only_fields = ['completion_percentage', 'reviewed_at', 'created_at', 'updated_at']

    def get_daily_progress(self, obj):
        # Return empty list to avoid circular import issues
        # Full daily progress will be fetched via separate endpoint
        return []

    def get_update_history(self, obj):
        # Return empty list to avoid circular import issues
        # Full history will be fetched via separate endpoint
        return []


class PlanDailyProgressSerializer(serializers.ModelSerializer):
    """Serializer for daily progress tracking"""
    class Meta:
        model = PlanDailyProgress
        fields = [
            'id', 'plan', 'date', 'completed_goals_count',
            'hours_worked', 'progress_notes', 'work_results', 'blockers', 'next_plan',
            'completion_percentage_snapshot',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PlanUpdateHistorySerializer(serializers.ModelSerializer):
    """Serializer for plan update history"""
    changed_by_name = serializers.CharField(
        source='changed_by.get_full_name',
        read_only=True,
        allow_null=True
    )
    action_display = serializers.CharField(
        source='get_action_display',
        read_only=True
    )

    class Meta:
        model = PlanUpdateHistory
        fields = [
            'id', 'plan', 'action', 'action_display',
            'changed_by', 'changed_by_name', 'changed_at',
            'previous_values', 'current_values', 'change_description'
        ]
        read_only_fields = ['changed_by', 'changed_at']


class AttendanceSerializer(serializers.ModelSerializer):
    """Full serializer for attendance records"""
    user_details = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    has_checked_in = serializers.ReadOnlyField()
    has_checked_out = serializers.ReadOnlyField()
    is_currently_working = serializers.ReadOnlyField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_details', 'date', 'check_in_time', 'check_out_time',
            'status', 'status_display', 'notes', 'check_in_location', 'check_out_location',
            'total_hours', 'is_late', 'has_checked_in', 'has_checked_out',
            'is_currently_working', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'total_hours', 'is_late', 'created_at', 'updated_at']

    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'full_name': obj.user.get_full_name() or obj.user.username,
            'email': obj.user.email,
            'role': obj.user.role,
        }


class AttendanceListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views"""
    user_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_name', 'date', 'check_in_time', 'check_out_time',
            'status', 'status_display', 'total_hours', 'is_late'
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class AttendanceCheckInSerializer(serializers.Serializer):
    """Serializer for check-in action"""
    location = serializers.CharField(max_length=200, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=['present', 'wfh', 'half_day'],
        default='present'
    )


class AttendanceCheckOutSerializer(serializers.Serializer):
    """Serializer for check-out action"""
    location = serializers.CharField(max_length=200, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class AttendanceStatsSerializer(serializers.Serializer):
    """Serializer for attendance statistics"""
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    wfh_days = serializers.IntegerField()
    half_days = serializers.IntegerField()
    total_hours = serializers.DecimalField(max_digits=6, decimal_places=2)
    average_hours_per_day = serializers.DecimalField(max_digits=4, decimal_places=2)
    attendance_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class AttendanceSettingsSerializer(serializers.ModelSerializer):
    """Serializer for attendance settings"""
    class Meta:
        model = AttendanceSettings
        fields = [
            'id', 'work_start_time', 'work_end_time', 'late_threshold_minutes',
            'require_checkout', 'allow_remote_checkin', 'send_reminder_notifications',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
