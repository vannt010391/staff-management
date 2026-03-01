from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
import random

from hr.models import (
    Department, Employee, Evaluation, KPI, PersonalReport,
    SalaryReview, CareerPath, Plan
)
from projects.models import Project
from tasks.models import Task

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates comprehensive sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating sample data...')

        # Clear existing
        Employee.objects.all().delete()
        Department.objects.all().delete()
        CareerPath.objects.all().delete()
        Plan.objects.all().delete()
        User.objects.exclude(username='admin').delete()

        # Create career levels
        self.stdout.write('Creating career levels...')
        junior = CareerPath.objects.create(
            level='junior', min_years_experience=0, min_salary=30000, max_salary=50000,
            requirements='Basic skills', benefits='Training programs'
        )
        mid = CareerPath.objects.create(
            level='mid', min_years_experience=2, min_salary=50000, max_salary=80000,
            requirements='Strong skills', benefits='Flexible hours'
        )
        senior = CareerPath.objects.create(
            level='senior', min_years_experience=5, min_salary=80000, max_salary=120000,
            requirements='Advanced expertise', benefits='Stock options'
        )
        lead = CareerPath.objects.create(
            level='lead', min_years_experience=7, min_salary=120000, max_salary=150000,
            requirements='Team leadership', benefits='Leadership training'
        )
        manager = CareerPath.objects.create(
            level='manager', min_years_experience=10, min_salary=150000, max_salary=200000,
            requirements='People management', benefits='Executive perks'
        )

        # Get admin
        admin = User.objects.get(username='admin')

        # Create users
        self.stdout.write('Creating users...')
        users_data = [
            ('john.doe', 'John', 'Doe', 'manager'),
            ('jane.smith', 'Jane', 'Smith', 'team_lead'),
            ('mike.wilson', 'Mike', 'Wilson', 'staff'),
            ('sarah.johnson', 'Sarah', 'Johnson', 'staff'),
            ('david.brown', 'David', 'Brown', 'staff'),
        ]

        users = [admin]
        for username, first, last, role in users_data:
            u = User.objects.create(
                username=username, first_name=first, last_name=last,
                email=f'{username}@company.com', role=role, is_active=True
            )
            u.set_password('password123')
            u.save()
            users.append(u)

        # Create departments
        self.stdout.write('Creating departments...')
        depts = []
        for name in ['Engineering', 'Product', 'Design', 'Marketing']:
            d = Department.objects.create(name=name, description=f'{name} department', manager=users[1])
            depts.append(d)

        # Create employees
        self.stdout.write('Creating employees...')
        levels = [junior, mid, senior, lead, manager]
        positions = ['Software Engineer', 'Product Manager', 'UX Designer', 'Marketing Manager', 'DevOps Engineer']
        
        for i, u in enumerate(users[1:6], 1):
            Employee.objects.create(
                user=u, employee_id=f'EMP{i:04d}',
                department=depts[i % len(depts)],
                career_level=levels[i % len(levels)],
                position=positions[i % len(positions)],
                join_date=date.today() - timedelta(days=random.randint(180, 1000)),
                current_salary=Decimal(random.randint(50000, 150000)),
                is_active=True
            )

        self.stdout.write(self.style.SUCCESS('Done!'))
        self.stdout.write(f'Users: {User.objects.count()}, Employees: {Employee.objects.count()}')
