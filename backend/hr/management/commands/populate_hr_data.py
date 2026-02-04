from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from hr.models import Department, CareerPath, Employee, KPI, Evaluation, SalaryReview, PersonalReport

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate HR database with realistic sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting to populate HR data...')

        # Clear existing data (optional - comment out if you want to keep existing data)
        self.stdout.write('Clearing existing data...')
        PersonalReport.objects.all().delete()
        SalaryReview.objects.all().delete()
        Evaluation.objects.all().delete()
        KPI.objects.all().delete()
        Employee.objects.all().delete()
        CareerPath.objects.all().delete()
        Department.objects.all().delete()

        # Create Career Paths
        self.stdout.write('Creating career paths...')
        career_paths = {
            1: CareerPath.objects.create(
                level=1,
                title='Junior Developer',
                min_salary=30000,
                max_salary=50000,
                requirements='- 0-2 years experience\n- Bachelor degree in CS or related field\n- Basic programming skills\n- Willingness to learn',
                benefits='- Health insurance\n- 15 days annual leave\n- Training budget\n- Free lunch'
            ),
            2: CareerPath.objects.create(
                level=2,
                title='Mid-Level Developer',
                min_salary=50000,
                max_salary=80000,
                requirements='- 2-5 years experience\n- Strong programming skills\n- Experience with frameworks\n- Good communication skills',
                benefits='- Health & dental insurance\n- 20 days annual leave\n- Training & conference budget\n- Stock options\n- Gym membership'
            ),
            3: CareerPath.objects.create(
                level=3,
                title='Senior Developer',
                min_salary=80000,
                max_salary=120000,
                requirements='- 5+ years experience\n- Expert programming skills\n- System design expertise\n- Mentorship abilities\n- Leadership potential',
                benefits='- Premium health insurance\n- 25 days annual leave\n- Professional development budget\n- Stock options\n- Remote work flexibility\n- Company car allowance'
            ),
            4: CareerPath.objects.create(
                level=4,
                title='Team Lead',
                min_salary=100000,
                max_salary=150000,
                requirements='- 7+ years experience\n- Proven leadership skills\n- Strategic thinking\n- Project management expertise\n- Strong technical background',
                benefits='- Premium family health insurance\n- 30 days annual leave\n- Education support\n- Performance bonuses\n- Company car\n- Remote work options'
            ),
            5: CareerPath.objects.create(
                level=5,
                title='Engineering Manager',
                min_salary=130000,
                max_salary=200000,
                requirements='- 10+ years experience\n- Team management expertise\n- Business acumen\n- Strategic planning skills\n- Executive presence',
                benefits='- Executive health package\n- Unlimited PTO\n- Executive coaching\n- Significant stock options\n- Company car\n- Flexible work arrangements\n- Retirement matching'
            )
        }
        self.stdout.write(self.style.SUCCESS(f'Created {len(career_paths)} career paths'))

        # Create Users and Departments
        self.stdout.write('Creating users and departments...')

        # Create admin user if not exists
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@company.com',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()

        # Create department managers
        manager_data = [
            ('john.smith', 'john.smith@company.com', 'John', 'Smith'),
            ('sarah.johnson', 'sarah.johnson@company.com', 'Sarah', 'Johnson'),
            ('michael.chen', 'michael.chen@company.com', 'Michael', 'Chen'),
            ('emily.davis', 'emily.davis@company.com', 'Emily', 'Davis'),
            ('david.wilson', 'david.wilson@company.com', 'David', 'Wilson'),
        ]

        managers = []
        for username, email, first, last in manager_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first,
                    'last_name': last,
                    'role': 'manager'
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            managers.append(user)

        # Create Departments
        departments = {
            'engineering': Department.objects.create(
                name='Engineering',
                description='Software development and technical infrastructure',
                manager=managers[0]
            ),
            'marketing': Department.objects.create(
                name='Marketing',
                description='Brand management, digital marketing, and customer acquisition',
                manager=managers[1]
            ),
            'sales': Department.objects.create(
                name='Sales',
                description='Business development and client relationships',
                manager=managers[2]
            ),
            'hr': Department.objects.create(
                name='Human Resources',
                description='Talent acquisition, employee relations, and organizational development',
                manager=managers[3]
            ),
            'finance': Department.objects.create(
                name='Finance',
                description='Financial planning, accounting, and budget management',
                manager=managers[4]
            )
        }
        self.stdout.write(self.style.SUCCESS(f'Created {len(departments)} departments'))

        # Create Staff Users and Employees
        self.stdout.write('Creating employees...')

        employee_data = [
            # Engineering
            ('alice.cooper', 'alice.cooper@company.com', 'Alice', 'Cooper', 'engineering', 3, 95000, 'Backend', '2020-03-15'),
            ('bob.martin', 'bob.martin@company.com', 'Bob', 'Martin', 'engineering', 4, 115000, 'Frontend', '2018-06-01'),
            ('carol.white', 'carol.white@company.com', 'Carol', 'White', 'engineering', 2, 65000, 'QA', '2021-09-20'),
            ('daniel.brown', 'daniel.brown@company.com', 'Daniel', 'Brown', 'engineering', 1, 42000, 'Junior Dev', '2023-01-10'),
            ('eve.taylor', 'eve.taylor@company.com', 'Eve', 'Taylor', 'engineering', 3, 98000, 'DevOps', '2019-11-05'),

            # Marketing
            ('frank.moore', 'frank.moore@company.com', 'Frank', 'Moore', 'marketing', 3, 87000, 'Content Manager', '2020-02-14'),
            ('grace.lee', 'grace.lee@company.com', 'Grace', 'Lee', 'marketing', 2, 58000, 'Social Media', '2021-07-22'),
            ('henry.king', 'henry.king@company.com', 'Henry', 'King', 'marketing', 4, 105000, 'Marketing Lead', '2019-04-18'),

            # Sales
            ('ivy.clark', 'ivy.clark@company.com', 'Ivy', 'Clark', 'sales', 3, 92000, 'Account Executive', '2020-08-30'),
            ('jack.harris', 'jack.harris@company.com', 'Jack', 'Harris', 'sales', 2, 62000, 'Sales Rep', '2022-03-12'),
            ('kate.lewis', 'kate.lewis@company.com', 'Kate', 'Lewis', 'sales', 4, 118000, 'Sales Lead', '2018-10-25'),

            # HR
            ('liam.walker', 'liam.walker@company.com', 'Liam', 'Walker', 'hr', 3, 75000, 'HR Specialist', '2020-05-17'),
            ('mia.hall', 'mia.hall@company.com', 'Mia', 'Hall', 'hr', 2, 55000, 'Recruiter', '2021-11-08'),

            # Finance
            ('noah.allen', 'noah.allen@company.com', 'Noah', 'Allen', 'finance', 3, 88000, 'Financial Analyst', '2019-07-22'),
            ('olivia.young', 'olivia.young@company.com', 'Olivia', 'Young', 'finance', 2, 60000, 'Accountant', '2022-01-15'),
        ]

        employees = []
        for username, email, first, last, dept_key, level, salary, position, hire_date in employee_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first,
                    'last_name': last,
                    'role': 'team_lead' if level >= 4 else 'staff'
                }
            )
            if created:
                user.set_password('password123')
                user.save()

            employee = Employee.objects.create(
                user=user,
                employee_id=f'EMP{1000 + len(employees):04d}',
                department=departments[dept_key],
                position=position,
                career_path=career_paths[level],
                current_salary=salary,
                hire_date=datetime.strptime(hire_date, '%Y-%m-%d').date(),
                status='active'
            )
            employees.append(employee)

        self.stdout.write(self.style.SUCCESS(f'Created {len(employees)} employees'))

        # Create KPI records (last 6 months)
        self.stdout.write('Creating KPI records...')
        kpi_count = 0
        for employee in employees:
            for month_offset in range(6):
                month_date = (timezone.now() - timedelta(days=30 * month_offset)).date()
                period_start = month_date.replace(day=1)
                if period_start.month == 12:
                    period_end = period_start.replace(year=period_start.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    period_end = period_start.replace(month=period_start.month + 1, day=1) - timedelta(days=1)

                # Generate realistic scores based on career level
                import random
                base_score = 70 + (employee.career_path.level * 5)
                quality = min(100, base_score + random.randint(-10, 15))
                productivity = min(100, base_score + random.randint(-10, 15))
                teamwork = min(100, base_score + random.randint(-10, 15))
                innovation = min(100, base_score + random.randint(-15, 20))

                tasks_completed = random.randint(15, 40)
                tasks_on_time = int(tasks_completed * random.uniform(0.75, 0.95))

                KPI.objects.create(
                    employee=employee,
                    period_start=period_start,
                    period_end=period_end,
                    quality_score=quality,
                    productivity_score=productivity,
                    teamwork_score=teamwork,
                    innovation_score=innovation,
                    overall_score=(quality + productivity + teamwork + innovation) / 4,
                    tasks_completed=tasks_completed,
                    tasks_on_time=tasks_on_time,
                    comments=f'Performance evaluation for {period_start.strftime("%B %Y")}',
                    created_by=managers[0]
                )
                kpi_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {kpi_count} KPI records'))

        # Create Performance Evaluations (quarterly)
        self.stdout.write('Creating performance evaluations...')
        eval_count = 0
        ratings = ['outstanding', 'exceeds', 'meets', 'needs_improvement']
        rating_weights = [0.1, 0.3, 0.5, 0.1]  # Most employees meet expectations

        for employee in employees:
            # Create 2 evaluations (6 months apart)
            for quarter_offset in [6, 0]:
                eval_date = (timezone.now() - timedelta(days=30 * quarter_offset)).date()
                period_start = eval_date.replace(day=1)
                period_end = (period_start + timedelta(days=90)).replace(day=1) - timedelta(days=1)

                rating = random.choices(ratings, weights=rating_weights)[0]

                Evaluation.objects.create(
                    employee=employee,
                    evaluator=managers[0],
                    period_type='quarterly',
                    period_start=period_start,
                    period_end=period_end,
                    overall_rating=rating,
                    strengths=f'Strong technical skills, consistent delivery, team player. {employee.user.first_name} demonstrates excellent commitment to quality.',
                    areas_for_improvement='Could improve on communication with stakeholders and time management skills.',
                    achievements=f'Successfully delivered {random.randint(3, 8)} major projects, improved team efficiency by {random.randint(10, 30)}%.',
                    goals_next_period='Focus on leadership development, mentor junior team members, take on more strategic initiatives.',
                    promotion_recommended=(rating == 'outstanding' and random.random() > 0.7),
                    salary_increase_recommended=(rating in ['outstanding', 'exceeds']),
                    recommended_increase_percentage=Decimal('10.5') if rating == 'outstanding' else Decimal('5.5') if rating == 'exceeds' else Decimal('0')
                )
                eval_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {eval_count} evaluations'))

        # Create Salary Reviews
        self.stdout.write('Creating salary reviews...')
        review_statuses = ['pending', 'approved', 'rejected', 'implemented']
        review_count = 0

        for employee in employees:
            # Create 1-2 salary reviews
            num_reviews = random.randint(1, 2)
            for i in range(num_reviews):
                months_ago = 12 if i == 1 else 3
                review_date = (timezone.now() - timedelta(days=30 * months_ago)).date()

                increase_percentage = Decimal(str(random.uniform(3, 15)))
                proposed_salary = employee.current_salary * (1 + increase_percentage / 100)
                status = random.choice(review_statuses)

                review = SalaryReview.objects.create(
                    employee=employee,
                    review_date=review_date,
                    current_salary=employee.current_salary,
                    proposed_salary=proposed_salary,
                    increase_percentage=increase_percentage,
                    justification=f'Based on excellent performance, market research, and increased responsibilities. {employee.user.first_name} has consistently exceeded expectations.',
                    status=status,
                    requested_by=managers[0]
                )

                if status in ['approved', 'implemented']:
                    review.approved_by = admin_user
                    review.approved_at = timezone.now() - timedelta(days=30 * months_ago - 15)
                    review.notes = 'Approved based on performance review and budget availability.'

                    if status == 'implemented':
                        review.implemented_at = timezone.now() - timedelta(days=30 * months_ago - 20)
                        if i == 0:  # Update current salary for most recent implemented review
                            employee.current_salary = proposed_salary
                            employee.save()

                    review.save()
                elif status == 'rejected':
                    review.approved_by = admin_user
                    review.approved_at = timezone.now() - timedelta(days=30 * months_ago - 15)
                    review.notes = 'Salary increase deferred due to budget constraints. Will reconsider in next quarter.'
                    review.save()

                review_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {review_count} salary reviews'))

        # Create Personal Reports
        self.stdout.write('Creating personal reports...')
        report_types = ['weekly', 'monthly', 'quarterly']
        report_count = 0

        for employee in employees:
            # Create multiple reports
            for week in range(8):  # 8 weeks of reports
                report_date = (timezone.now() - timedelta(weeks=week)).date()
                period_start = report_date - timedelta(days=report_date.weekday())
                period_end = period_start + timedelta(days=6)

                report_type = 'weekly' if week < 6 else 'monthly'

                PersonalReport.objects.create(
                    employee=employee,
                    report_type=report_type,
                    period_start=period_start,
                    period_end=period_end,
                    summary=f'Completed assigned tasks and participated in team meetings. Focused on {employee.position} responsibilities and cross-team collaboration.',
                    achievements=f'- Delivered {random.randint(2, 5)} features\n- Fixed {random.randint(3, 10)} bugs\n- Improved system performance\n- Assisted team members',
                    challenges='Minor technical challenges with third-party integrations, resolved through team collaboration.',
                    plans_next_period='Continue with current projects, take on additional responsibilities, focus on code quality improvements.',
                    tasks_completed=random.randint(10, 25),
                    hours_worked=Decimal(str(random.uniform(35, 45)))
                )
                report_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {report_count} personal reports'))

        self.stdout.write(self.style.SUCCESS('✅ Successfully populated HR database with sample data!'))
        self.stdout.write(self.style.SUCCESS(f'''
Summary:
- {len(career_paths)} Career Paths
- {len(departments)} Departments
- {len(employees)} Employees
- {kpi_count} KPI Records
- {eval_count} Evaluations
- {review_count} Salary Reviews
- {report_count} Personal Reports

You can now login with:
- Username: admin / Password: admin123 (Admin)
- Username: john.smith / Password: password123 (Manager)
- Username: alice.cooper / Password: password123 (Staff)
        '''))
