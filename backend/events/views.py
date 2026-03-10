from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime, timedelta

from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing calendar events.
    Each user can only see and manage their own events.
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['start_date', 'end_date', 'is_all_day']
    search_fields = ['title', 'description']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['start_date', 'start_time']

    def get_queryset(self):
        """Users can only see their own events"""
        return Event.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatically set the user when creating an event"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """
        Get events within a date range.
        Query params: start_date, end_date (format: YYYY-MM-DD)
        """
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            return Response({'error': 'start_date and end_date are required'}, status=400)

        queryset = self.get_queryset().filter(
            start_date__lte=end_date,
            end_date__gte=start_date
        )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
