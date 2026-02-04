from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from .models import Task, TaskFile, TaskComment
from .serializers import (
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateUpdateSerializer,
    TaskAssignSerializer,
    TaskStatusChangeSerializer,
    TaskFileSerializer,
    TaskCommentSerializer
)
from accounts.permissions import IsManagerOrAdmin, IsOwnerOrManagerOrAdmin


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD operations

    PRIVACY RULE: Freelancers only see tasks assigned to them
    Managers and Admins see all tasks
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'topic', 'status', 'priority', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority', 'price']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        PRIVACY RULE IMPLEMENTATION:
        - Freelancers: only see their assigned tasks
        - Staff: see all tasks (read-mostly)
        - Team Lead: see all tasks (can assign & review)
        - Manager & Admin: see all tasks (full access)
        """
        user = self.request.user

        if user.role == 'freelancer':
            # Freelancer only sees tasks assigned to them
            return Task.objects.filter(assigned_to=user)
        elif user.role in ['staff', 'team_lead', 'manager', 'admin'] or user.is_superuser:
            # Staff, Team Lead, Manager and Admin see all tasks
            return Task.objects.all()
        else:
            # Default: no tasks
            return Task.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TaskCreateUpdateSerializer
        return TaskDetailSerializer

    def get_permissions(self):
        """
        Manager/Admin can create, update, delete
        Freelancer can only view and update status of their tasks
        """
        if self.action in ['create', 'destroy']:
            return [IsManagerOrAdmin()]
        elif self.action in ['update', 'partial_update']:
            # Manager/Admin can update any task
            # Freelancer can update their own task (limited fields)
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        """
        Freelancers can only update status and add comments
        Managers/Admins can update all fields
        """
        user = self.request.user

        if user.role == 'freelancer':
            # Freelancers can only update specific fields
            allowed_fields = {'status'}
            update_data = {
                key: value for key, value in serializer.validated_data.items()
                if key in allowed_fields
            }
            serializer.save(**update_data)
        else:
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def assign(self, request, pk=None):
        """Assign task to a freelancer"""
        task = self.get_object()
        serializer = TaskAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from accounts.models import User
        freelancer = User.objects.get(id=serializer.validated_data['assigned_to'])

        task.assigned_to = freelancer
        task.status = 'assigned'
        task.save()

        # TODO: Create notification for freelancer

        return Response({
            'message': f'Task assigned to {freelancer.username} successfully',
            'task': TaskDetailSerializer(task, context={'request': request}).data
        })

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Change task status"""
        task = self.get_object()
        serializer = TaskStatusChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = task.status
        new_status = serializer.validated_data['status']
        comment_text = serializer.validated_data.get('comment', '')

        # Update task status
        task.status = new_status

        # Auto-set timestamps
        if new_status == 'working' and not task.started_at:
            task.started_at = timezone.now()
        elif new_status == 'completed' and not task.completed_at:
            task.completed_at = timezone.now()

        task.save()

        # Add comment if provided
        if comment_text:
            TaskComment.objects.create(
                task=task,
                user=request.user,
                comment=f"Status changed from {old_status} to {new_status}: {comment_text}"
            )

        # TODO: Create notification

        return Response({
            'message': f'Task status changed from {old_status} to {new_status}',
            'task': TaskDetailSerializer(task, context={'request': request}).data
        })


class TaskFileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TaskFile operations
    Users can only access files for tasks they have access to
    """
    queryset = TaskFile.objects.all()
    serializer_class = TaskFileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['task', 'file_type', 'uploaded_by']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        """Filter files based on task access"""
        user = self.request.user

        if user.role == 'freelancer':
            # Freelancer only sees files for their tasks
            return TaskFile.objects.filter(task__assigned_to=user)
        elif user.role in ['manager', 'admin'] or user.is_superuser:
            return TaskFile.objects.all()
        return TaskFile.objects.none()

    def perform_destroy(self, instance):
        """Only uploader or admin can delete files"""
        user = self.request.user
        if user == instance.uploaded_by or user.role == 'admin' or user.is_superuser:
            instance.delete()
        else:
            raise serializers.ValidationError("You can only delete your own files.")


class TaskCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TaskComment operations
    Users can only access comments for tasks they have access to
    """
    queryset = TaskComment.objects.all()
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['task', 'user', 'parent']
    ordering = ['created_at']

    def get_queryset(self):
        """Filter comments based on task access"""
        user = self.request.user

        if user.role == 'freelancer':
            # Freelancer only sees comments for their tasks
            return TaskComment.objects.filter(task__assigned_to=user)
        elif user.role in ['manager', 'admin'] or user.is_superuser:
            return TaskComment.objects.all()
        return TaskComment.objects.none()

    def perform_create(self, serializer):
        """Set user to current user"""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Only comment owner can update"""
        if self.request.user != serializer.instance.user:
            raise serializers.ValidationError("You can only edit your own comments.")
        serializer.save()

    def perform_destroy(self, instance):
        """Only comment owner or admin can delete"""
        user = self.request.user
        if user == instance.user or user.role == 'admin' or user.is_superuser:
            instance.delete()
        else:
            raise serializers.ValidationError("You can only delete your own comments.")
