from django.contrib import admin
from .models import CustomerStage, ExpenseType, Customer, CustomerInteraction, CustomerExpense


@admin.register(CustomerStage)
class CustomerStageAdmin(admin.ModelAdmin):
    list_display = ['icon', 'name', 'color', 'order', 'success_probability', 'is_active', 'is_system', 'is_final']
    list_filter = ['is_active', 'is_system', 'is_final', 'color']
    search_fields = ['name', 'description']
    ordering = ['order', 'name']


@admin.register(ExpenseType)
class ExpenseTypeAdmin(admin.ModelAdmin):
    list_display = ['icon', 'name', 'color', 'order', 'is_active', 'is_system']
    list_filter = ['is_active', 'is_system', 'color']
    search_fields = ['name', 'description']
    ordering = ['order', 'name']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = [
        'company_name', 'contact_person', 'email', 'phone',
        'current_stage', 'assigned_to', 'priority', 'status',
        'estimated_value', 'created_at'
    ]
    list_filter = ['current_stage', 'priority', 'status', 'industry', 'company_size', 'source']
    search_fields = ['company_name', 'contact_person', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at', 'stage_changed_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('company_name', 'contact_person', 'email', 'phone', 'address', 'website')
        }),
        ('Company Details', {
            'fields': ('industry', 'company_size')
        }),
        ('CRM Information', {
            'fields': ('current_stage', 'assigned_to', 'source', 'estimated_value', 'priority', 'status')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'stage_changed_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(CustomerInteraction)
class CustomerInteractionAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'interaction_type', 'title', 'interaction_date',
        'duration', 'outcome', 'created_by', 'created_at'
    ]
    list_filter = ['interaction_type', 'outcome', 'interaction_date']
    search_fields = ['customer__company_name', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['attendees']


@admin.register(CustomerExpense)
class CustomerExpenseAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'expense_type', 'title', 'amount',
        'expense_date', 'status', 'approved_by', 'created_by', 'created_at'
    ]
    list_filter = ['status', 'expense_type', 'expense_date']
    search_fields = ['customer__company_name', 'title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'approved_at']

    fieldsets = (
        ('Expense Information', {
            'fields': ('customer', 'expense_type', 'title', 'amount', 'expense_date', 'description', 'receipt')
        }),
        ('Approval', {
            'fields': ('status', 'approved_by', 'approved_at')
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
