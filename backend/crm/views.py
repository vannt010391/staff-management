from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Sum
from itertools import chain
from operator import attrgetter

from .models import CustomerStage, ExpenseType, Customer, CustomerInteraction, CustomerExpense
from .serializers import (
    CustomerStageSerializer,
    ExpenseTypeSerializer,
    CustomerListSerializer,
    CustomerSerializer,
    CustomerInteractionSerializer,
    CustomerExpenseSerializer
)
from .permissions import CanManageCRM, CanApproveExpense, IsAdminOrManagerOrAssigned


class CustomerStageViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomerStage model"""

    queryset = CustomerStage.objects.filter(is_active=True)
    serializer_class = CustomerStageSerializer
    permission_classes = [CanManageCRM]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_final', 'is_system', 'color']
    ordering_fields = ['order', 'name', 'success_probability']
    ordering = ['order']

    def get_queryset(self):
        """Get all active stages or all stages for admin"""
        if self.request.user.role in ['admin', 'manager']:
            return CustomerStage.objects.all()
        return CustomerStage.objects.filter(is_active=True)

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of system stages"""
        instance = self.get_object()
        if instance.is_system:
            return Response(
                {'error': 'Cannot delete system customer stage'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle stage active status"""
        stage = self.get_object()
        stage.is_active = not stage.is_active
        stage.save()
        serializer = self.get_serializer(stage)
        return Response(serializer.data)


class ExpenseTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for ExpenseType model"""

    queryset = ExpenseType.objects.filter(is_active=True)
    serializer_class = ExpenseTypeSerializer
    permission_classes = [CanManageCRM]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active', 'is_system', 'color']
    ordering_fields = ['order', 'name']
    ordering = ['order']

    def get_queryset(self):
        """Get all active types or all types for admin"""
        if self.request.user.role in ['admin', 'manager']:
            return ExpenseType.objects.all()
        return ExpenseType.objects.filter(is_active=True)

    def destroy(self, request, *args, **kwargs):
        """Prevent deletion of system expense types"""
        instance = self.get_object()
        if instance.is_system:
            return Response(
                {'error': 'Cannot delete system expense type'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle expense type active status"""
        expense_type = self.get_object()
        expense_type.is_active = not expense_type.is_active
        expense_type.save()
        serializer = self.get_serializer(expense_type)
        return Response(serializer.data)


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for Customer model"""

    queryset = Customer.objects.all()
    permission_classes = [IsAdminOrManagerOrAssigned]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['current_stage', 'assigned_to', 'priority', 'status', 'industry', 'company_size', 'source']
    search_fields = ['company_name', 'contact_person', 'email', 'phone']
    ordering_fields = ['company_name', 'created_at', 'estimated_value', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Use different serializers for list and detail"""
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer

    def get_queryset(self):
        """Filter customers based on user role"""
        user = self.request.user

        # Admin/Manager see all customers
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return Customer.objects.all()

        # Others see only assigned customers
        return Customer.objects.filter(assigned_to=user)

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Get customer timeline (interactions + expenses)"""
        customer = self.get_object()

        # Get interactions
        interactions = customer.interactions.all()
        interaction_data = CustomerInteractionSerializer(interactions, many=True, context={'request': request}).data

        # Get expenses
        expenses = customer.expenses.all()
        expense_data = CustomerExpenseSerializer(expenses, many=True, context={'request': request}).data

        # Combine and sort by date
        timeline_items = []

        for item in interaction_data:
            timeline_items.append({
                'type': 'interaction',
                'date': item['interaction_date'],
                'data': item
            })

        for item in expense_data:
            timeline_items.append({
                'type': 'expense',
                'date': item['expense_date'],
                'data': item
            })

        # Sort by date descending
        timeline_items.sort(key=lambda x: x['date'], reverse=True)

        return Response(timeline_items)

    @action(detail=True, methods=['get'])
    def projects(self, request, pk=None):
        """Get customer's projects"""
        customer = self.get_object()
        projects = customer.projects.all()

        # Simple project data
        project_data = [{
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'status': p.status,
            'start_date': p.start_date,
            'end_date': p.end_date,
            'created_at': p.created_at
        } for p in projects]

        return Response(project_data)

    @action(detail=True, methods=['post'])
    def move_stage(self, request, pk=None):
        """Move customer to a different stage"""
        customer = self.get_object()
        new_stage_id = request.data.get('stage_id')

        if not new_stage_id:
            return Response(
                {'error': 'stage_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_stage = CustomerStage.objects.get(id=new_stage_id)
        except CustomerStage.DoesNotExist:
            return Response(
                {'error': 'Stage not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update customer stage
        customer.current_stage = new_stage
        customer.stage_changed_at = timezone.now()
        customer.save()

        serializer = self.get_serializer(customer)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pipeline(self, request):
        """Get pipeline statistics"""
        stages = CustomerStage.objects.filter(is_active=True).order_by('order')

        pipeline_data = []
        for stage in stages:
            customer_count = Customer.objects.filter(
                current_stage=stage,
                status='active'
            ).count()

            total_value = Customer.objects.filter(
                current_stage=stage,
                status='active'
            ).aggregate(total=Sum('estimated_value'))['total'] or 0

            pipeline_data.append({
                'stage': CustomerStageSerializer(stage).data,
                'customer_count': customer_count,
                'total_value': total_value,
                'weighted_value': total_value * stage.success_probability / 100
            })

        # Overall stats
        total_customers = Customer.objects.filter(status='active').count()
        total_value = Customer.objects.filter(status='active').aggregate(
            total=Sum('estimated_value')
        )['total'] or 0

        return Response({
            'pipeline': pipeline_data,
            'total_customers': total_customers,
            'total_value': total_value
        })


class CustomerInteractionViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomerInteraction model"""

    queryset = CustomerInteraction.objects.all()
    serializer_class = CustomerInteractionSerializer
    permission_classes = [IsAdminOrManagerOrAssigned]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'interaction_type', 'outcome', 'created_by']
    search_fields = ['title', 'description', 'customer__company_name']
    ordering_fields = ['interaction_date', 'created_at']
    ordering = ['-interaction_date']

    def get_queryset(self):
        """Filter interactions based on user role and customer assignment"""
        user = self.request.user

        # Admin/Manager see all
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return CustomerInteraction.objects.all()

        # Others see only interactions for their assigned customers
        return CustomerInteraction.objects.filter(customer__assigned_to=user)

    def perform_create(self, serializer):
        """Set created_by to current user and handle stage change"""
        interaction = serializer.save(created_by=self.request.user)

        # If stage changed, update customer's current stage
        if interaction.stage_after and interaction.stage_after != interaction.stage_before:
            customer = interaction.customer
            customer.current_stage = interaction.stage_after
            customer.stage_changed_at = timezone.now()
            customer.save()


class CustomerExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomerExpense model"""

    queryset = CustomerExpense.objects.all()
    serializer_class = CustomerExpenseSerializer
    permission_classes = [CanApproveExpense]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'expense_type', 'status', 'created_by']
    search_fields = ['title', 'description', 'customer__company_name']
    ordering_fields = ['expense_date', 'amount', 'created_at']
    ordering = ['-expense_date']

    def get_queryset(self):
        """Filter expenses based on user role and customer assignment"""
        user = self.request.user

        # Admin/Manager see all
        if user.role in ['admin', 'manager'] or user.is_superuser:
            return CustomerExpense.objects.all()

        # Others see only expenses for their assigned customers
        return CustomerExpense.objects.filter(customer__assigned_to=user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an expense"""
        expense = self.get_object()

        # Check if already approved/rejected
        if expense.status != 'pending':
            return Response(
                {'error': f'Expense is already {expense.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update expense
        expense.status = 'approved'
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.save()

        serializer = self.get_serializer(expense)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an expense"""
        expense = self.get_object()

        # Check if already approved/rejected
        if expense.status != 'pending':
            return Response(
                {'error': f'Expense is already {expense.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get rejection reason
        reason = request.data.get('reason', '')

        # Update expense
        expense.status = 'rejected'
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        if reason:
            expense.description = f"{expense.description}\n\nRejection reason: {reason}"
        expense.save()

        serializer = self.get_serializer(expense)
        return Response(serializer.data)
