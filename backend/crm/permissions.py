from rest_framework import permissions


class CanManageCRM(permissions.BasePermission):
    """
    Permission for CRM management.
    - GET: All authenticated users
    - POST/PUT/PATCH/DELETE: Only admin/manager
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # GET requests allowed for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # Modify operations: only admin or manager
        return (
            request.user.role in ['admin', 'manager'] or
            request.user.is_superuser
        )

    def has_object_permission(self, request, view, obj):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # GET requests allowed for all
        if request.method in permissions.SAFE_METHODS:
            return True

        # Modify operations: only admin or manager
        return (
            request.user.role in ['admin', 'manager'] or
            request.user.is_superuser
        )


class CanApproveExpense(permissions.BasePermission):
    """
    Permission for expense approval.
    - GET: All authenticated users
    - POST (create): Admin/Manager
    - Approve/Reject actions: Only admin/manager
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # GET requests allowed for all
        if request.method in permissions.SAFE_METHODS:
            return True

        # Approve/reject actions
        if view.action in ['approve', 'reject']:
            return (
                request.user.role in ['admin', 'manager'] or
                request.user.is_superuser
            )

        # Create/Update: Admin/Manager or creator
        return (
            request.user.role in ['admin', 'manager'] or
            request.user.is_superuser
        )


class IsAdminOrManagerOrAssigned(permissions.BasePermission):
    """
    Permission for viewing customers.
    - Admin/Manager: see all customers
    - Others: see only assigned customers
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # Admin/Manager can see all
        if request.user.role in ['admin', 'manager'] or request.user.is_superuser:
            return True

        # Check if user is assigned to this customer
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == request.user

        # Check if it's an interaction/expense - check customer assignment
        if hasattr(obj, 'customer'):
            return obj.customer.assigned_to == request.user

        return False
