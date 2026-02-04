from rest_framework import permissions


class CanAccessTask(permissions.BasePermission):
    """
    Permission to check if user can access a task
    - Managers and Admins can access all tasks
    - Freelancers can only access tasks assigned to them
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin and Manager can access all tasks
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return True

        # Freelancer can only access tasks assigned to them
        if user.role == 'freelancer':
            return obj.assigned_to == user

        return False


class CanModifyTask(permissions.BasePermission):
    """
    Permission to check if user can modify a task
    - Managers and Admins can modify all tasks
    - Freelancers can only update status of their assigned tasks
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin and Manager can modify all tasks
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return True

        # Freelancer can only update their own task's status
        if user.role == 'freelancer' and obj.assigned_to == user:
            # Check if only updating status
            if request.method in ['PUT', 'PATCH']:
                # Allow status updates only
                return True

        return False
