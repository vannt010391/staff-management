"""
Management command to seed test data for the Staff Management System
Usage: python manage.py seed_test_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
import random

from hr.models import (
    Department, CareerPath, Employee, KPI, Evaluation, 
    SalaryReview, PersonalReport, Plan, PlanGoal, PlanNote
)
from projects.models import Project
from tasks.models import Task

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with test data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self.clear_data()

        self.stdout.write(self.style.SUCCESS('Starting to seed test data...'))

        # Create test data
        self.create_career_paths()
        self.create_departments()
        self.create_users()
        self.create_employees()
        self.create_projects()
        self.create_tasks()
        self.create_plans()
        self.create_kpis()
        self.create_evaluations()

        self.stdout.write(self.style.SUCCESS('\n✅ Test data created successfully!'))
        self.print_credentials()

    def clear_data(self):
        """Clear all test data"""
        Plan.objects.all().delete()
        Task.objects.all().delete()
        Project.objects.all().delete()
        Employee.objects.all().delete()
        Department.objects.all().delete()
        CareerPath.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.SUCCESS('✓ Cleared existing data'))

    def create_career_paths(self):
        """Create career path levels"""
        career_paths = [
            {
                'level': 'junior',
                'min_years_experience': 0,
                'min_salary': Decimal('15000000'),
                'max_salary': Decimal('25000000'),
                'requirements': '- Fresh graduate or 0-2 years experience\n- Basic technical skills\n- Eager to learn',
                'benefits': '- Training programs\n- Mentorship\n- Health insurance'
            },
            {
                'level': 'mid',
                'min_years_experience': 2,
                'min_salary': Decimal('25000000'),
                'max_salary': Decimal('40000000'),
                'requirements': '- 2-4 years experience\n- Solid technical skills\n- Can work independently',
                'benefits': '- Annual bonus\n- Health insurance\n- Training budget'
            },
            {
                'level': 'senior',
                'min_years_experience': 4,
                'min_salary': Decimal('40000000'),
                'max_salary': Decimal('60000000'),
                'requirements': '- 4-7 years experience\n- Expert technical skills\n- Leadership abilities',
                'benefits': '- Performance bonus\n- Premium health insurance\n- Conference budget'
            },
            {
                'level': 'lead',
                'min_years_experience': 7,
                'min_salary': Decimal('60000000'),
                'max_salary': Decimal('80000000'),
                'requirements': '- 7+ years experience\n- Team leadership\n- Strategic thinking',
                'benefits': '- High bonus\n- Stock options\n- Flexible working'
            },
            {
                'level': 'manager',
                'min_years_experience': 10,
                'min_salary': Decimal('80000000'),
                'max_salary': Decimal('120000000'),
                'requirements': '- 10+ years experience\n- People management\n- Business acumen',
                'benefits': '- Executive bonus\n- Stock options\n- Company car'
            },
        ]

        for path_data in career_paths:
            CareerPath.objects.get_or_create(**path_data)
        
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(career_paths)} career paths'))

    def create_departments(self):
        """Create departments"""
        dept_data = [
            {'name': 'Engineering', 'description': 'Software development and technical operations'},
            {'name': 'Design', 'description': 'UI/UX design and creative services'},
            {'name': 'Marketing', 'description': 'Marketing and business development'},
            {'name': 'Sales', 'description': 'Sales and customer relations'},
            {'name': 'HR', 'description': 'Human resources and recruitment'},
        ]

        for data in dept_data:
            Department.objects.get_or_create(**data)
        
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(dept_data)} departments'))

    def create_users(self):
        """Create test users with different roles"""
        users_data = [
            # Admin
            {'username': 'admin', 'password': 'admin123', 'email': 'admin@company.com', 
             'first_name': 'Admin', 'last_name': 'System', 'role': 'admin', 'phone': '+84901234567'},
            
            # Managers
            {'username': 'john.manager', 'password': 'password123', 'email': 'john@company.com',
             'first_name': 'John', 'last_name': 'Smith', 'role': 'manager', 'phone': '+84901234568'},
            {'username': 'sarah.manager', 'password': 'password123', 'email': 'sarah@company.com',
             'first_name': 'Sarah', 'last_name': 'Johnson', 'role': 'manager', 'phone': '+84901234569'},
            
            # Team Leads
            {'username': 'mike.lead', 'password': 'password123', 'email': 'mike@company.com',
             'first_name': 'Mike', 'last_name': 'Chen', 'role': 'team_lead', 'phone': '+84901234570'},
            {'username': 'lisa.lead', 'password': 'password123', 'email': 'lisa@company.com',
             'first_name': 'Lisa', 'last_name': 'Wang', 'role': 'team_lead', 'phone': '+84901234571'},
            
            # Staff
            {'username': 'david.dev', 'password': 'password123', 'email': 'david@company.com',
             'first_name': 'David', 'last_name': 'Brown', 'role': 'staff', 'phone': '+84901234572'},
            {'username': 'emma.dev', 'password': 'password123', 'email': 'emma@company.com',
             'first_name': 'Emma', 'last_name'
