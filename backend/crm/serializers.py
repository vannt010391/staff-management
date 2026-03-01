from rest_framework import serializers
from .models import CustomerStage, ExpenseType, Customer, CustomerInteraction, CustomerExpense
from accounts.serializers import UserSerializer


class CustomerStageSerializer(serializers.ModelSerializer):
    """Serializer for CustomerStage model"""

    color_display = serializers.CharField(source='get_color_display', read_only=True)
    customer_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomerStage
        fields = [
            'id', 'name', 'icon', 'color', 'color_display', 'description',
            'order', 'success_probability', 'is_active', 'is_final', 'is_system',
            'customer_count', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_customer_count(self, obj):
        """Get count of customers in this stage"""
        return obj.customers.filter(status='active').count()


class ExpenseTypeSerializer(serializers.ModelSerializer):
    """Serializer for ExpenseType model"""

    color_display = serializers.CharField(source='get_color_display', read_only=True)
    expense_count = serializers.SerializerMethodField()

    class Meta:
        model = ExpenseType
        fields = [
            'id', 'name', 'icon', 'color', 'color_display', 'description',
            'is_active', 'is_system', 'order', 'expense_count', 'created_at'
        ]
        read_only_fields = ['created_at']

    def get_expense_count(self, obj):
        """Get count of expenses of this type"""
        return obj.expenses.count()


class CustomerListSerializer(serializers.ModelSerializer):
    """Simplified serializer for customer list view"""

    current_stage_detail = CustomerStageSerializer(source='current_stage', read_only=True)
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    days_in_stage = serializers.ReadOnlyField(source='days_in_current_stage')

    class Meta:
        model = Customer
        fields = [
            'id', 'company_name', 'contact_person', 'email', 'phone',
            'current_stage', 'current_stage_detail', 'assigned_to', 'assigned_to_detail',
            'estimated_value', 'priority', 'priority_display', 'status', 'status_display',
            'days_in_stage', 'created_at', 'updated_at'
        ]


class CustomerSerializer(serializers.ModelSerializer):
    """Full serializer for customer detail view"""

    current_stage_detail = CustomerStageSerializer(source='current_stage', read_only=True)
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)

    # Display fields
    industry_display = serializers.CharField(source='get_industry_display', read_only=True)
    company_size_display = serializers.CharField(source='get_company_size_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    # Computed fields
    total_projects = serializers.ReadOnlyField()
    total_revenue = serializers.ReadOnlyField()
    total_expenses = serializers.ReadOnlyField()
    profit_margin = serializers.ReadOnlyField()
    days_in_current_stage = serializers.ReadOnlyField()

    class Meta:
        model = Customer
        fields = [
            'id', 'company_name', 'contact_person', 'email', 'phone', 'address', 'website',
            'industry', 'industry_display', 'company_size', 'company_size_display',
            'current_stage', 'current_stage_detail', 'assigned_to', 'assigned_to_detail',
            'source', 'source_display', 'estimated_value', 'priority', 'priority_display',
            'status', 'status_display', 'notes',
            'total_projects', 'total_revenue', 'total_expenses', 'profit_margin',
            'days_in_current_stage', 'created_at', 'updated_at', 'stage_changed_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'stage_changed_at']

    def to_internal_value(self, data):
        """Normalize common empty-string payloads from forms before DRF field validation."""
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)

        if mutable_data.get('assigned_to') == '':
            mutable_data['assigned_to'] = None

        if mutable_data.get('estimated_value') == '':
            mutable_data['estimated_value'] = None

        return super().to_internal_value(mutable_data)


class CustomerInteractionSerializer(serializers.ModelSerializer):
    """Serializer for CustomerInteraction model"""

    customer_detail = serializers.SerializerMethodField()
    interaction_type_display = serializers.CharField(source='get_interaction_type_display', read_only=True)
    outcome_display = serializers.CharField(source='get_outcome_display', read_only=True)
    stage_before_detail = CustomerStageSerializer(source='stage_before', read_only=True)
    stage_after_detail = CustomerStageSerializer(source='stage_after', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    attendees_detail = UserSerializer(source='attendees', many=True, read_only=True)
    is_stage_change = serializers.ReadOnlyField()

    class Meta:
        model = CustomerInteraction
        fields = [
            'id', 'customer', 'customer_detail', 'interaction_type', 'interaction_type_display',
            'title', 'description', 'interaction_date', 'duration',
            'stage_before', 'stage_before_detail', 'stage_after', 'stage_after_detail',
            'outcome', 'outcome_display', 'next_action', 'next_action_date',
            'created_by', 'created_by_detail', 'attendees', 'attendees_detail',
            'is_stage_change', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_customer_detail(self, obj):
        """Get basic customer info"""
        return {
            'id': obj.customer.id,
            'company_name': obj.customer.company_name,
            'contact_person': obj.customer.contact_person
        }

    def create(self, validated_data):
        """Set created_by to current user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class CustomerExpenseSerializer(serializers.ModelSerializer):
    """Serializer for CustomerExpense model"""

    customer_detail = serializers.SerializerMethodField()
    expense_type_detail = ExpenseTypeSerializer(source='expense_type', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    approved_by_detail = UserSerializer(source='approved_by', read_only=True)

    class Meta:
        model = CustomerExpense
        fields = [
            'id', 'customer', 'customer_detail', 'expense_type', 'expense_type_detail',
            'title', 'amount', 'expense_date', 'description', 'receipt',
            'status', 'status_display', 'approved_by', 'approved_by_detail', 'approved_at',
            'created_by', 'created_by_detail', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'approved_by', 'approved_at']

    def get_customer_detail(self, obj):
        """Get basic customer info"""
        return {
            'id': obj.customer.id,
            'company_name': obj.customer.company_name,
            'contact_person': obj.customer.contact_person
        }

    def create(self, validated_data):
        """Set created_by to current user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
