from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_alter_user_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='bank_account_holder',
            field=models.CharField(blank=True, help_text='Tên chủ tài khoản', max_length=150),
        ),
        migrations.AddField(
            model_name='user',
            name='bank_account_number',
            field=models.CharField(blank=True, help_text='Số tài khoản ngân hàng', max_length=50),
        ),
        migrations.AddField(
            model_name='user',
            name='bank_branch',
            field=models.CharField(blank=True, help_text='Chi nhánh ngân hàng', max_length=150),
        ),
        migrations.AddField(
            model_name='user',
            name='bank_name',
            field=models.CharField(blank=True, help_text='Tên ngân hàng', max_length=150),
        ),
    ]
