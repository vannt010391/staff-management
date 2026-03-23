from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime

from .models import (
    Department, CareerPath, Employee, KPI, Evaluation, SalaryReview,
    PersonalReport, Plan, PlanGoal, PlanNote, PlanDailyProgress,
    PlanUpdateHistory, Attendance, AttendanceSettings,
    LeaveType, LeaveBalance, LeaveRequest
)
from .serializers import (
    DepartmentSerializer, CareerPathSerializer,
    EmployeeSerializer, EmployeeListSerializer,
    KPISerializer, EvaluationSerializer, EvaluationListSerializer,
    SalaryReviewSerializer, SalaryReviewListSerializer,
    PersonalReportSerializer, PersonalReportListSerializer,
    PlanSerializer, PlanListSerializer, PlanGoalSerializer, PlanNoteSerializer,
    PlanDailyProgressSerializer, PlanUpdateHistorySerializer,
    AttendanceSerializer, AttendanceListSerializer, AttendanceCheckInSerializer,
    AttendanceCheckOutSerializer, AttendanceStatsSerializer, AttendanceSettingsSerializer,
    LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer, LeaveRequestCreateSerializer
)
from .permissions import (
    IsAdminOrManager, IsAdminOrManagerOrSelf, CanManageHR,
    CanApproveSalaryReview, CanReviewReport, CanManageTeamAttendance,
    CanManageLeaveRequests
)
from .services import build_daily_progress_snapshot


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Department management
    Only Admin and Manager can manage departments
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [CanManageHR]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class CareerPathViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Career Path management
    Only Admin and Manager can manage career paths
    """
    queryset = CareerPath.objects.all()
    serializer_class = CareerPathSerializer
    permission_classes = [CanManageHR]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['min_years_experience', 'min_salary']
    ordering = ['min_years_experience']


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Employee management
    Admin/Manager: see all employees
    Employees: see only their own profile
    """
    queryset = Employee.objects.all()
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'career_level', 'is_active', 'contract_type']
    search_fields = ['employee_id', 'user__username', 'user__first_name', 'user__last_name', 'position']
    ordering_fields = ['join_date', 'current_salary', 'employee_id']
    ordering = ['-join_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeSerializer

    def get_queryset(self):
        """
        Admin/Manager: see all employees
        Others: see only themselves
        """
        user = self.request.user
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return Employee.objects.all()
        else:
            # Return only the employee's own profile
            return Employee.objects.filter(user=user)

    @action(detail=True, methods=['get'])
    def kpis(self, request, pk=None):
        """Get all KPIs for an employee"""
        employee = self.get_object()
        kpis = employee.kpis.all()
        serializer = KPISerializer(kpis, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def evaluations(self, request, pk=None):
        """Get all evaluations for an employee"""
        employee = self.get_object()
        evaluations = employee.evaluations.all()
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def salary_history(self, request, pk=None):
        """Get salary review history for an employee"""
        employee = self.get_object()
        reviews = employee.salary_reviews.all()
        serializer = SalaryReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def reports(self, request, pk=None):
        """Get all personal reports for an employee"""
        employee = self.get_object()
        reports = employee.reports.all()
        serializer = PersonalReportSerializer(reports, many=True)
        return Response(serializer.data)


class KPIViewSet(viewsets.ModelViewSet):
    """
    ViewSet for KPI management
    Admin/Manager: manage all KPIs
    Employees: view only their own KPIs
    """
    queryset = KPI.objects.all()
    serializer_class = KPISerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'month']
    ordering_fields = ['month', 'overall_score']
    ordering = ['-month']

    def get_queryset(self):
        """
        Admin/Manager: see all KPIs
        Others: see only their own KPIs
        """
        user = self.request.user
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return KPI.objects.all()
        else:
            # Return only the employee's own KPIs
            try:
                employee = user.employee_profile
                return KPI.objects.filter(employee=employee)
            except Employee.DoesNotExist:
                return KPI.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def monthly_stats(self, request):
        """Get KPI statistics for a specific month"""
        month = request.query_params.get('month')
        if not month:
            return Response({'error': 'Month parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            month_date = datetime.strptime(month, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid month format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        kpis = KPI.objects.filter(month=month_date)
        if request.user.role not in ['admin', 'manager'] and not request.user.is_superuser:
            try:
                employee = request.user.employee_profile
                kpis = kpis.filter(employee=employee)
            except Employee.DoesNotExist:
                return Response([])

        serializer = self.get_serializer(kpis, many=True)
        return Response(serializer.data)


class EvaluationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Evaluation management
    Admin/Manager: manage all evaluations
    Employees: view only their own evaluations and can acknowledge them
    """
    queryset = Evaluation.objects.all()
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'period_type', 'overall_rating', 'employee_acknowledged']
    ordering_fields = ['period_end', 'overall_rating']
    ordering = ['-period_end']

    def get_serializer_class(self):
        if self.action == 'list':
            return EvaluationListSerializer
        return EvaluationSerializer

    def get_queryset(self):
        """
        Admin/Manager: see all evaluations
        Others: see only their own evaluations
        """
        user = self.request.user
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return Evaluation.objects.all()
        else:
            try:
                employee = user.employee_profile
                return Evaluation.objects.filter(employee=employee)
            except Employee.DoesNotExist:
                return Evaluation.objects.none()

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Employee acknowledges their evaluation"""
        evaluation = self.get_object()

        # Check if the employee is acknowledging their own evaluation
        try:
            employee = request.user.employee_profile
            if evaluation.employee != employee:
                return Response(
                    {'error': 'You can only acknowledge your own evaluation'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Only employees can acknowledge evaluations'},
                status=status.HTTP_403_FORBIDDEN
            )

        evaluation.employee_acknowledged = True
        evaluation.employee_acknowledged_at = timezone.now()
        evaluation.employee_comments = request.data.get('comments', '')
        evaluation.save()

        serializer = self.get_serializer(evaluation)
        return Response(serializer.data)


class SalaryReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Salary Review management
    Admin/Manager: create and view salary reviews
    Admin: approve/reject salary reviews
    Employees: view only their own salary reviews
    """
    queryset = SalaryReview.objects.all()
    permission_classes = [CanApproveSalaryReview]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'status']
    ordering_fields = ['created_at', 'effective_date', 'increase_percentage']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return SalaryReviewListSerializer
        return SalaryReviewSerializer

    def get_queryset(self):
        """
        Admin/Manager: see all salary reviews
        Others: see only their own salary reviews
        """
        user = self.request.user
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return SalaryReview.objects.all()
        else:
            try:
                employee = user.employee_profile
                return SalaryReview.objects.filter(employee=employee)
            except Employee.DoesNotExist:
                return SalaryReview.objects.none()

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Admin approves a salary review"""
        salary_review = self.get_object()

        if salary_review.status != 'pending':
            return Response(
                {'error': 'Only pending salary reviews can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        salary_review.status = 'approved'
        salary_review.reviewed_by = request.user
        salary_review.reviewed_at = timezone.now()
        salary_review.review_comments = request.data.get('comments', '')
        salary_review.save()

        serializer = self.get_serializer(salary_review)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Admin rejects a salary review"""
        salary_review = self.get_object()

        if salary_review.status != 'pending':
            return Response(
                {'error': 'Only pending salary reviews can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        salary_review.status = 'rejected'
        salary_review.reviewed_by = request.user
        salary_review.reviewed_at = timezone.now()
        salary_review.review_comments = request.data.get('comments', '')
        salary_review.save()

        serializer = self.get_serializer(salary_review)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def implement(self, request, pk=None):
        """Admin marks salary review as implemented and updates employee salary"""
        salary_review = self.get_object()

        if salary_review.status != 'approved':
            return Response(
                {'error': 'Only approved salary reviews can be implemented'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update employee salary
        employee = salary_review.employee
        employee.current_salary = salary_review.proposed_salary
        employee.last_salary_review = timezone.now().date()
        employee.save()

        # Update salary review status
        salary_review.status = 'implemented'
        salary_review.save()

        serializer = self.get_serializer(salary_review)
        return Response(serializer.data)


class PersonalReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Personal Report management
    Employees: create and view their own reports
    Managers: review reports of their team members
    Admin: view and review all reports
    """
    queryset = PersonalReport.objects.all()
    permission_classes = [CanReviewReport]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['employee', 'report_type', 'period_start']
    ordering_fields = ['period_end', 'created_at']
    ordering = ['-period_end']

    def get_serializer_class(self):
        if self.action == 'list':
            return PersonalReportListSerializer
        return PersonalReportSerializer

    def get_queryset(self):
        """
        Admin: see all reports
        Manager: see reports in their department
        Employees: see only their own reports
        """
        user = self.request.user

        if user.role == 'admin' or user.is_superuser:
            return PersonalReport.objects.all()
        elif user.role == 'manager':
            # Manager sees reports in their department
            managed_depts = Department.objects.filter(manager=user)
            return PersonalReport.objects.filter(employee__department__in=managed_depts)
        else:
            # Employee sees only their own reports
            try:
                employee = user.employee_profile
                return PersonalReport.objects.filter(employee=employee)
            except Employee.DoesNotExist:
                return PersonalReport.objects.none()

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Manager reviews a personal report"""
        report = self.get_object()

        # Check if the user has permission to review
        if request.user.role not in ['admin', 'manager'] and not request.user.is_superuser:
            return Response(
                {'error': 'Only managers can review reports'},
                status=status.HTTP_403_FORBIDDEN
            )

        report.manager_feedback = request.data.get('feedback', '')
        report.manager_reviewed_by = request.user
        report.manager_reviewed_at = timezone.now()
        report.save()

        serializer = self.get_serializer(report)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """Get current user's own reports"""
        try:
            employee = request.user.employee_profile
            reports = PersonalReport.objects.filter(employee=employee)
            serializer = self.get_serializer(reports, many=True)
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class PlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing plans (daily/weekly/monthly/yearly)

    Permissions:
    - Admin: see all plans
    - Manager/Team Leader: see their own plans + plans of employees in departments they manage
    - Staff/Freelancer: see only their own plans
    """
    queryset = Plan.objects.all()
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'plan_type', 'status', 'period_start', 'user__employee_profile__department']
    search_fields = ['title', 'description', 'user__username']
    ordering_fields = ['period_start', 'created_at', 'completion_percentage']
    ordering = ['-period_start']

    def get_serializer_class(self):
        if self.action == 'list':
            return PlanListSerializer
        return PlanSerializer

    def get_queryset(self):
        """
        Filter based on user role:
        - Admin: see all plans
        - Manager/Team Leader: see their own plans + their staff's plans (employees in departments they manage)
        - Others: see only their own plans
        """
        user = self.request.user

        # Admin sees all plans
        if user.role == 'admin' or user.is_superuser:
            return Plan.objects.all()

        # Manager/Team Leader sees their own plans + their staff's plans
        if user.role in ['manager', 'team_lead']:
            # Get departments managed by this user
            managed_departments = user.managed_departments.all()

            if managed_departments.exists():
                from hr.models import Employee
                # Get all employees in managed departments
                staff_users = Employee.objects.filter(
                    department__in=managed_departments,
                    is_active=True
                ).values_list('user_id', flat=True)

                # Return plans for self + staff
                return Plan.objects.filter(user__in=list(staff_users) + [user.id])
            else:
                # Manager/Team Leader with no departments: see only own plans
                return Plan.objects.filter(user=user)

        # All other users see only their own plans
        return Plan.objects.filter(user=user)

    def _get_assignable_user_queryset(self):
        """Users that request.user can create/assign plans for."""
        user = self.request.user
        User = get_user_model()

        if user.role == 'admin' or user.is_superuser:
            return User.objects.filter(is_active=True)

        if user.role in ['manager', 'team_lead']:
            managed_departments = user.managed_departments.all()
            if managed_departments.exists():
                staff_user_ids = Employee.objects.filter(
                    department__in=managed_departments,
                    is_active=True
                ).values_list('user_id', flat=True)
                return User.objects.filter(id__in=list(staff_user_ids) + [user.id], is_active=True)

            return User.objects.filter(id=user.id, is_active=True)

        return User.objects.filter(id=user.id, is_active=True)

    def _resolve_target_user(self, serializer, fallback_user):
        requested_user = serializer.validated_data.get('user')
        if requested_user is None:
            return fallback_user

        assignable_user_ids = set(self._get_assignable_user_queryset().values_list('id', flat=True))
        if requested_user.id not in assignable_user_ids:
            return None

        return requested_user

    def perform_create(self, serializer):
        """Create plan for self or allowed target user and create history entry"""
        target_user = self._resolve_target_user(serializer, self.request.user)
        if target_user is None:
            raise serializers.ValidationError({'user': 'You do not have permission to create plan for this user.'})

        plan = serializer.save(user=target_user)
        # Create history entry
        PlanUpdateHistory.objects.create(
            plan=plan,
            action='created',
            changed_by=self.request.user,
            current_values={'title': plan.title, 'plan_type': plan.plan_type, 'status': plan.status},
            change_description=f'Plan created for {target_user.username}: {plan.title}'
        )

    def perform_update(self, serializer):
        """Track changes in history"""
        plan = serializer.instance
        previous_owner_username = plan.user.username
        target_user = self._resolve_target_user(serializer, plan.user)
        if target_user is None:
            raise serializers.ValidationError({'user': 'You do not have permission to assign this user.'})

        # Capture previous values
        previous = {
            'status': plan.status,
            'completion_percentage': plan.completion_percentage,
            'title': plan.title,
            'description': plan.description,
            'user_id': plan.user_id,
        }

        # Save updates
        updated_plan = serializer.save(user=target_user)

        # Check what changed
        changes = []
        if previous['status'] != updated_plan.status:
            changes.append(f"Status: {previous['status']} → {updated_plan.status}")
        if previous['completion_percentage'] != updated_plan.completion_percentage:
            changes.append(f"Progress: {previous['completion_percentage']}% → {updated_plan.completion_percentage}%")
        if previous['title'] != updated_plan.title:
            changes.append(f"Title: {previous['title']} → {updated_plan.title}")
        if previous['description'] != updated_plan.description:
            changes.append('Description updated')
        if previous['user_id'] != updated_plan.user_id:
            changes.append(f"Owner: {previous_owner_username} → {updated_plan.user.username}")

        if changes:
            PlanUpdateHistory.objects.create(
                plan=updated_plan,
                action='status_changed' if previous['status'] != updated_plan.status else 'updated',
                changed_by=self.request.user,
                previous_values=previous,
                current_values={
                    'status': updated_plan.status,
                    'completion_percentage': updated_plan.completion_percentage,
                    'title': updated_plan.title,
                    'description': updated_plan.description,
                    'user_id': updated_plan.user_id,
                },
                change_description='; '.join(changes)
            )

    @action(detail=False, methods=['get'])
    def assignable_users(self, request):
        """Users that current user can assign plans to."""
        users = self._get_assignable_user_queryset().order_by('first_name', 'last_name', 'username')
        data = []

        employee_map = {
            employee.user_id: employee
            for employee in Employee.objects.filter(user_id__in=users.values_list('id', flat=True)).select_related('department')
        }

        for user in users:
            employee = employee_map.get(user.id)
            full_name = user.get_full_name() or user.username
            data.append({
                'id': user.id,
                'username': user.username,
                'full_name': full_name,
                'role': user.role,
                'department_name': employee.department.name if employee and employee.department else None,
            })

        return Response(data)

    @action(detail=True, methods=['post'])
    def add_goal(self, request, pk=None):
        """Add a goal to this plan"""
        plan = self.get_object()
        serializer = PlanGoalSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(plan=plan)
            plan.auto_calculate_completion()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Add a reflective note to this plan"""
        plan = self.get_object()
        serializer = PlanNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(plan=plan, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Manager adds review feedback"""
        plan = self.get_object()

        # Check if user is admin or manager
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'error': 'Only managers can review plans'},
                status=status.HTTP_403_FORBIDDEN
            )

        feedback = request.data.get('manager_feedback', '')
        plan.manager_feedback = feedback
        plan.reviewed_by = request.user
        plan.reviewed_at = timezone.now()
        plan.save()

        return Response(PlanSerializer(plan).data)

    @action(detail=False, methods=['get'])
    def my_plans(self, request):
        """
        Get plans based on user role:
        - Admin: all plans
        - Manager/Team Leader: own plans + staff plans (employees in managed departments)
        - Others: only own plans
        """
        user = request.user

        # Use the same logic as get_queryset
        if user.role == 'admin' or user.is_superuser:
            plans = Plan.objects.all()
        elif user.role in ['manager', 'team_lead']:
            managed_departments = user.managed_departments.all()
            if managed_departments.exists():
                from hr.models import Employee
                staff_users = Employee.objects.filter(
                    department__in=managed_departments,
                    is_active=True
                ).values_list('user_id', flat=True)
                plans = Plan.objects.filter(user__in=list(staff_users) + [user.id])
            else:
                plans = Plan.objects.filter(user=user)
        else:
            plans = Plan.objects.filter(user=user)

        # Optional filter by plan_type
        plan_type = request.query_params.get('plan_type')
        if plan_type:
            plans = plans.filter(plan_type=plan_type)

        serializer = PlanListSerializer(plans, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active_plans(self, request):
        """Get plans in active status"""
        plans = self.get_queryset().filter(status='active')
        serializer = PlanListSerializer(plans, many=True)
        return Response(serializer.data)


class PlanGoalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing plan goals
    """
    queryset = PlanGoal.objects.all()
    serializer_class = PlanGoalSerializer
    permission_classes = [IsAdminOrManagerOrSelf]

    def get_queryset(self):
        """Filter goals based on accessible plans"""
        user = self.request.user

        if user.role == 'admin' or user.is_superuser:
            return PlanGoal.objects.all()

        # All users can access goals from their own plans
        return PlanGoal.objects.filter(plan__user=user)

    @action(detail=True, methods=['post'])
    def toggle_complete(self, request, pk=None):
        """Toggle goal completion status"""
        goal = self.get_object()

        if goal.is_completed:
            goal.is_completed = False
            goal.completed_at = None
        else:
            goal.mark_completed()

        goal.save()
        return Response(PlanGoalSerializer(goal).data)


class PlanNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing plan notes
    """
    queryset = PlanNote.objects.all()
    serializer_class = PlanNoteSerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'created_by']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter notes based on accessible plans"""
        user = self.request.user

        if user.role == 'admin' or user.is_superuser:
            return PlanNote.objects.all()

        # All users can access notes from their own plans
        return PlanNote.objects.filter(plan__user=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PlanDailyProgressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing daily progress entries
    """
    queryset = PlanDailyProgress.objects.all()
    serializer_class = PlanDailyProgressSerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'date']
    ordering_fields = ['date']
    ordering = ['-date']

    def get_queryset(self):
        """Filter based on plan access permissions"""
        user = self.request.user
        if user.role == 'admin' or user.is_superuser:
            return PlanDailyProgress.objects.all()
        # Users can only see progress for plans they have access to
        accessible_plans = Plan.objects.filter(user=user)
        return PlanDailyProgress.objects.filter(plan__in=accessible_plans)

    @action(detail=False, methods=['post'])
    def log_today(self, request):
        """Quick endpoint to log today's progress"""
        plan_id = request.data.get('plan')
        today = timezone.now().date()

        if not plan_id:
            return Response({'error': 'plan is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get the Plan object (not PlanDailyProgress) with permission check
        user = request.user
        if user.role == 'admin' or user.is_superuser:
            plan = Plan.objects.filter(id=plan_id).first()
        else:
            plan = Plan.objects.filter(id=plan_id, user=user).first()

        if not plan:
            return Response({'error': 'Plan not found or access denied'}, status=status.HTTP_404_NOT_FOUND)

        manual_inputs = {
            'hours_worked': request.data.get('hours_worked', 0),
            'blockers': request.data.get('blockers', ''),
            'next_plan': request.data.get('next_plan', ''),
            'work_results': request.data.get('work_results', ''),
        }
        snapshot = build_daily_progress_snapshot(plan, today, manual_inputs=manual_inputs)

        progress, created = PlanDailyProgress.objects.get_or_create(
            plan_id=plan_id,
            date=today,
            defaults={
                'completed_goals_count': snapshot['completed_goals_count'],
                'hours_worked': snapshot['hours_worked'],
                'progress_notes': snapshot['progress_notes'],
                'work_results': snapshot['work_results'],
                'blockers': snapshot['blockers'],
                'next_plan': snapshot['next_plan'],
                'completion_percentage_snapshot': snapshot['completion_percentage_snapshot']
            }
        )

        if not created:
            progress.completed_goals_count = snapshot['completed_goals_count']
            progress.hours_worked = snapshot['hours_worked']
            progress.progress_notes = snapshot['progress_notes']
            progress.work_results = snapshot['work_results']
            progress.blockers = snapshot['blockers']
            progress.next_plan = snapshot['next_plan']
            progress.completion_percentage_snapshot = snapshot['completion_percentage_snapshot']
            progress.save()

        serializer = self.get_serializer(progress)
        return Response(serializer.data)


class PlanUpdateHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing plan update history (read-only)
    """
    queryset = PlanUpdateHistory.objects.all()
    serializer_class = PlanUpdateHistorySerializer
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['plan', 'action', 'changed_by']
    ordering_fields = ['changed_at']
    ordering = ['-changed_at']

    def get_queryset(self):
        """Filter based on plan access permissions"""
        user = self.request.user
        if user.role == 'admin' or user.is_superuser:
            return PlanUpdateHistory.objects.all()
        accessible_plans = Plan.objects.filter(user=user)
        return PlanUpdateHistory.objects.filter(plan__in=accessible_plans)


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Attendance management
    Users can manage their own attendance
    Admin/Manager can view all attendances
    """
    queryset = Attendance.objects.all()
    permission_classes = [IsAdminOrManagerOrSelf]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'date', 'status']
    ordering_fields = ['date', 'check_in_time']
    ordering = ['-date', '-check_in_time']

    def get_client_ip(self, request):
        """Get real client IP address from request headers"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def get_serializer_class(self):
        if self.action == 'list':
            return AttendanceListSerializer
        return AttendanceSerializer

    def get_queryset(self):
        """
        Admin/Manager: see all attendances
        Others: see only their own attendance
        """
        user = self.request.user
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return Attendance.objects.all()
        return Attendance.objects.filter(user=user)

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """
        Check in for today
        Creates or updates attendance record for current user
        """
        user = request.user
        today = timezone.now().date()

        # Check if already checked in today
        attendance = Attendance.objects.filter(user=user, date=today).first()

        if attendance and attendance.has_checked_in:
            return Response(
                {'error': 'You have already checked in today', 'attendance': AttendanceSerializer(attendance).data},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AttendanceCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get client IP
        client_ip = self.get_client_ip(request)

        # Prepare check-in data with metadata
        check_in_data = {
            'check_in_time': timezone.now(),
            'check_in_location': serializer.validated_data.get('location', ''),
            'check_in_ip': client_ip,
            'check_in_latitude': serializer.validated_data.get('latitude'),
            'check_in_longitude': serializer.validated_data.get('longitude'),
            'check_in_accuracy': serializer.validated_data.get('accuracy'),
            'check_in_address': serializer.validated_data.get('address', ''),
            'check_in_device_type': serializer.validated_data.get('device_type', ''),
            'check_in_device_os': serializer.validated_data.get('device_os', ''),
            'check_in_device_browser': serializer.validated_data.get('device_browser', ''),
            'check_in_user_agent': serializer.validated_data.get('user_agent', ''),
            'status': serializer.validated_data.get('status', 'present'),
            'notes': serializer.validated_data.get('notes', '')
        }

        # Create or update attendance
        if not attendance:
            attendance = Attendance.objects.create(
                user=user,
                date=today,
                **check_in_data
            )
        else:
            for key, value in check_in_data.items():
                setattr(attendance, key, value)
            attendance.save()

        return Response(
            {
                'message': 'Checked in successfully',
                'attendance': AttendanceSerializer(attendance).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def check_out(self, request):
        """
        Check out for today
        Updates attendance record for current user
        """
        user = request.user
        today = timezone.now().date()

        # Get today's attendance
        attendance = Attendance.objects.filter(user=user, date=today).first()

        if not attendance or not attendance.has_checked_in:
            return Response(
                {'error': 'You must check in first before checking out'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if attendance.has_checked_out:
            return Response(
                {'error': 'You have already checked out today', 'attendance': AttendanceSerializer(attendance).data},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AttendanceCheckOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get client IP
        client_ip = self.get_client_ip(request)

        # Update check-out data with metadata
        attendance.check_out_time = timezone.now()
        attendance.check_out_location = serializer.validated_data.get('location', '')
        attendance.check_out_ip = client_ip
        attendance.check_out_latitude = serializer.validated_data.get('latitude')
        attendance.check_out_longitude = serializer.validated_data.get('longitude')
        attendance.check_out_accuracy = serializer.validated_data.get('accuracy')
        attendance.check_out_address = serializer.validated_data.get('address', '')
        attendance.check_out_device_type = serializer.validated_data.get('device_type', '')
        attendance.check_out_device_os = serializer.validated_data.get('device_os', '')
        attendance.check_out_device_browser = serializer.validated_data.get('device_browser', '')
        attendance.check_out_user_agent = serializer.validated_data.get('user_agent', '')
        if serializer.validated_data.get('notes'):
            attendance.notes += '\n' + serializer.validated_data.get('notes', '')
        attendance.save()

        return Response(
            {
                'message': 'Checked out successfully',
                'attendance': AttendanceSerializer(attendance).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Get today's attendance status for current user
        """
        user = request.user
        today = timezone.now().date()

        attendance = Attendance.objects.filter(user=user, date=today).first()

        if not attendance:
            return Response({
                'has_checked_in': False,
                'has_checked_out': False,
                'attendance': None
            })

        return Response({
            'has_checked_in': attendance.has_checked_in,
            'has_checked_out': attendance.has_checked_out,
            'attendance': AttendanceSerializer(attendance).data
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get attendance statistics for a user within a date range
        Query params: user_id (optional, admin/manager only), start_date, end_date
        """
        user = request.user
        user_id = request.query_params.get('user_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        # Determine target user
        if user_id:
            if user.role not in ['admin', 'manager'] and not user.is_superuser:
                return Response(
                    {'error': 'You do not have permission to view other users\' attendance'},
                    status=status.HTTP_403_FORBIDDEN
                )
            target_user = get_user_model().objects.filter(id=user_id).first()
            if not target_user:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            target_user = user

        # Parse dates
        try:
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            else:
                # Default to current month
                start_date = timezone.now().date().replace(day=1)

            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            else:
                end_date = timezone.now().date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get attendances in date range
        attendances = Attendance.objects.filter(
            user=target_user,
            date__gte=start_date,
            date__lte=end_date
        )

        # Calculate statistics
        total_days = attendances.count()
        present_days = attendances.filter(status__in=['present', 'late']).count()
        absent_days = attendances.filter(status='absent').count()
        late_days = attendances.filter(is_late=True).count()
        wfh_days = attendances.filter(status='wfh').count()
        half_days = attendances.filter(status='half_day').count()

        # Calculate total hours
        total_hours = sum(
            [att.total_hours for att in attendances if att.total_hours],
            0
        )

        # Average hours per day (only counting days with hours logged)
        days_with_hours = attendances.filter(total_hours__isnull=False).count()
        average_hours = (total_hours / days_with_hours) if days_with_hours > 0 else 0

        # Attendance rate
        working_days = (end_date - start_date).days + 1
        attendance_rate = (present_days / working_days * 100) if working_days > 0 else 0

        stats = {
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'late_days': late_days,
            'wfh_days': wfh_days,
            'half_days': half_days,
            'total_hours': round(total_hours, 2),
            'average_hours_per_day': round(average_hours, 2),
            'attendance_rate': round(attendance_rate, 2)
        }

        serializer = AttendanceStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_history(self, request):
        """
        Get attendance history for current user
        Query params: start_date, end_date, limit
        """
        user = request.user
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        limit = request.query_params.get('limit', 30)

        queryset = Attendance.objects.filter(user=user)

        # Apply date filters
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                pass

        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                pass

        # Apply limit
        try:
            limit = int(limit)
            queryset = queryset[:limit]
        except (ValueError, TypeError):
            queryset = queryset[:30]

        serializer = AttendanceSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[CanManageTeamAttendance])
    def team_attendance(self, request):
        """
        Get team attendance (Admin/Manager/Team Lead only)
        Query params: user_id, department_id, start_date, end_date, status
        """
        user = request.user
        queryset = Attendance.objects.all()

        # Filter based on role
        if user.role == 'manager':
            # Manager sees department attendance
            try:
                managed_dept = Department.objects.filter(manager=user).first()
                if managed_dept:
                    employee_ids = managed_dept.employees.values_list('user_id', flat=True)
                    queryset = queryset.filter(user_id__in=employee_ids)
            except:
                pass
        elif user.role == 'team_lead':
            # Team Lead sees direct reports
            managed_employee_ids = Employee.objects.filter(manager=user).values_list('user_id', flat=True)
            queryset = queryset.filter(user_id__in=managed_employee_ids)
        # Admin sees all (no filter needed)

        # Apply additional filters
        user_id = request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start_date)
            except ValueError:
                pass

        end_date = request.query_params.get('end_date')
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end_date)
            except ValueError:
                pass

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Paginate
        queryset = queryset.order_by('-date', '-check_in_time')[:100]

        serializer = AttendanceSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[CanManageTeamAttendance])
    def monthly_report(self, request):
        """
        Get monthly attendance report
        Query params: user_id (required for non-admin), year, month
        """
        user = request.user
        user_id = request.query_params.get('user_id')
        year = request.query_params.get('year', timezone.now().year)
        month = request.query_params.get('month', timezone.now().month)

        try:
            year = int(year)
            month = int(month)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid year or month'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine target user
        if user_id:
            target_user = get_user_model().objects.filter(id=user_id).first()
            if not target_user:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        elif user.role in ['admin', 'manager', 'team_lead']:
            return Response({'error': 'user_id required for managers'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_user = user

        # Get month date range
        from calendar import monthrange
        start_date = datetime(year, month, 1).date()
        last_day = monthrange(year, month)[1]
        end_date = datetime(year, month, last_day).date()

        # Get attendances
        attendances = Attendance.objects.filter(
            user=target_user,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')

        # Calculate stats
        total_days = attendances.count()
        present_days = attendances.filter(status__in=['present', 'late']).count()
        late_days = attendances.filter(is_late=True).count()
        wfh_days = attendances.filter(status='wfh').count()
        total_hours = sum([att.total_hours for att in attendances if att.total_hours], 0)

        report = {
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'full_name': target_user.get_full_name() or target_user.username
            },
            'year': year,
            'month': month,
            'stats': {
                'total_days': total_days,
                'present_days': present_days,
                'late_days': late_days,
                'wfh_days': wfh_days,
                'total_hours': round(total_hours, 2)
            },
            'attendances': AttendanceSerializer(attendances, many=True).data
        }

        return Response(report)

    @action(detail=False, methods=['get'], permission_classes=[CanManageTeamAttendance])
    def export_attendance(self, request):
        """
        Export attendance to CSV
        Query params: start_date, end_date, user_id
        """
        import csv
        from django.http import HttpResponse

        user = request.user
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        user_id = request.query_params.get('user_id')

        queryset = Attendance.objects.all()

        # Apply role-based filtering (same as team_attendance)
        if user.role == 'manager':
            try:
                managed_dept = Department.objects.filter(manager=user).first()
                if managed_dept:
                    employee_ids = managed_dept.employees.values_list('user_id', flat=True)
                    queryset = queryset.filter(user_id__in=employee_ids)
            except:
                pass
        elif user.role == 'team_lead':
            managed_employee_ids = Employee.objects.filter(manager=user).values_list('user_id', flat=True)
            queryset = queryset.filter(user_id__in=managed_employee_ids)

        # Apply filters
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if start_date:
            try:
                queryset = queryset.filter(date__gte=datetime.strptime(start_date, '%Y-%m-%d').date())
            except ValueError:
                pass
        if end_date:
            try:
                queryset = queryset.filter(date__lte=datetime.strptime(end_date, '%Y-%m-%d').date())
            except ValueError:
                pass

        queryset = queryset.order_by('-date', '-check_in_time')

        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Date', 'User', 'Check In', 'Check Out', 'Total Hours', 'Status',
            'Check In IP', 'Check In Device', 'Check In Location',
            'Check Out IP', 'Check Out Device', 'Check Out Location'
        ])

        for att in queryset:
            writer.writerow([
                att.date.strftime('%Y-%m-%d'),
                att.user.get_full_name() or att.user.username,
                att.check_in_time.strftime('%H:%M:%S') if att.check_in_time else '',
                att.check_out_time.strftime('%H:%M:%S') if att.check_out_time else '',
                att.total_hours or '',
                att.get_status_display(),
                att.check_in_ip or '',
                f"{att.check_in_device_type} - {att.check_in_device_os}" if att.check_in_device_type else '',
                att.check_in_address or att.check_in_location or '',
                att.check_out_ip or '',
                f"{att.check_out_device_type} - {att.check_out_device_os}" if att.check_out_device_type else '',
                att.check_out_address or att.check_out_location or ''
            ])

        return response


class AttendanceSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Attendance Settings
    Only Admin can manage settings
    Everyone can view settings
    """
    queryset = AttendanceSettings.objects.all()
    serializer_class = AttendanceSettingsSerializer
    permission_classes = [IsAdminOrManagerOrSelf]

    def get_queryset(self):
        # Always return the single settings instance
        return AttendanceSettings.objects.all()

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current attendance settings"""
        settings = AttendanceSettings.get_settings()
        serializer = self.get_serializer(settings)
        return Response(serializer.data)


# ===== Leave Management ViewSets =====

class LeaveTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for LeaveType (Admin only)"""
    queryset = LeaveType.objects.filter(is_active=True)
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrManager]


class LeaveBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for LeaveBalance"""
    queryset = LeaveBalance.objects.all()
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAdminOrManagerOrSelf]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return LeaveBalance.objects.all()
        return LeaveBalance.objects.filter(user=user)

    @action(detail=False, methods=['get'])
    def my_balance(self, request):
        """Get current user's leave balance"""
        year = request.query_params.get('year', timezone.now().year)
        balances = LeaveBalance.objects.filter(user=request.user, year=year)
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for LeaveRequest"""
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [CanManageLeaveRequests]

    def get_queryset(self):
        user = self.request.user

        # Admin sees all
        if user.role == 'admin' or user.is_superuser:
            return LeaveRequest.objects.all()

        # Manager sees department requests
        if user.role == 'manager':
            try:
                managed_dept = Department.objects.filter(manager=user).first()
                if managed_dept:
                    employee_ids = managed_dept.employees.values_list('user_id', flat=True)
                    return LeaveRequest.objects.filter(user_id__in=employee_ids)
            except:
                pass

        # Team Lead sees direct reports
        if user.role == 'team_lead':
            managed_employee_ids = Employee.objects.filter(manager=user).values_list('user_id', flat=True)
            return LeaveRequest.objects.filter(user_id__in=managed_employee_ids)

        # User sees own requests
        return LeaveRequest.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get current user's leave requests"""
        requests = LeaveRequest.objects.filter(user=request.user)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Get pending requests for approval (manager/team lead)"""
        queryset = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def process_request(self, request, pk=None):
        """Approve or reject leave request"""
        leave_request = self.get_object()

        if leave_request.status != 'pending':
            return Response(
                {'error': 'Leave request already processed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        action_type = request.data.get('action')  # 'approve' or 'reject'
        rejection_reason = request.data.get('rejection_reason', '')

        if action_type == 'approve':
            leave_request.status = 'approved'
            leave_request.approver = request.user
            leave_request.approved_at = timezone.now()
            leave_request.save()  # This triggers attendance creation and balance update

            return Response({
                'message': 'Leave request approved',
                'leave_request': LeaveRequestSerializer(leave_request).data
            })

        elif action_type == 'reject':
            leave_request.status = 'rejected'
            leave_request.approver = request.user
            leave_request.approved_at = timezone.now()
            leave_request.rejection_reason = rejection_reason
            leave_request.save()

            return Response({
                'message': 'Leave request rejected',
                'leave_request': LeaveRequestSerializer(leave_request).data
            })

        return Response(
            {'error': 'Invalid action. Use "approve" or "reject"'},
            status=status.HTTP_400_BAD_REQUEST
        )
