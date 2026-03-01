# Generated manually for task comment review criteria fields

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
        ('tasks', '0003_task_reviewer'),
    ]

    operations = [
        migrations.AlterField(
            model_name='taskcomment',
            name='comment',
            field=models.TextField(blank=True, help_text='Nội dung comment'),
        ),
        migrations.AddField(
            model_name='taskcomment',
            name='attachment',
            field=models.FileField(blank=True, help_text='File/hình ảnh đính kèm cho nhận xét', null=True, upload_to='task_comment_attachments/'),
        ),
        migrations.AddField(
            model_name='taskcomment',
            name='design_rule',
            field=models.ForeignKey(blank=True, help_text='Tiêu chí/Design Rule được nhận xét', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='task_comments', to='projects.designrule'),
        ),
        migrations.AddField(
            model_name='taskcomment',
            name='is_passed',
            field=models.BooleanField(blank=True, help_text='Kết quả nhận xét: pass/failed (null nếu comment thường)', null=True),
        ),
    ]
