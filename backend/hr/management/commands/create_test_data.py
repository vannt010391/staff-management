from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import timedelta, date
from decimal import Decimal
import random
from hr.models import Department, CareerPath, Employee, Plan, PlanGoal
User = get_user_model()
class Command(BaseCommand):
    help = "Seeds test data"
    def handle(self, *args, **options):
        self.stdout.write("Creating test data...")
        paths = [("junior", 0, 15000000, 25000000), ("mid", 2, 25000000, 40000000), ("senior", 4, 40000000, 60000000), ("lead", 7, 60000000, 80000000), ("manager", 10, 80000000, 120000000)]
        for level, years, min_s, max_s in paths:
            CareerPath.objects.get_or_create(level=level, defaults={"min_years_experience": years, "min_salary": Decimal(str(min_s)), "max_salary": Decimal(str(max_s)), "requirements": "Skills", "benefits": "Benefits"})
        self.stdout.write("[OK] Career paths")
        users_data = [("admin", "admin123", "admin", "Admin", "System"), ("john.manager", "password123", "manager", "John", "Smith"), ("sarah.manager", "password123", "manager", "Sarah", "Johnson"), ("mike.lead", "password123", "team_lead", "Mike", "Chen"), ("david.dev", "password123", "staff", "David", "Brown"), ("emma.dev", "password123", "staff", "Emma", "Wilson")]
        for username, pwd, role, first, last in users_data:
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(username=username, password=pwd, email=f"{username}@company.com", first_name=first, last_name=last, role=role)
                user.is_active = True
                if role == "admin": user.is_staff = True; user.is_superuser = True
                user.save()
        self.stdout.write("[OK] Users")
        eng, _ = Department.objects.get_or_create(name="Engineering", defaults={"description": "Dev"})
        eng.manager = User.objects.get(username="john.manager"); eng.save()
        design, _ = Department.objects.get_or_create(name="Design", defaults={"description": "UX"})
        design.manager = User.objects.get(username="sarah.manager"); design.save()
        self.stdout.write("[OK] Departments")
        career_mid = CareerPath.objects.get(level="mid"); career_senior = CareerPath.objects.get(level="senior"); career_lead = CareerPath.objects.get(level="lead"); career_mgr = CareerPath.objects.get(level="manager")
        employees = [("john.manager", "EMP001", eng, career_mgr, 90000000, "Manager"), ("sarah.manager", "EMP002", design, career_mgr, 85000000, "Manager"), ("mike.lead", "EMP003", eng, career_lead, 65000000, "Lead"), ("david.dev", "EMP005", eng, career_senior, 45000000, "Senior"), ("emma.dev", "EMP006", eng, career_mid, 30000000, "Dev")]
        for username, emp_id, dept, career, salary, position in employees:
            user = User.objects.get(username=username)
            Employee.objects.get_or_create(user=user, defaults={"employee_id": emp_id, "department": dept, "career_level": career, "current_salary": Decimal(str(salary)), "position": position, "contract_type": "fulltime", "join_date": date.today() - timedelta(days=365), "is_active": True})
        self.stdout.write("[OK] Employees")
        users = User.objects.filter(role__in=["staff", "team_lead", "manager"])[:4]
        for user in users:
            plan = Plan.objects.create(user=user, plan_type="daily", period_start=date.today(), period_end=date.today(), title=f"{user.first_name} Daily", status="active")
            for i in range(3):
                PlanGoal.objects.create(plan=plan, title=f"Task {i+1}", priority="medium", is_completed=i==0, order=i)
            plan.auto_calculate_completion()
            start = date.today() - timedelta(days=date.today().weekday())
            plan_w = Plan.objects.create(user=user, plan_type="weekly", period_start=start, period_end=start+timedelta(days=6), title=f"{user.first_name} Weekly", status="active")
            for i in range(5):
                PlanGoal.objects.create(plan=plan_w, title=f"Goal {i+1}", priority=["low","medium","high"][i%3], is_completed=random.choice([True,False]), order=i)
            plan_w.auto_calculate_completion()
        self.stdout.write("[OK] Plans")
        self.stdout.write(self.style.SUCCESS("SUCCESS!"))
        self.stdout.write("Admin: admin / admin123")
        self.stdout.write("Manager: john.manager / password123")
        self.stdout.write("Staff: david.dev / password123")
