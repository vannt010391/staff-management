from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, TopicViewSet, DesignRuleViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'design-rules', DesignRuleViewSet, basename='design-rule')

urlpatterns = [
    path('', include(router.urls)),
]
