from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import TaskReview, ReviewCriteria
from .serializers import (
    TaskReviewListSerializer,
    TaskReviewDetailSerializer,
    TaskReviewCreateSerializer,
    TaskReviewUpdateSerializer,
    ReviewCriteriaSerializer
)
from accounts.permissions import IsManagerOrAdmin


class TaskReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TaskReview operations
    Only Manager and Admin can create/manage reviews
    """
    queryset = TaskReview.objects.all()
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['task', 'reviewer', 'overall_status']
    ordering = ['-reviewed_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskReviewListSerializer
        elif self.action == 'create':
            return TaskReviewCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskReviewUpdateSerializer
        return TaskReviewDetailSerializer

    @action(detail=True, methods=['get'])
    def criteria(self, request, pk=None):
        """Get all criteria for a review"""
        review = self.get_object()
        criteria = review.criteria.all()
        serializer = ReviewCriteriaSerializer(criteria, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_task(self, request):
        """Get all reviews for a specific task"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {'error': 'task_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reviews = self.queryset.filter(task_id=task_id)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)


class ReviewCriteriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ReviewCriteria operations
    Only Manager and Admin can manage criteria
    """
    queryset = ReviewCriteria.objects.all()
    serializer_class = ReviewCriteriaSerializer
    permission_classes = [IsManagerOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['review', 'design_rule', 'is_met']
    ordering = ['design_rule__order', 'created_at']
