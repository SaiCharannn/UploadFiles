import re
from rest_framework import serializers
from .models import User, FileUpload, BulkUploadLog

PASSWORD_RE = re.compile(
    r'^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*])[A-Za-z\d@#$%&*]{8,20}$'
)


def validate_password_strength(value):
    if not PASSWORD_RE.match(value):
        raise serializers.ValidationError(
            "Password must be 8-20 chars, include 1 uppercase, 1 number, "
            "and 1 special character (@#$%&*)."
        )
    return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['user_id', 'name', 'role', 'lab', 'mobile',
                  'user_status', 'created_datetime', 'modified_datetime']
        read_only_fields = ['created_datetime', 'modified_datetime']


class SuperAdminCreateSerializer(serializers.Serializer):
    user_id          = serializers.CharField(max_length=20)
    name             = serializers.CharField(max_length=100)
    password         = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data


class LoginSerializer(serializers.Serializer):
    user_id  = serializers.CharField()
    password = serializers.CharField(write_only=True)


class FileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FileUpload
        fields = ['id', 'original_name', 'stored_name', 'file_type',
                  'file_size', 'sl_no', 'status', 'uploaded_at', 'printed_at', 'printed_by']
        read_only_fields = ['id', 'stored_name', 'sl_no', 'uploaded_at',
                            'printed_at', 'printed_by', 'status']


class FileUploadAdminSerializer(serializers.ModelSerializer):
    user_id   = serializers.CharField(source='user.user_id')
    user_name = serializers.CharField(source='user.name')
    lab       = serializers.CharField(source='user.lab')

    class Meta:
        model  = FileUpload
        fields = ['id', 'user_id', 'user_name', 'lab', 'original_name',
                  'file_type', 'file_size', 'sl_no', 'status',
                  'uploaded_at', 'printed_at', 'printed_by']


class BulkUploadLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BulkUploadLog
        fields = '__all__'
