from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q

from .models import Project, Topic, DesignRule
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateUpdateSerializer,
    TopicSerializer,
    DesignRuleSerializer
)
from accounts.permissions import IsManagerOrAdmin, IsManagerAdminOrStaffReadOnly, IsManagerAdminTeamLeadOrStaff


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations
    Admin/Manager: see all projects
    Others: see projects where their department is assigned OR they are a direct member
    """
    queryset = Project.objects.all()
    permission_classes = [IsManagerAdminOrStaffReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'created_by']
    search_fields = ['name', 'description', 'client_name']
    ordering_fields = ['created_at', 'name', 'start_date', 'end_date']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return Project.objects.all().distinct()
        # Staff/team_lead: see projects via department OR direct membership
        return Project.objects.filter(
            Q(departments__employees__user=user) | Q(members=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def add_department(self, request, pk=None):
        """Add a department to this project"""
        project = self.get_object()
        dept_id = request.data.get('department_id')
        if not dept_id:
            return Response({'error': 'department_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        from hr.models import Department
        try:
            dept = Department.objects.get(pk=dept_id)
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)
        project.departments.add(dept)
        return Response({'status': 'department added'})

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def remove_department(self, request, pk=None):
        """Remove a department from this project"""
        project = self.get_object()
        dept_id = request.data.get('department_id')
        if not dept_id:
            return Response({'error': 'department_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        from hr.models import Department
        try:
            dept = Department.objects.get(pk=dept_id)
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)
        project.departments.remove(dept)
        return Response({'status': 'department removed'})

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def add_member(self, request, pk=None):
        """Add an individual member to this project"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            member = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        project.members.add(member)
        return Response({'status': 'member added'})

    @action(detail=True, methods=['post'], permission_classes=[IsManagerOrAdmin])
    def remove_member(self, request, pk=None):
        """Remove an individual member from this project"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            member = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        project.members.remove(member)
        return Response({'status': 'member removed'})

    @action(detail=True, methods=['get'])
    def topics(self, request, pk=None):
        """Get all topics for a project"""
        project = self.get_object()
        topics = project.topics.all()
        serializer = TopicSerializer(topics, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def design_rules(self, request, pk=None):
        """Get all design rules for a project"""
        project = self.get_object()
        design_rules = project.design_rules.all()
        serializer = DesignRuleSerializer(design_rules, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get project statistics"""
        project = self.get_object()

        # Task statistics
        tasks = project.tasks.all()
        total_tasks = tasks.count()

        stats = {
            'total_tasks': total_tasks,
            'tasks_by_status': {
                'new': tasks.filter(status='new').count(),
                'assigned': tasks.filter(status='assigned').count(),
                'working': tasks.filter(status='working').count(),
                'review_pending': tasks.filter(status='review_pending').count(),
                'approved': tasks.filter(status='approved').count(),
                'rejected': tasks.filter(status='rejected').count(),
                'completed': tasks.filter(status='completed').count(),
            },
            'total_topics': project.topics.count(),
            'total_design_rules': project.design_rules.count(),
            'completion_rate': (
                (project.completed_tasks / total_tasks * 100)
                if total_tasks > 0 else 0
            )
        }

        return Response(stats)


class TopicViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Topic CRUD operations
    Manager and Admin can manage topics, Staff can view (read-only)
    """
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsManagerAdminOrStaffReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project']
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', 'created_at']

    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Update topic order"""
        topic = self.get_object()
        new_order = request.data.get('order')

        if new_order is None:
            return Response(
                {'error': 'Order field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        topic.order = new_order
        topic.save()

        return Response({
            'message': 'Topic order updated successfully',
            'topic': TopicSerializer(topic).data
        })


class DesignRuleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for DesignRule CRUD operations
    Manager, Admin, Team Lead, and Staff can create/update
    Only Admin can delete
    """
    queryset = DesignRule.objects.all()
    serializer_class = DesignRuleSerializer
    permission_classes = [IsManagerAdminTeamLeadOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'category', 'is_required']
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', 'created_at']

    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Update design rule order"""
        rule = self.get_object()
        new_order = request.data.get('order')

        if new_order is None:
            return Response(
                {'error': 'Order field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        rule.order = new_order
        rule.save()

        return Response({
            'message': 'Design rule order updated successfully',
            'design_rule': DesignRuleSerializer(rule).data
        })
