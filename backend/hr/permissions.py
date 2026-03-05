from rest_framework import permissions


class IsAdminOrManager(permissions.BasePermission):
    """
    Permission: Only Admin and Manager can access HR features
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'manager'] or request.user.is_superuser)
        )


class IsAdminOrManagerOrSelf(permissions.BasePermission):
    """
    Permission: Admin/Manager can access all, employees can access their own data
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin and Manager can access everything
        if request.user.role in ['admin', 'manager'] or request.user.is_superuser:
            return True

        # Check if the object is related to the current user
        if hasattr(obj, 'employee'):
            # For models with 'employee' field (KPI, Evaluation, etc.)
            return obj.employee.user == request.user
        elif hasattr(obj, 'user'):
            # For Employee model
            return obj.user == request.user
        elif hasattr(obj, 'plan'):
            # For Plan children (PlanGoal, PlanNote)
            return obj.plan.user == request.user

        return False


class CanManageHR(permissions.BasePermission):
    """
    Permission: Only Admin and Manager can create/edit/delete HR data
    """
    def has_permission(self, request, view):
        # Allow GET requests for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Only Admin and Manager can create/edit/delete
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'manager'] or request.user.is_superuser)
        )


class CanApproveSalaryReview(permissions.BasePermission):
    """
    Permission: Only Admin can approve/reject salary reviews
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Only Admin can approve/reject
        if view.action in ['approve', 'reject']:
            return (
                request.user and
                request.user.is_authenticated and
                (request.user.role == 'admin' or request.user.is_superuser)
            )

        # Manager and Admin can create salary reviews
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'manager'] or request.user.is_superuser)
        )


class CanReviewReport(permissions.BasePermission):
    """
    Permission: Managers can review reports of their team members
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin can review all
        if request.user.role == 'admin' or request.user.is_superuser:
            return True

        # Manager can review reports in their department
        if request.user.role == 'manager':
            if hasattr(obj, 'employee') and obj.employee.department:
                return obj.employee.department.manager == request.user
            return True

        # Employee can only view their own reports
        if hasattr(obj, 'employee'):
            return obj.employee.user == request.user

        return False


class CanManageTeamAttendance(permissions.BasePermission):
    """
    Permission: Admin/Manager/Team Lead can view team attendance
    - Admin: can view all attendance
    - Manager: can view department attendance
    - Team Lead: can view direct reports attendance (based on manager field)
    - Employee: can view only their own attendance
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin can access all
        if request.user.role == 'admin' or request.user.is_superuser:
            return True

        # Manager can access department attendance
        if request.user.role == 'manager':
            try:
                employee = obj.user.employee_profile
                if employee.department:
                    return employee.department.manager == request.user
            except:
                pass
            return True  # If no employee profile, allow manager

        # Team Lead can access direct reports
        if request.user.role == 'team_lead':
            try:
                employee = obj.user.employee_profile
                return employee.manager == request.user
            except:
                pass

        # Employee can only access their own
        return obj.user == request.user


class CanManageLeaveRequests(permissions.BasePermission):
    """
    Permission: Admin/Manager/Team Lead can approve/reject leave requests
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Only admin/manager/team_lead can approve/reject
        if view.action in ['process_request']:
            return request.user.role in ['admin', 'manager', 'team_lead']

        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin can manage all
        if request.user.role == 'admin' or request.user.is_superuser:
            return True

        # Manager can manage department requests
        if request.user.role == 'manager':
            try:
                employee = obj.user.employee_profile
                if employee.department:
                    return employee.department.manager == request.user
            except:
                pass

        # Team Lead can manage direct reports
        if request.user.role == 'team_lead':
            try:
                employee = obj.user.employee_profile
                return employee.manager == request.user
            except:
                pass

        # User can view own requests
        return obj.user == request.user
