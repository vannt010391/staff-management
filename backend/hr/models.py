from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Department(models.Model):
    """
    Phòng ban trong công ty
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_departments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CareerPath(models.Model):
    """
    Lộ trình thăng tiến: Junior -> Mid -> Senior -> Lead -> Manager
    """
    LEVEL_CHOICES = [
        ('junior', 'Junior'),
        ('mid', 'Mid-Level'),
        ('senior', 'Senior'),
        ('lead', 'Team Lead'),
        ('manager', 'Manager'),
    ]

    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, unique=True)
    min_years_experience = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text='Số năm kinh nghiệm tối thiểu'
    )
    min_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Mức lương tối thiểu'
    )
    max_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Mức lương tối đa'
    )
    requirements = models.TextField(
        help_text='Yêu cầu kỹ năng và trách nhiệm'
    )
    benefits = models.TextField(
        blank=True,
        help_text='Quyền lợi đi kèm'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['min_years_experience']
        verbose_name = 'Career Path'
        verbose_name_plural = 'Career Paths'

    def __str__(self):
        return f"{self.get_level_display()} ({self.min_years_experience}+ years)"


class Employee(models.Model):
    """
    Nhân viên nội bộ - chỉ áp dụng cho Admin, Manager, Team Lead, Staff
    Không áp dụng cho Freelancer
    """
    CONTRACT_TYPE_CHOICES = [
        ('fulltime', 'Full-time'),
        ('parttime', 'Part-time'),
        ('contract', 'Contract'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        limit_choices_to={'role__in': ['admin', 'manager', 'team_lead', 'staff']}
    )
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        help_text='Mã nhân viên'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        related_name='employees'
    )
    career_level = models.ForeignKey(
        CareerPath,
        on_delete=models.SET_NULL,
        null=True,
        related_name='employees'
    )

    # Thông tin công việc
    position = models.CharField(max_length=100, help_text='Chức vụ')
    contract_type = models.CharField(
        max_length=20,
        choices=CONTRACT_TYPE_CHOICES,
        default='fulltime'
    )
    join_date = models.DateField(help_text='Ngày vào công ty')

    # Thông tin lương
    current_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    last_salary_review = models.DateField(null=True, blank=True)

    # Thông tin cá nhân
    date_of_birth = models.DateField(null=True, blank=True)
    citizen_id = models.CharField(max_length=20, blank=True, help_text='CCCD/CMND')
    address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)

    # Trạng thái
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-join_date']

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name() or self.user.username}"

    @property
    def years_of_service(self):
        """Tính số năm làm việc"""
        from datetime import date
        today = date.today()
        delta = today - self.join_date
        return delta.days / 365.25


class KPI(models.Model):
    """
    KPI hàng tháng cho nhân viên nội bộ
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='kpis'
    )
    month = models.DateField(help_text='Tháng đánh giá (chỉ lưu năm-tháng)')

    # Các chỉ số KPI
    tasks_completed = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Số task hoàn thành'
    )
    tasks_on_time = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Số task hoàn thành đúng hạn'
    )
    quality_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text='Điểm chất lượng (0-10)'
    )
    collaboration_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text='Điểm làm việc nhóm (0-10)'
    )
    innovation_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text='Điểm sáng tạo (0-10)'
    )

    # Chỉ số tổng hợp
    overall_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text='Điểm tổng hợp (0-10)'
    )

    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_kpis'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-month']
        unique_together = ['employee', 'month']
        verbose_name = 'KPI'
        verbose_name_plural = 'KPIs'

    def __str__(self):
        return f"{self.employee.employee_id} - {self.month.strftime('%Y-%m')} - Score: {self.overall_score}"


class Evaluation(models.Model):
    """
    Đánh giá định kỳ (tháng/quý/năm)
    """
    PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]

    RATING_CHOICES = [
        ('outstanding', 'Outstanding'),
        ('exceeds', 'Exceeds Expectations'),
        ('meets', 'Meets Expectations'),
        ('needs_improvement', 'Needs Improvement'),
        ('unsatisfactory', 'Unsatisfactory'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='evaluations'
    )
    evaluator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='conducted_evaluations'
    )
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    period_start = models.DateField()
    period_end = models.DateField()

    # Đánh giá
    overall_rating = models.CharField(max_length=20, choices=RATING_CHOICES)
    strengths = models.TextField(help_text='Điểm mạnh')
    areas_for_improvement = models.TextField(help_text='Điểm cần cải thiện')
    achievements = models.TextField(help_text='Thành tích nổi bật')
    goals_next_period = models.TextField(help_text='Mục tiêu kỳ tiếp theo')

    # Đề xuất
    promotion_recommended = models.BooleanField(
        default=False,
        help_text='Đề xuất thăng chức'
    )
    salary_increase_recommended = models.BooleanField(
        default=False,
        help_text='Đề xuất tăng lương'
    )
    recommended_increase_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Phần trăm tăng lương đề xuất'
    )

    # Phản hồi từ nhân viên
    employee_comments = models.TextField(
        blank=True,
        help_text='Ý kiến của nhân viên'
    )
    employee_acknowledged = models.BooleanField(
        default=False,
        help_text='Nhân viên đã xác nhận'
    )
    employee_acknowledged_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_end']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.period_type} ({self.period_start} to {self.period_end})"


class SalaryReview(models.Model):
    """
    Xét tăng lương - cần có quy trình phê duyệt
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('implemented', 'Implemented'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='salary_reviews'
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='requested_salary_reviews'
    )

    # Thông tin xét tăng lương
    current_salary = models.DecimalField(max_digits=12, decimal_places=2)
    proposed_salary = models.DecimalField(max_digits=12, decimal_places=2)
    increase_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    # Lý do
    reason = models.TextField(help_text='Lý do đề xuất tăng lương')
    justification = models.TextField(
        blank=True,
        help_text='Căn cứ: KPI, đánh giá, thành tích'
    )

    # Ngày hiệu lực
    effective_date = models.DateField(help_text='Ngày bắt đầu áp dụng mức lương mới')

    # Phê duyệt
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_salary_reviews'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_comments = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.current_salary} -> {self.proposed_salary} ({self.status})"

    def save(self, *args, **kwargs):
        # Tự động tính phần trăm tăng lương
        if self.current_salary and self.proposed_salary:
            self.increase_percentage = (
                (self.proposed_salary - self.current_salary) / self.current_salary * 100
            )
        super().save(*args, **kwargs)


class PersonalReport(models.Model):
    """
    Báo cáo công việc cá nhân (tuần/tháng)
    """
    REPORT_TYPE_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    period_start = models.DateField()
    period_end = models.DateField()

    # Nội dung báo cáo
    summary = models.TextField(help_text='Tóm tắt công việc đã làm')
    achievements = models.TextField(help_text='Thành tích đạt được')
    challenges = models.TextField(
        blank=True,
        help_text='Khó khăn gặp phải'
    )
    plan_next_period = models.TextField(
        blank=True,
        help_text='Kế hoạch kỳ tiếp theo'
    )

    # Số liệu
    tasks_completed = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    hours_worked = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Phản hồi từ quản lý
    manager_feedback = models.TextField(blank=True)
    manager_reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_reports'
    )
    manager_reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_end']
        unique_together = ['employee', 'report_type', 'period_start']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.report_type} ({self.period_start} to {self.period_end})"


class Plan(models.Model):
    """
    Multi-scale planning: daily/weekly/monthly/yearly plans
    """
    PLAN_TYPE_CHOICES = [
        ('daily', 'Daily Plan'),
        ('weekly', 'Weekly Plan'),
        ('monthly', 'Monthly Plan'),
        ('quarterly', 'Quarterly Plan'),
        ('yearly', 'Yearly Plan'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    # Core fields
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='plans'
    )
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES)
    period_start = models.DateField(help_text='Start date of planning period')
    period_end = models.DateField(help_text='End date of planning period')

    # Content
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, help_text='Overview/context for this plan')

    # Progress tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    completion_percentage = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Manager review
    manager_feedback = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_plans'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    # Hierarchy (optional parent-child)
    parent_plan = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_plans',
        help_text='Optional parent plan (e.g., monthly plan can have weekly child plans)'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-period_start', 'plan_type']
        indexes = [
            models.Index(fields=['user', 'plan_type', 'period_start']),
        ]

    def __str__(self):
        return f"{self.get_plan_type_display()} - {self.user.get_full_name()} ({self.period_start})"

    @property
    def is_active_period(self):
        """Check if plan is within its active period"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.period_start <= today <= self.period_end

    @property
    def total_goals(self):
        return self.goals.count()

    @property
    def completed_goals(self):
        return self.goals.filter(is_completed=True).count()

    def auto_calculate_completion(self):
        """Auto-calculate completion percentage from goals"""
        total = self.total_goals
        if total > 0:
            completed = self.completed_goals
            self.completion_percentage = int((completed / total) * 100)
            self.save()


class PlanGoal(models.Model):
    """
    Individual goals/objectives within a plan
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        related_name='goals'
    )

    # Goal details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')

    # Tracking
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress_notes = models.TextField(blank=True, help_text='Notes on progress')

    # Integration
    related_task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='plan_goals',
        help_text='Optional link to project task'
    )
    related_project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='plan_goals',
        help_text='Optional link to project'
    )

    # Order
    order = models.IntegerField(default=0, help_text='Display order')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.title} ({'✓' if self.is_completed else '○'})"

    def mark_completed(self):
        """Mark goal as completed"""
        from django.utils import timezone
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()
        # Update parent plan completion
        self.plan.auto_calculate_completion()


class PlanNote(models.Model):
    """
    Reflective notes and updates for plans
    """
    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        related_name='notes'
    )

    note = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='plan_notes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note by {self.created_by.username} on {self.created_at.strftime('%Y-%m-%d')}"


class PlanDailyProgress(models.Model):
    """
    Daily progress tracking for plans
    Tracks what was completed each day
    """
    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        related_name='daily_progress'
    )
    date = models.DateField(help_text='Date of progress entry')

    # Progress metrics
    completed_goals_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Goals completed on this day'
    )
    hours_worked = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Hours spent on plan this day'
    )
    progress_notes = models.TextField(
        blank=True,
        help_text='Notes about today\'s progress'
    )
    work_results = models.TextField(
        blank=True,
        help_text='Key outcomes/deliverables completed today'
    )
    blockers = models.TextField(
        blank=True,
        help_text='Issues/blockers encountered today'
    )
    next_plan = models.TextField(
        blank=True,
        help_text='Next steps planned for upcoming work'
    )
    completion_percentage_snapshot = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Plan completion % at end of day'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['plan', 'date']
        indexes = [
            models.Index(fields=['plan', '-date']),
        ]
        verbose_name = 'Plan Daily Progress'
        verbose_name_plural = 'Plan Daily Progress Entries'

    def __str__(self):
        return f"{self.plan.title} - {self.date.strftime('%Y-%m-%d')} ({self.completion_percentage_snapshot}%)"


class PlanUpdateHistory(models.Model):
    """
    Audit trail for all plan changes
    Tracks who changed what and when
    """
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('status_changed', 'Status Changed'),
        ('goal_added', 'Goal Added'),
        ('goal_completed', 'Goal Completed'),
        ('reviewed', 'Reviewed by Manager'),
    ]

    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        related_name='update_history'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='plan_changes'
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    # Store changes as JSON
    previous_values = models.JSONField(
        null=True,
        blank=True,
        help_text='Previous state before change'
    )
    current_values = models.JSONField(
        null=True,
        blank=True,
        help_text='New state after change'
    )
    change_description = models.TextField(
        blank=True,
        help_text='Human-readable description of change'
    )

    # Metadata
    class Meta:
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['plan', '-changed_at']),
        ]
        verbose_name = 'Plan Update History'
        verbose_name_plural = 'Plan Update Histories'

    def __str__(self):
        user_name = self.changed_by.username if self.changed_by else 'System'
        return f"{self.plan.title} - {self.action} by {user_name} at {self.changed_at.strftime('%Y-%m-%d %H:%M')}"
