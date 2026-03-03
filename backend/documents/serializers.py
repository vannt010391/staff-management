from rest_framework import serializers

from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'file', 'file_url', 'external_url',
            'uploaded_by', 'uploaded_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['uploaded_by', 'uploaded_by_name', 'created_at', 'updated_at', 'file_url']

    def get_uploaded_by_name(self, obj):
        if not obj.uploaded_by:
            return None
        return obj.uploaded_by.get_full_name() or obj.uploaded_by.username

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def validate(self, attrs):
        file_obj = attrs.get('file', getattr(self.instance, 'file', None))
        external_url = attrs.get('external_url', getattr(self.instance, 'external_url', ''))

        if not file_obj and not external_url:
            raise serializers.ValidationError('Either file or external_url is required.')

        return attrs
