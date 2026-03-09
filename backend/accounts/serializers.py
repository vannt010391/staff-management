from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for displaying user information"""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone',
            'bank_name', 'bank_account_number', 'bank_account_holder', 'bank_branch',
            'bank_qr_code',
            'date_of_birth', 'address', 'bio',
            'avatar', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (register)"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'role', 'phone',
            'bank_name', 'bank_account_number', 'bank_account_holder', 'bank_branch',
            'bank_qr_code', 'date_of_birth', 'address', 'bio'
        ]

    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs

    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone',
            'bank_name', 'bank_account_number', 'bank_account_holder', 'bank_branch',
            'bank_qr_code', 'date_of_birth', 'address', 'bio', 'avatar'
        ]


class UserSetPasswordSerializer(serializers.Serializer):
    """Serializer for admin set password per user"""
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        label='Confirm New Password'
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                'new_password': "Password fields didn't match."
            })
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        label='Confirm New Password'
    )

    def validate(self, attrs):
        """Validate that new passwords match"""
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "New password and confirmation password do not match."
            })

        # Validate new password is different from old password
        if attrs.get('old_password') == attrs.get('new_password'):
            raise serializers.ValidationError({
                "new_password": "New password must be different from the current password."
            })

        return attrs

    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect. Please try again.")
        return value

    def save(self, **kwargs):
        """Change user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Authenticate user"""
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(
                request=self.context.get('request'),
                username=username,
                password=password
            )

            if not user:
                raise serializers.ValidationError(
                    "Unable to log in with provided credentials."
                )

            if not user.is_active:
                raise serializers.ValidationError(
                    "User account is disabled."
                )

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                "Must include 'username' and 'password'."
            )
