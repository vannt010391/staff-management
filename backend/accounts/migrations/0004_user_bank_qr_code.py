from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_bank_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='bank_qr_code',
            field=models.ImageField(blank=True, help_text='Mã QR tài khoản ngân hàng', null=True, upload_to='bank_qr_codes/'),
        ),
    ]
