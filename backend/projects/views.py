from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Project, Topic, DesignRule
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateUpdateSerializer,
    TopicSerializer,
    DesignRuleSerializer
)
from accounts.permissions import IsManagerOrAdmin


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Project CRUD operations
    Only Manager and Admin can manage projects
    """
    queryset = Project.objects.all()
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'created_by']
    search_fields = ['name', 'description', 'client_name']
    ordering_fields = ['created_at', 'name', 'start_date', 'end_date']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        return ProjectDetailSerializer

    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)

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
    Only Manager and Admin can manage topics
    """
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsManagerOrAdmin]
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
    Only Manager and Admin can manage design rules
    """
    queryset = DesignRule.objects.all()
    serializer_class = DesignRuleSerializer
    permission_classes = [IsManagerOrAdmin]
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
