from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hr', '0001_initial'),
        ('projects', '0003_project_budget'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='departments',
            field=models.ManyToManyField(
                blank=True,
                help_text='Departments có thể xem dự án này',
                related_name='projects',
                to='hr.department',
            ),
        ),
        migrations.AddField(
            model_name='project',
            name='members',
            field=models.ManyToManyField(
                blank=True,
                help_text='Thành viên cá nhân tham gia dự án',
                related_name='member_projects',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
