from django.contrib import admin
from .models import User, FileUpload, BulkUploadLog

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display  = ['user_id', 'name', 'role', 'lab', 'user_status', 'created_datetime']
    list_filter   = ['role', 'user_status']
    search_fields = ['user_id', 'name']

@admin.register(FileUpload)
class FileUploadAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'original_name', 'file_type', 'status', 'uploaded_at']
    list_filter   = ['file_type', 'status']
    search_fields = ['user__user_id', 'original_name']

@admin.register(BulkUploadLog)
class BulkUploadLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'uploaded_by', 'filename', 'total_rows', 'success_count', 'fail_count', 'uploaded_at']
