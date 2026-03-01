from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Sum


class CustomerStage(models.Model):
    """Stages in the sales pipeline"""

    STAGE_COLORS = [
        ('blue', 'Blue'),
        ('cyan', 'Cyan'),
        ('green', 'Green'),
        ('yellow', 'Yellow'),
        ('purple', 'Purple'),
        ('emerald', 'Emerald'),
        ('red', 'Red'),
    ]

    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=10, default='📝')  # Emoji
    color = models.CharField(max_length=20, choices=STAGE_COLORS, default='blue')
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    success_probability = models.IntegerField(
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Probability of success (0-100%)'
    )
    is_active = models.BooleanField(default=True)
    is_final = models.BooleanField(default=False, help_text='Final stage (Won/Lost)')
    is_system = models.BooleanField(default=False, help_text='System stage cannot be deleted')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Customer Stage'
        verbose_name_plural = 'Customer Stages'

    def __str__(self):
        return f"{self.icon} {self.name}"


class ExpenseType(models.Model):
    """Types of expenses for customers"""

    EXPENSE_COLORS = [
        ('purple', 'Purple'),
        ('blue', 'Blue'),
        ('pink', 'Pink'),
        ('yellow', 'Yellow'),
        ('green', 'Green'),
        ('indigo', 'Indigo'),
        ('orange', 'Orange'),
        ('cyan', 'Cyan'),
        ('red', 'Red'),
        ('gray', 'Gray'),
    ]

    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=10, default='📝')  # Emoji
    color = models.CharField(max_length=20, choices=EXPENSE_COLORS, default='gray')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_system = models.BooleanField(default=False, help_text='System type cannot be deleted')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Expense Type'
        verbose_name_plural = 'Expense Types'

    def __str__(self):
        return f"{self.icon} {self.name}"


class Customer(models.Model):
    """Customer information and CRM tracking"""

    INDUSTRY_CHOICES = [
        ('it', 'Information Technology'),
        ('manufacturing', 'Manufacturing'),
        ('retail', 'Retail'),
        ('finance', 'Finance'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('construction', 'Construction'),
        ('other', 'Other'),
    ]

    COMPANY_SIZE_CHOICES = [
        ('1-10', '1-10 employees'),
        ('11-50', '11-50 employees'),
        ('51-200', '51-200 employees'),
        ('201-500', '201-500 employees'),
        ('500+', '500+ employees'),
    ]

    SOURCE_CHOICES = [
        ('website', 'Website'),
        ('referral', 'Referral'),
        ('social_media', 'Social Media'),
        ('cold_call', 'Cold Call'),
        ('event', 'Event'),
        ('partner', 'Partner'),
        ('other', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('won', 'Won'),
        ('lost', 'Lost'),
    ]

    # Basic Info
    company_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)

    # Company Info
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES, default='other')
    company_size = models.CharField(max_length=20, choices=COMPANY_SIZE_CHOICES, default='1-10')

    # CRM Info
    current_stage = models.ForeignKey(
        CustomerStage,
        on_delete=models.PROTECT,
        related_name='customers'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_customers'
    )
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='other')
    estimated_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Notes
    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    stage_changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

    def __str__(self):
        return self.company_name

    @property
    def total_projects(self):
        """Total number of projects for this customer"""
        return self.projects.count()

    @property
    def total_revenue(self):
        """Total revenue from projects (if Project has budget field)"""
        # Note: Assuming Project model will have budget field
        # If not, this will return 0
        try:
            from projects.models import Project
            result = self.projects.aggregate(total=Sum('budget'))['total']
            return result or 0
        except:
            return 0

    @property
    def total_expenses(self):
        """Total expenses for this customer"""
        result = self.expenses.filter(status='approved').aggregate(total=Sum('amount'))['total']
        return result or 0

    @property
    def profit_margin(self):
        """Profit margin = revenue - expenses"""
        return self.total_revenue - self.total_expenses

    @property
    def days_in_current_stage(self):
        """Number of days in current stage"""
        from django.utils import timezone
        delta = timezone.now() - self.stage_changed_at
        return delta.days


class CustomerInteraction(models.Model):
    """Interaction history with customers"""

    INTERACTION_TYPES = [
        ('call', 'Phone Call'),
        ('email', 'Email'),
        ('meeting', 'Meeting'),
        ('demo', 'Demo/Presentation'),
        ('visit', 'Site Visit'),
        ('other', 'Other'),
    ]

    OUTCOME_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='interactions'
    )
    interaction_type = models.CharField(max_length=50, choices=INTERACTION_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    interaction_date = models.DateTimeField()
    duration = models.IntegerField(
        help_text='Duration in minutes',
        null=True,
        blank=True
    )

    # Stage tracking
    stage_before = models.ForeignKey(
        CustomerStage,
        on_delete=models.SET_NULL,
        null=True,
        related_name='interactions_before'
    )
    stage_after = models.ForeignKey(
        CustomerStage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='interactions_after'
    )

    # Outcome
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES, default='neutral')
    next_action = models.TextField(blank=True)
    next_action_date = models.DateField(null=True, blank=True)

    # Meta
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_interactions'
    )
    attendees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='attended_interactions'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-interaction_date']
        verbose_name = 'Customer Interaction'
        verbose_name_plural = 'Customer Interactions'

    def __str__(self):
        return f"{self.customer.company_name} - {self.title}"

    @property
    def is_stage_change(self):
        """Check if this interaction resulted in a stage change"""
        return self.stage_after is not None and self.stage_before != self.stage_after


class CustomerExpense(models.Model):
    """Expenses incurred for customers"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    expense_type = models.ForeignKey(
        ExpenseType,
        on_delete=models.PROTECT,
        related_name='expenses'
    )
    title = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    expense_date = models.DateField()
    description = models.TextField(blank=True)
    receipt = models.FileField(
        upload_to='crm/receipts/',
        null=True,
        blank=True
    )

    # Approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    # Meta
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_expenses'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-expense_date']
        verbose_name = 'Customer Expense'
        verbose_name_plural = 'Customer Expenses'

    def __str__(self):
        return f"{self.customer.company_name} - {self.title} - {self.amount}"
