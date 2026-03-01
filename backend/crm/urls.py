from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerStageViewSet,
    ExpenseTypeViewSet,
    CustomerViewSet,
    CustomerInteractionViewSet,
    CustomerExpenseViewSet
)

router = DefaultRouter()
router.register(r'stages', CustomerStageViewSet, basename='customerstage')
router.register(r'expense-types', ExpenseTypeViewSet, basename='expensetype')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'interactions', CustomerInteractionViewSet, basename='customerinteraction')
router.register(r'expenses', CustomerExpenseViewSet, basename='customerexpense')

urlpatterns = [
    path('', include(router.urls)),
]
