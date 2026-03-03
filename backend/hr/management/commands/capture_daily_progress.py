from datetime import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from hr.models import Plan, PlanDailyProgress
from hr.services import build_daily_progress_snapshot


class Command(BaseCommand):
    help = 'Auto-capture daily plan progress from goals/tasks/notes for active plans.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Target date in YYYY-MM-DD format. Default: today (local time).',
        )

    def handle(self, *args, **options):
        date_arg = options.get('date')
        if date_arg:
            try:
                target_date = datetime.strptime(date_arg, '%Y-%m-%d').date()
            except ValueError:
                self.stderr.write(self.style.ERROR('Invalid --date format. Use YYYY-MM-DD'))
                return
        else:
            target_date = timezone.localdate()

        plans = Plan.objects.filter(
            status='active',
            period_start__lte=target_date,
            period_end__gte=target_date,
        )

        created_count = 0
        updated_count = 0

        for plan in plans:
            existing = PlanDailyProgress.objects.filter(plan=plan, date=target_date).first()
            manual_inputs = {
                'hours_worked': existing.hours_worked if existing else 0,
                'blockers': existing.blockers if existing else '',
                'next_plan': existing.next_plan if existing else '',
                'work_results': existing.work_results if existing else '',
            }
            snapshot = build_daily_progress_snapshot(plan, target_date, manual_inputs=manual_inputs)

            progress, created = PlanDailyProgress.objects.get_or_create(
                plan=plan,
                date=target_date,
                defaults={
                    'completed_goals_count': snapshot['completed_goals_count'],
                    'hours_worked': snapshot['hours_worked'],
                    'progress_notes': snapshot['progress_notes'],
                    'work_results': snapshot['work_results'],
                    'blockers': snapshot['blockers'],
                    'next_plan': snapshot['next_plan'],
                    'completion_percentage_snapshot': snapshot['completion_percentage_snapshot'],
                },
            )

            if created:
                created_count += 1
            else:
                progress.completed_goals_count = snapshot['completed_goals_count']
                progress.progress_notes = snapshot['progress_notes']
                progress.work_results = snapshot['work_results']
                progress.completion_percentage_snapshot = snapshot['completion_percentage_snapshot']
                progress.save(update_fields=[
                    'completed_goals_count',
                    'progress_notes',
                    'work_results',
                    'completion_percentage_snapshot',
                    'updated_at',
                ])
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Captured daily progress for {target_date}: created={created_count}, updated={updated_count}, plans={plans.count()}'
            )
        )
