from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'start_time', 'end_time', 'is_all_day', 'color',
            'user', 'user_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'user_name', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        if not obj.user:
            return None
        return obj.user.get_full_name() or obj.user.username
