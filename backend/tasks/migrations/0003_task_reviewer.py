from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_alter_task_price'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='reviewer',
            field=models.ForeignKey(
                blank=True,
                help_text='Người phụ trách review task',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='review_tasks',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
