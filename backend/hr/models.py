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
