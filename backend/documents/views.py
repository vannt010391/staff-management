from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ['title', 'description', 'external_url']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager', 'team_lead'] or user.is_superuser:
            return Document.objects.all()
        return Document.objects.filter(uploaded_by=user)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def perform_update(self, serializer):
        user = self.request.user
        document = serializer.instance
        if document.uploaded_by_id != user.id and user.role not in ['admin', 'manager', 'team_lead'] and not user.is_superuser:
            raise PermissionDenied('You can only update your own documents.')
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.uploaded_by_id != user.id and user.role not in ['admin', 'manager', 'team_lead'] and not user.is_superuser:
            raise PermissionDenied('You can only delete your own documents.')
        instance.delete()
