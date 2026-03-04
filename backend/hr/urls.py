from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, CareerPathViewSet, EmployeeViewSet,
    KPIViewSet, EvaluationViewSet, SalaryReviewViewSet, PersonalReportViewSet,
    PlanViewSet, PlanGoalViewSet, PlanNoteViewSet,
    PlanDailyProgressViewSet, PlanUpdateHistoryViewSet,
    AttendanceViewSet, AttendanceSettingsViewSet
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'career-paths', CareerPathViewSet, basename='careerpath')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'kpis', KPIViewSet, basename='kpi')
router.register(r'evaluations', EvaluationViewSet, basename='evaluation')
router.register(r'salary-reviews', SalaryReviewViewSet, basename='salaryreview')
router.register(r'reports', PersonalReportViewSet, basename='personalreport')
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'plan-goals', PlanGoalViewSet, basename='plan-goal')
router.register(r'plan-notes', PlanNoteViewSet, basename='plan-note')
router.register(r'plan-daily-progress', PlanDailyProgressViewSet, basename='plan-daily-progress')
router.register(r'plan-update-history', PlanUpdateHistoryViewSet, basename='plan-update-history')
router.register(r'attendances', AttendanceViewSet, basename='attendance')
router.register(r'attendance-settings', AttendanceSettingsViewSet, basename='attendance-settings')

urlpatterns = [
    path('', include(router.urls)),
]
