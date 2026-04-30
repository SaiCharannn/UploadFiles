from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, user_id, password=None, **extra):
        user = self.model(user_id=user_id, **extra)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_id, password=None, **extra):
        extra.setdefault('role', 'SuperAdmin')
        extra.setdefault('user_status', 'ACTIVE')
        return self.create_user(user_id, password, **extra)


class User(AbstractBaseUser):
    ROLE_CHOICES   = [('SuperAdmin', 'SuperAdmin'), ('Staff', 'Staff'), ('Candidate', 'Candidate')]
    STATUS_CHOICES = [('ACTIVE', 'Active'), ('INACTIVE', 'Inactive'), ('LOCKED', 'Locked')]

    user_id           = models.CharField(max_length=20, primary_key=True)
    name              = models.CharField(max_length=100)
    role              = models.CharField(max_length=20, choices=ROLE_CHOICES)
    lab               = models.CharField(max_length=100, null=True, blank=True)
    mobile            = models.CharField(max_length=15, null=True, blank=True)
    created_by        = models.CharField(max_length=20, default='SYSTEM')
    created_datetime  = models.DateTimeField(auto_now_add=True)
    modified_by       = models.CharField(max_length=20, null=True, blank=True)
    modified_datetime = models.DateTimeField(auto_now=True)
    user_status       = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    failed_attempts   = models.IntegerField(default=0)

    USERNAME_FIELD  = 'user_id'
    REQUIRED_FIELDS = ['name']
    objects = UserManager()

    class Meta:
        db_table = 'users'
        indexes  = [
            models.Index(fields=['role']),
            models.Index(fields=['user_status']),
            models.Index(fields=['lab']),
        ]

    def __str__(self):
        return f"{self.user_id} ({self.role})"


class FileUpload(models.Model):
    FILE_TYPE_CHOICES = [('Word', 'Word'), ('Excel', 'Excel'), ('PPT', 'PowerPoint')]
    STATUS_CHOICES    = [('Uploaded', 'Uploaded'), ('Printed', 'Printed'), ('Deleted', 'Deleted')]

    user          = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='uploads',
        to_field='user_id', db_column='user_id'
    )
    original_name = models.CharField(max_length=255)
    stored_name   = models.CharField(max_length=255, unique=True)
    file_path     = models.CharField(max_length=500)
    file_type     = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    file_size     = models.BigIntegerField()
    sl_no         = models.PositiveIntegerField()
    status        = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Uploaded')
    uploaded_at   = models.DateTimeField(auto_now_add=True)
    modified_at   = models.DateTimeField(auto_now=True)
    printed_at    = models.DateTimeField(null=True, blank=True)
    printed_by    = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        db_table = 'file_uploads'
        ordering = ['-uploaded_at']
        indexes  = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['file_type']),
            models.Index(fields=['uploaded_at']),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.original_name}"


class BulkUploadLog(models.Model):
    uploaded_by   = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        to_field='user_id', db_column='uploaded_by'
    )
    filename      = models.CharField(max_length=255)
    total_rows    = models.IntegerField(default=0)
    success_count = models.IntegerField(default=0)
    fail_count    = models.IntegerField(default=0)
    result_detail = models.JSONField(default=list)
    uploaded_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bulk_upload_logs'
        ordering = ['-uploaded_at']
