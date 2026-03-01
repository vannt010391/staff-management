from .models import Notification


def create_task_assigned_notification(task, assigned_by=None):
    if not task or not task.assigned_to:
        return None

    assigner_name = (
        assigned_by.get_full_name() or assigned_by.username
        if assigned_by
        else 'System'
    )

    return Notification.objects.create(
        recipient=task.assigned_to,
        notification_type='task_assigned',
        title='New task assigned',
        message=f'You have been assigned task: {task.title} by {assigner_name}.',
        task=task,
    )


def create_task_status_changed_notification(task, changed_by=None, old_status=None, new_status=None):
    if not task:
        return None

    actor_name = (
        changed_by.get_full_name() or changed_by.username
        if changed_by
        else 'System'
    )
    old_label = old_status or task.status
    new_label = new_status or task.status

    recipients = set()
    if task.assigned_to:
        recipients.add(task.assigned_to)
    if task.assigned_by:
        recipients.add(task.assigned_by)

    notifications = []
    for recipient in recipients:
        notifications.append(
            Notification.objects.create(
                recipient=recipient,
                notification_type='task_status_changed',
                title='Task status updated',
                message=f'{actor_name} changed task "{task.title}" from {old_label} to {new_label}.',
                task=task,
            )
        )
    return notifications


def create_task_review_completed_notification(task, reviewer=None, overall_status=None):
    if not task or not task.assigned_to:
        return None

    reviewer_name = (
        reviewer.get_full_name() or reviewer.username
        if reviewer
        else 'Manager'
    )
    status_label = overall_status or task.status

    return Notification.objects.create(
        recipient=task.assigned_to,
        notification_type='review_completed',
        title='Task review completed',
        message=(
            f'Your task "{task.title}" has been reviewed by {reviewer_name}. '
            f'Result: {status_label}.'
        ),
        task=task,
    )