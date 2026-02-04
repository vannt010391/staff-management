from rest_framework import serializers
from .models import TaskReview, ReviewCriteria
from projects.models import DesignRule


class ReviewCriteriaSerializer(serializers.ModelSerializer):
    """Serializer for ReviewCriteria"""
    design_rule_name = serializers.CharField(source='design_rule.name', read_only=True)
    design_rule_category = serializers.CharField(
        source='design_rule.get_category_display',
        read_only=True
    )

    class Meta:
        model = ReviewCriteria
        fields = [
            'id', 'review', 'design_rule', 'design_rule_name',
            'design_rule_category', 'is_met', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TaskReviewListSerializer(serializers.ModelSerializer):
    """Serializer for listing task reviews"""
    task_title = serializers.CharField(source='task.title', read_only=True)
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    overall_status_display = serializers.CharField(
        source='get_overall_status_display',
        read_only=True
    )
    total_criteria = serializers.IntegerField(read_only=True)
    met_criteria = serializers.IntegerField(read_only=True)
    criteria_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = TaskReview
        fields = [
            'id', 'task', 'task_title', 'reviewer', 'reviewer_username',
            'overall_status', 'overall_status_display', 'comment',
            'total_criteria', 'met_criteria', 'criteria_percentage',
            'reviewed_at'
        ]
        read_only_fields = ['id', 'reviewer', 'reviewed_at']


class TaskReviewDetailSerializer(serializers.ModelSerializer):
    """Serializer for task review detail with all criteria"""
    task_title = serializers.CharField(source='task.title', read_only=True)
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    overall_status_display = serializers.CharField(
        source='get_overall_status_display',
        read_only=True
    )
    criteria = ReviewCriteriaSerializer(many=True, read_only=True)
    total_criteria = serializers.IntegerField(read_only=True)
    met_criteria = serializers.IntegerField(read_only=True)
    criteria_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = TaskReview
        fields = [
            'id', 'task', 'task_title', 'reviewer', 'reviewer_username',
            'overall_status', 'overall_status_display', 'comment',
            'criteria', 'total_criteria', 'met_criteria', 'criteria_percentage',
            'reviewed_at'
        ]
        read_only_fields = ['id', 'reviewer', 'reviewed_at']


class TaskReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating task review"""
    criteria_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        help_text="List of criteria with design_rule, is_met, and comment"
    )

    class Meta:
        model = TaskReview
        fields = ['task', 'overall_status', 'comment', 'criteria_data']

    def validate_criteria_data(self, value):
        """Validate criteria data structure"""
        if not value:
            raise serializers.ValidationError("At least one criterion is required.")

        for item in value:
            if 'design_rule' not in item or 'is_met' not in item:
                raise serializers.ValidationError(
                    "Each criterion must have 'design_rule' and 'is_met' fields."
                )

        return value

    def create(self, validated_data):
        """Create review with criteria"""
        criteria_data = validated_data.pop('criteria_data')
        validated_data['reviewer'] = self.context['request'].user

        # Create review
        review = TaskReview.objects.create(**validated_data)

        # Create criteria
        for criterion_data in criteria_data:
            ReviewCriteria.objects.create(
                review=review,
                design_rule_id=criterion_data['design_rule'],
                is_met=criterion_data['is_met'],
                comment=criterion_data.get('comment', '')
            )

        # Update task status based on review result
        task = review.task
        if review.overall_status == 'approved':
            task.status = 'approved'
        elif review.overall_status == 'rejected':
            task.status = 'rejected'
        task.save()

        # TODO: Create notification for freelancer

        return review


class TaskReviewUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating task review"""

    class Meta:
        model = TaskReview
        fields = ['overall_status', 'comment']

    def update(self, instance, validated_data):
        """Update review and task status"""
        instance = super().update(instance, validated_data)

        # Update task status
        task = instance.task
        if instance.overall_status == 'approved':
            task.status = 'approved'
        elif instance.overall_status == 'rejected':
            task.status = 'rejected'
        task.save()

        return instance
