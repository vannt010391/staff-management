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
