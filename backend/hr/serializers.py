from rest_framework import serializers
from .models import Department, CareerPath, Employee, KPI, Evaluation, SalaryReview, PersonalReport
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
        read_only_fields = ['created_at', 'updated_at', 'years_of_service']
        extra_kwargs = {
            'current_salary': {'write_only': False},  # Có thể được hiển thị tùy quyền
            'citizen_id': {'write_only': True},
            'address': {'write_only': True},
            'emergency_contact_name': {'write_only': True},
            'emergency_contact_phone': {'write_only': True},
        }


class EmployeeListSerializer(serializers.ModelSerializer):
    """Simplified serializer for list views - no sensitive data"""
    user_details = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    career_level_display = serializers.CharField(source='career_level.get_level_display', read_only=True)
    years_of_service = serializers.ReadOnlyField()

    class Meta:
        model = Employee
        fields = ['id', 'employee_id', 'user_details', 'department_name', 'position',
                  'career_level_display', 'join_date', 'years_of_service', 'is_active']

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
