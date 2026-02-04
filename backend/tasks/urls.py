from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskFileViewSet, TaskCommentViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'task-files', TaskFileViewSet, basename='task-file')
router.register(r'task-comments', TaskCommentViewSet, basename='task-comment')

urlpatterns = [
    path('', include(router.urls)),
]
