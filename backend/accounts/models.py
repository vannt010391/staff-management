from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model với 5 vai trò: Admin, Manager, Team Lead, Staff, Freelancer
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('team_lead', 'Team Lead'),
        ('staff', 'Staff'),
        ('freelancer', 'Freelancer'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='freelancer',
        help_text='Vai trò của người dùng trong hệ thống'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text='Số điện thoại liên hệ'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text='Ảnh đại diện'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        """Check if user is admin"""
        return self.role == 'admin' or self.is_superuser

    @property
    def is_manager(self):
        """Check if user is manager"""
        return self.role == 'manager'

    @property
    def is_team_lead(self):
        """Check if user is team lead"""
        return self.role == 'team_lead'

    @property
    def is_staff_role(self):
        """Check if user is staff (renamed to avoid conflict with Django's is_staff)"""
        return self.role == 'staff'

    @property
    def is_freelancer(self):
        """Check if user is freelancer"""
        return self.role == 'freelancer'

    @property
    def can_manage_projects(self):
        """Check if user can create/edit projects (Admin, Manager)"""
        return self.is_admin or self.is_manager

    @property
    def can_delete_projects(self):
        """Check if user can delete projects (Admin only)"""
        return self.is_admin

    @property
    def can_create_tasks(self):
        """Check if user can create tasks (Admin, Manager, Team Lead, Staff)"""
        return self.is_admin or self.is_manager or self.is_team_lead or self.is_staff_role

    @property
    def can_assign_tasks(self):
        """Check if user can assign tasks (Admin, Manager, Team Lead, Staff)"""
        return self.is_admin or self.is_manager or self.is_team_lead or self.is_staff_role

    @property
    def can_assign_to_all(self):
        """Check if user can assign tasks to anyone (Admin, Manager, Team Lead only)"""
        return self.is_admin or self.is_manager or self.is_team_lead

    @property
    def can_review_tasks(self):
        """Check if user can review and approve tasks (Admin, Manager, Team Lead, Staff)"""
        return self.is_admin or self.is_manager or self.is_team_lead or self.is_staff_role

    @property
    def can_delete_tasks(self):
        """Check if user can delete tasks (Admin only)"""
        return self.is_admin

    @property
    def can_view_all_tasks(self):
        """Check if user can view all tasks (Admin, Manager, Team Lead, Staff)"""
        return self.is_admin or self.is_manager or self.is_team_lead or self.is_staff_role

    @property
    def can_manage_users(self):
        """Check if user can create/edit users (Admin, Manager)"""
        return self.is_admin or self.is_manager

    @property
    def can_delete_users(self):
        """Check if user can delete users (Admin only)"""
        return self.is_admin
