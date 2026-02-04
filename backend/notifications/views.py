from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter

from .models import Notification
from .serializers import NotificationSerializer, NotificationCreateSerializer
from accounts.permissions import IsAdmin


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification operations
    Users can only see their own notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['notification_type', 'is_read', 'task']
    ordering = ['-created_at']

    def get_queryset(self):
        """Users only see their own notifications"""
        user = self.request.user

        if user.role == 'admin' or user.is_superuser:
            # Admin can see all notifications
            return Notification.objects.all()
        else:
            # Users see only their notifications
            return Notification.objects.filter(recipient=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

    def get_permissions(self):
        """Only admin can create notifications manually"""
        if self.action == 'create':
            return [IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications for current user"""
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response({
            'count': notifications.count(),
            'notifications': serializer.data
        })

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.mark_as_read()

        return Response({
            'message': 'Notification marked as read',
            'notification': NotificationSerializer(notification).data
        })

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        count = self.get_queryset().filter(is_read=False).update(is_read=True)

        return Response({
            'message': f'{count} notification(s) marked as read',
            'count': count
        })

    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """Mark a notification as unread"""
        notification = self.get_object()
        notification.is_read = False
        notification.save()

        return Response({
            'message': 'Notification marked as unread',
            'notification': NotificationSerializer(notification).data
        })
