from django.apps import apps
from django.db.models import Q

from .models import PlanGoal, PlanNote


def _truncate_text(text, max_length=140):
    if not text:
        return ''
    if len(text) <= max_length:
        return text
    return f"{text[:max_length].rstrip()}..."


def build_daily_progress_snapshot(plan, target_date, manual_inputs=None):
    """Build automatic daily progress summary from goals/tasks/notes for one plan and date."""
    manual_inputs = manual_inputs or {}

    completed_goals_qs = PlanGoal.objects.filter(
        plan=plan,
        is_completed=True,
        completed_at__date=target_date,
    ).order_by('completed_at')
    completed_goal_titles = list(completed_goals_qs.values_list('title', flat=True))

    notes_qs = PlanNote.objects.filter(
        plan=plan,
        created_at__date=target_date,
    ).order_by('-created_at')

    Task = apps.get_model('tasks', 'Task')
    linked_tasks_qs = Task.objects.filter(plan_goals__plan=plan).distinct()

    completed_tasks_qs = linked_tasks_qs.filter(
        Q(completed_at__date=target_date)
        | (Q(status__in=['approved', 'completed']) & Q(updated_at__date=target_date))
    )
    completed_task_titles = list(completed_tasks_qs.values_list('title', flat=True)[:10])

    updated_tasks_qs = linked_tasks_qs.filter(updated_at__date=target_date)
    updated_task_titles = list(updated_tasks_qs.values_list('title', flat=True)[:10])

    note_texts = [_truncate_text(note.note, 120) for note in notes_qs[:5] if note.note]

    result_lines = []
    result_lines.append(f"Completed goals today: {len(completed_goal_titles)}")
    if completed_goal_titles:
        result_lines.append("Goals: " + ", ".join(completed_goal_titles[:8]))

    result_lines.append(f"Completed/approved linked tasks today: {len(completed_task_titles)}")
    if completed_task_titles:
        result_lines.append("Tasks done: " + ", ".join(completed_task_titles[:8]))

    result_lines.append(f"Plan notes added today: {notes_qs.count()}")
    if note_texts:
        result_lines.append("Highlights: " + " | ".join(note_texts[:3]))

    auto_progress_notes = "\n".join(result_lines)

    auto_work_result_parts = []
    if completed_goal_titles:
        auto_work_result_parts.append(f"Goals finished: {', '.join(completed_goal_titles[:5])}")
    if completed_task_titles:
        auto_work_result_parts.append(f"Tasks done: {', '.join(completed_task_titles[:5])}")
    if not auto_work_result_parts:
        auto_work_result_parts.append('No explicit goal/task completion recorded today.')

    auto_work_results = "\n".join(auto_work_result_parts)

    return {
        'completed_goals_count': len(completed_goal_titles),
        'completion_percentage_snapshot': plan.completion_percentage,
        'progress_notes': auto_progress_notes,
        'work_results': auto_work_results,
        'blockers': manual_inputs.get('blockers', ''),
        'next_plan': manual_inputs.get('next_plan', ''),
        'hours_worked': manual_inputs.get('hours_worked', 0),
        'meta': {
            'completed_goal_titles': completed_goal_titles[:20],
            'completed_task_titles': completed_task_titles[:20],
            'updated_task_titles': updated_task_titles[:20],
            'note_count': notes_qs.count(),
        },
    }
