from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0004_taskcomment_review_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='description',
            field=models.TextField(blank=True, default='', help_text='Mô tả chi tiết task'),
        ),
        migrations.AddField(
            model_name='task',
            name='assignees',
            field=models.ManyToManyField(
                blank=True,
                help_text='Nhân viên được giao task',
                related_name='assignee_tasks',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
