from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, CareerPathViewSet, EmployeeViewSet,
    KPIViewSet, EvaluationViewSet, SalaryReviewViewSet, PersonalReportViewSet
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'career-paths', CareerPathViewSet, basename='careerpath')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'kpis', KPIViewSet, basename='kpi')
router.register(r'evaluations', EvaluationViewSet, basename='evaluation')
router.register(r'salary-reviews', SalaryReviewViewSet, basename='salaryreview')
router.register(r'reports', PersonalReportViewSet, basename='personalreport')

urlpatterns = [
    path('', include(router.urls)),
]
