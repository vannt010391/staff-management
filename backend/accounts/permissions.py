from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permission class: Only allow admin users
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_superuser)
        )


class IsManagerOrAdmin(permissions.BasePermission):
    """
    Permission class: Allow manager and admin users
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'manager'] or
            request.user.is_superuser
        )


class IsFreelancer(permissions.BasePermission):
    """
    Permission class: Only allow freelancer users
    """

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'freelancer'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission class: Allow object owner or admin to access
    """

    def has_object_permission(self, request, view, obj):
        # Admin can access everything
        if request.user.role == 'admin' or request.user.is_superuser:
            return True

        # Check if obj has 'user' attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user

        # Check if obj is the user itself
        if hasattr(obj, 'id') and isinstance(obj, request.user.__class__):
            return obj.id == request.user.id

        return False


class IsOwnerOrManagerOrAdmin(permissions.BasePermission):
    """
    Permission class: Allow object owner, manager, or admin to access
    """

    def has_object_permission(self, request, view, obj):
        # Admin and Manager can access
        if request.user.role in ['admin', 'manager'] or request.user.is_superuser:
            return True

        # Check if obj has 'user' attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user

        # Check if obj has 'assigned_to' attribute (for tasks)
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == request.user

        return False


class CanCreateTask(permissions.BasePermission):
    """
    Permission: Admin, Manager, Team Lead, Staff can create tasks
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'manager', 'team_lead', 'staff'] or
            request.user.is_superuser
        )


class CanAssignTask(permissions.BasePermission):
    """
    Permission: Admin, Manager, Team Lead, Staff can assign tasks
    Staff can only assign to Freelancers (enforced in view logic)
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'manager', 'team_lead', 'staff'] or
            request.user.is_superuser
        )


class CanReviewTask(permissions.BasePermission):
    """
    Permission: Admin, Manager, Team Lead, Staff can review tasks
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'manager', 'team_lead', 'staff'] or
            request.user.is_superuser
        )


class CanDeleteTask(permissions.BasePermission):
    """
    Permission: Only Admin can delete tasks
    """
    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_superuser)
        )


class CanManageProjects(permissions.BasePermission):
    """
    Permission: Admin and Manager can manage projects
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'manager'] or
            request.user.is_superuser
        )


class CanDeleteUsers(permissions.BasePermission):
    """
    Permission: Only Admin can delete users
    """
    def has_permission(self, request, view):
        if request.method != 'DELETE':
            return True
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_superuser)
        )
