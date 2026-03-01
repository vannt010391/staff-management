from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime

from .models import Department, CareerPath, Employee, KPI, Evaluation, SalaryReview, PersonalReport, Plan, PlanGoal, PlanNote
from .serializers import (
    DepartmentSerializer, CareerPathSerializer,
    EmployeeSerializer, EmployeeListSerializer,
    KPISerializer, EvaluationSerializer, EvaluationListSerializer,
    SalaryReviewSerializer, SalaryReviewListSerializer,
    PersonalReportSerializer, PersonalReportListSerializer,
    PlanSerializer, PlanListSerializer, PlanGoalSerializer, PlanNoteSerializer
)
from .permissions import (
    IsAdminOrManager, IsAdminOrManagerOrSelf, CanManageHR,
    CanApproveSalaryReview, CanReviewReport
)


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
    filterset_fields = ['user', 'plan_type', 'status', 'period_start']
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

    def perform_create(self, serializer):
        """Auto-set user based on logged-in user"""
        serializer.save(user=self.request.user)

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
