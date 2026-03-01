from rest_framework import viewsets, status
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Sum, DecimalField, Value
from django.db.models.functions import Coalesce

from .models import Task, TaskFile, TaskComment
from .serializers import (
    TaskListSerializer,
    TaskDetailSerializer,
    TaskCreateUpdateSerializer,
    TaskAssignSerializer,
    TaskReviewerAssignSerializer,
    TaskStatusChangeSerializer,
    TaskFileSerializer,
    TaskCommentSerializer
)
from accounts.permissions import IsManagerOrAdmin, IsOwnerOrManagerOrAdmin
from notifications.services import (
    create_task_assigned_notification,
    create_task_status_changed_notification,
    create_task_review_completed_notification,
)
from reviews.models import TaskReview, ReviewCriteria


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

    REVIEWER_ROLES = {'admin', 'manager', 'team_lead', 'staff'}
    FREELANCER_ALLOWED_STATUS_TRANSITIONS = {
        'assigned': {'working'},
        'working': {'review_pending'},
        'rejected': {'working'},
    }

    def _is_reviewer(self, user):
        return user.role in self.REVIEWER_ROLES or user.is_superuser

    def _validate_freelancer_status_change(self, task, new_status):
        allowed_next = self.FREELANCER_ALLOWED_STATUS_TRANSITIONS.get(task.status, set())
        if new_status not in allowed_next:
            raise serializers.ValidationError(
                f"Freelancers cannot change status from '{task.status}' to '{new_status}'."
            )

    def _review_task(self, task, reviewer, overall_status, comment='', criteria_data=None):
        if task.status != 'review_pending':
            raise serializers.ValidationError('Only tasks in review_pending status can be reviewed.')

        if not task.reviewer:
            raise serializers.ValidationError('Reviewer must be assigned before review decision.')

        if task.reviewer_id != reviewer.id:
            raise serializers.ValidationError('Only the assigned reviewer can approve/reject this task.')

        criteria_data = criteria_data or []
        task_rule_ids = set(task.design_rules.values_list('id', flat=True))

        if overall_status == 'rejected':
            if not criteria_data:
                raise serializers.ValidationError('Reject requires review criteria data.')

            unmet_criteria = [item for item in criteria_data if item.get('is_met') is False]
            if not unmet_criteria:
                raise serializers.ValidationError('Reject must include at least one unmet criterion (is_met=false).')

        for criterion_data in criteria_data:
            design_rule_id = criterion_data.get('design_rule')
            if design_rule_id not in task_rule_ids:
                raise serializers.ValidationError('Review criteria must reference design rules attached to the task.')

        review = TaskReview.objects.create(
            task=task,
            reviewer=reviewer,
            overall_status=overall_status,
            comment=comment or ''
        )

        if criteria_data:
            for criterion_data in criteria_data:
                design_rule_id = criterion_data.get('design_rule')
                is_met = criterion_data.get('is_met')

                if design_rule_id is None or is_met is None:
                    continue

                ReviewCriteria.objects.create(
                    review=review,
                    design_rule_id=design_rule_id,
                    is_met=bool(is_met),
                    comment=criterion_data.get('comment', '')
                )

        old_status = task.status
        task.status = 'approved' if overall_status == 'approved' else 'rejected'
        task.save(update_fields=['status', 'updated_at'])

        create_task_review_completed_notification(
            task=task,
            reviewer=reviewer,
            overall_status=review.get_overall_status_display(),
        )
        create_task_status_changed_notification(
            task=task,
            changed_by=reviewer,
            old_status=old_status,
            new_status=task.status,
        )

        if comment:
            TaskComment.objects.create(
                task=task,
                user=reviewer,
                comment=f"Review result: {review.get_overall_status_display()} - {comment}"
            )

        return review

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

            if 'status' in update_data:
                task = serializer.instance
                self._validate_freelancer_status_change(task, update_data['status'])

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
        task.assigned_by = request.user
        task.status = 'assigned'
        task.save()

        create_task_assigned_notification(task=task, assigned_by=request.user)

        return Response({
            'message': f'Task assigned to {freelancer.username} successfully',
            'task': TaskDetailSerializer(task, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def assign_reviewer(self, request, pk=None):
        """Assign reviewer to task (or clear reviewer with null)."""
        task = self.get_object()
        serializer = TaskReviewerAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reviewer_id = serializer.validated_data.get('reviewer')

        if reviewer_id is None:
            task.reviewer = None
            task.save(update_fields=['reviewer', 'updated_at'])
            return Response({
                'message': 'Reviewer cleared successfully',
                'task': TaskDetailSerializer(task, context={'request': request}).data
            })

        from accounts.models import User
        reviewer = User.objects.get(id=reviewer_id)

        task.reviewer = reviewer
        task.save(update_fields=['reviewer', 'updated_at'])

        return Response({
            'message': f'Reviewer assigned to {reviewer.get_full_name() or reviewer.username} successfully',
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

        if new_status in ['approved', 'rejected']:
            return Response(
                {'error': 'Use review actions (approve/reject) for review decisions.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if request.user.role == 'freelancer':
            if task.assigned_to_id != request.user.id:
                return Response(
                    {'error': 'You can only change status for your own assigned tasks.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            self._validate_freelancer_status_change(task, new_status)

        if new_status == 'review_pending' and not task.reviewer:
            return Response(
                {'error': 'Reviewer must be assigned before submitting task for review.'},
                status=status.HTTP_400_BAD_REQUEST
            )

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

        create_task_status_changed_notification(
            task=task,
            changed_by=request.user,
            old_status=old_status,
            new_status=new_status,
        )

        return Response({
            'message': f'Task status changed from {old_status} to {new_status}',
            'task': TaskDetailSerializer(task, context={'request': request}).data
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Review and approve a task in review_pending status."""
        task = self.get_object()

        if not self._is_reviewer(request.user):
            return Response({'error': 'You do not have permission to approve tasks.'}, status=status.HTTP_403_FORBIDDEN)

        comment = request.data.get('comment', '')
        criteria_data = request.data.get('criteria_data', [])

        review = self._review_task(
            task=task,
            reviewer=request.user,
            overall_status='approved',
            comment=comment,
            criteria_data=criteria_data,
        )

        return Response({
            'message': 'Task approved successfully',
            'task': TaskDetailSerializer(task, context={'request': request}).data,
            'review_id': review.id,
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Review and reject a task in review_pending status."""
        task = self.get_object()

        if not self._is_reviewer(request.user):
            return Response({'error': 'You do not have permission to reject tasks.'}, status=status.HTTP_403_FORBIDDEN)

        comment = request.data.get('comment', '')
        criteria_data = request.data.get('criteria_data', [])

        review = self._review_task(
            task=task,
            reviewer=request.user,
            overall_status='rejected',
            comment=comment,
            criteria_data=criteria_data,
        )

        return Response({
            'message': 'Task rejected successfully',
            'task': TaskDetailSerializer(task, context={'request': request}).data,
            'review_id': review.id,
        })

    @action(detail=False, methods=['get'])
    def earnings_summary(self, request):
        """Calculate freelancer earnings from approved/completed tasks."""
        user = request.user
        freelancer_id = request.query_params.get('freelancer_id')

        if user.role == 'freelancer':
            target_user_id = user.id
        else:
            if user.role not in ['admin', 'manager'] and not user.is_superuser:
                return Response({'error': 'You do not have permission to view earnings summary.'}, status=status.HTTP_403_FORBIDDEN)
            if not freelancer_id:
                return Response({'error': 'freelancer_id is required for non-freelancer users.'}, status=status.HTTP_400_BAD_REQUEST)
            target_user_id = freelancer_id

        base_queryset = Task.objects.filter(assigned_to_id=target_user_id)
        payable_queryset = base_queryset.filter(status__in=['approved', 'completed'], price__isnull=False)

        total_earned = payable_queryset.aggregate(
            total=Coalesce(
                Sum('price'),
                Value(0),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )['total']
        pending_review_amount = base_queryset.filter(status='review_pending', price__isnull=False).aggregate(
            total=Coalesce(
                Sum('price'),
                Value(0),
                output_field=DecimalField(max_digits=12, decimal_places=2)
            )
        )['total']

        return Response({
            'freelancer_id': int(target_user_id),
            'total_tasks': base_queryset.count(),
            'approved_or_completed_tasks': payable_queryset.count(),
            'total_earned': total_earned,
            'pending_review_amount': pending_review_amount,
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
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['task', 'user', 'parent', 'design_rule', 'is_passed']
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

    def create(self, request, *args, **kwargs):
        payload = request.data.copy()
        if 'text' in payload and 'comment' not in payload:
            payload['comment'] = payload.get('text')

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        payload = request.data.copy()
        if 'text' in payload and 'comment' not in payload:
            payload['comment'] = payload.get('text')

        serializer = self.get_serializer(instance, data=payload, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

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
