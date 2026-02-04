from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskReviewViewSet, ReviewCriteriaViewSet

router = DefaultRouter()
router.register(r'reviews', TaskReviewViewSet, basename='review')
router.register(r'review-criteria', ReviewCriteriaViewSet, basename='review-criteria')

urlpatterns = [
    path('', include(router.urls)),
]
