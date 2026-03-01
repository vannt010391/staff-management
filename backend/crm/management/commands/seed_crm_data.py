from django.core.management.base import BaseCommand
from crm.models import CustomerStage, ExpenseType


class Command(BaseCommand):
    help = 'Seed default CRM data (Customer Stages and Expense Types)'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding CRM data...')

        # Default Customer Stages
        stages_data = [
            {
                'name': 'Lead',
                'icon': '🎯',
                'color': 'blue',
                'description': 'Potential customer, initial contact not yet made',
                'order': 1,
                'success_probability': 10,
                'is_system': True,
                'is_final': False,
            },
            {
                'name': 'Contact',
                'icon': '📞',
                'color': 'cyan',
                'description': 'First contact made, exploring needs',
                'order': 2,
                'success_probability': 25,
                'is_system': True,
                'is_final': False,
            },
            {
                'name': 'Qualified',
                'icon': '✅',
                'color': 'green',
                'description': 'Customer qualified as good fit',
                'order': 3,
                'success_probability': 50,
                'is_system': True,
                'is_final': False,
            },
            {
                'name': 'Proposal',
                'icon': '📝',
                'color': 'yellow',
                'description': 'Proposal sent to customer',
                'order': 4,
                'success_probability': 75,
                'is_system': True,
                'is_final': False,
            },
            {
                'name': 'Negotiation',
                'icon': '🤝',
                'color': 'purple',
                'description': 'Negotiating terms and pricing',
                'order': 5,
                'success_probability': 90,
                'is_system': True,
                'is_final': False,
            },
            {
                'name': 'Won',
                'icon': '🎉',
                'color': 'emerald',
                'description': 'Deal closed successfully',
                'order': 6,
                'success_probability': 100,
                'is_system': True,
                'is_final': True,
            },
            {
                'name': 'Lost',
                'icon': '❌',
                'color': 'red',
                'description': 'Deal lost',
                'order': 7,
                'success_probability': 0,
                'is_system': True,
                'is_final': True,
            },
        ]

        created_stages = 0
        for stage_data in stages_data:
            stage, created = CustomerStage.objects.get_or_create(
                name=stage_data['name'],
                defaults=stage_data
            )
            if created:
                created_stages += 1
                self.stdout.write(self.style.SUCCESS(f'  + Created stage: {stage.name}'))
            else:
                self.stdout.write(f'  - Stage already exists: {stage.name}')

        self.stdout.write(self.style.SUCCESS(f'\nCreated {created_stages} new customer stages'))

        # Default Expense Types
        expense_types_data = [
            {
                'name': 'Marketing',
                'icon': '📢',
                'color': 'purple',
                'description': 'Marketing campaigns, ads, promotions',
                'order': 1,
                'is_system': True,
            },
            {
                'name': 'Travel',
                'icon': '✈️',
                'color': 'blue',
                'description': 'Travel expenses (flights, hotels, transport)',
                'order': 2,
                'is_system': True,
            },
            {
                'name': 'Entertainment',
                'icon': '🍽️',
                'color': 'pink',
                'description': 'Client entertainment, dinners, events',
                'order': 3,
                'is_system': True,
            },
            {
                'name': 'Gifts',
                'icon': '🎁',
                'color': 'yellow',
                'description': 'Client gifts, promotional items',
                'order': 4,
                'is_system': True,
            },
            {
                'name': 'Demo/Presentation',
                'icon': '💻',
                'color': 'green',
                'description': 'Product demos, presentations, materials',
                'order': 5,
                'is_system': True,
            },
            {
                'name': 'Consulting',
                'icon': '💼',
                'color': 'indigo',
                'description': 'Consulting fees, professional services',
                'order': 6,
                'is_system': True,
            },
            {
                'name': 'Shipping',
                'icon': '📦',
                'color': 'orange',
                'description': 'Shipping and delivery costs',
                'order': 7,
                'is_system': True,
            },
            {
                'name': 'Meeting/Coffee',
                'icon': '☕',
                'color': 'cyan',
                'description': 'Meeting expenses, coffee, snacks',
                'order': 8,
                'is_system': True,
            },
            {
                'name': 'Advertising',
                'icon': '📺',
                'color': 'red',
                'description': 'Advertising costs (TV, radio, online)',
                'order': 9,
                'is_system': True,
            },
            {
                'name': 'Other',
                'icon': '📝',
                'color': 'gray',
                'description': 'Other miscellaneous expenses',
                'order': 10,
                'is_system': True,
            },
        ]

        created_expense_types = 0
        for expense_type_data in expense_types_data:
            expense_type, created = ExpenseType.objects.get_or_create(
                name=expense_type_data['name'],
                defaults=expense_type_data
            )
            if created:
                created_expense_types += 1
                self.stdout.write(self.style.SUCCESS(f'  + Created expense type: {expense_type.name}'))
            else:
                self.stdout.write(f'  - Expense type already exists: {expense_type.name}')

        self.stdout.write(self.style.SUCCESS(f'\nCreated {created_expense_types} new expense types'))

        self.stdout.write(self.style.SUCCESS('\nCRM data seeding completed!'))
        self.stdout.write(f'Total: {created_stages} stages + {created_expense_types} expense types')
