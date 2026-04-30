import os, logging
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

import openpyxl

from .models import User, FileUpload, BulkUploadLog
from .serializers import (
    SuperAdminCreateSerializer, LoginSerializer,
    UserSerializer, FileUploadSerializer, FileUploadAdminSerializer,
)
from .permissions import IsSuperAdmin, IsStaffOrSuperAdmin, IsCandidate

logger = logging.getLogger(__name__)

MAX_LOGIN_ATTEMPTS = 3
ALLOWED_EXTENSIONS = {'.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'}
MAX_UPLOAD_BYTES   = 20 * 1024 * 1024  # 20 MB

EXT_TO_TYPE = {
    '.doc': 'Word', '.docx': 'Word',
    '.xls': 'Excel', '.xlsx': 'Excel',
    '.ppt': 'PPT', '.pptx': 'PPT',
}


# ─────────────────────────── helpers ────────────────────────────

def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    refresh['role']    = user.role
    refresh['name']    = user.name
    refresh['user_id'] = user.user_id
    return {
        'refresh': str(refresh),
        'access':  str(refresh.access_token),
    }


def _next_sl_no(user):
    last = FileUpload.objects.filter(user=user).order_by('-sl_no').first()
    return (last.sl_no + 1) if last else 1


# ──────────────────────── Super Admin Setup ──────────────────────

class SuperAdminCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        exists = User.objects.filter(role='SuperAdmin').exists()
        return Response({'exists': exists})


class SuperAdminCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if User.objects.filter(role='SuperAdmin').exists():
            return Response({'error': 'SuperAdmin already exists.'}, status=400)
        ser = SuperAdminCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        user = User.objects.create_user(
            user_id=d['user_id'],
            password=d['password'],
            name=d['name'],
            role='SuperAdmin',
            created_by='SYSTEM',
        )
        logger.info("SuperAdmin created: %s", user.user_id)
        return Response({'message': 'SuperAdmin created successfully.'}, status=201)


# ────────────────────────── Auth ─────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        uid = ser.validated_data['user_id']
        pwd = ser.validated_data['password']

        try:
            user = User.objects.get(user_id=uid)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=401)

        if user.user_status == 'LOCKED':
            return Response({'error': 'Account is locked. Contact administrator.'}, status=403)
        if user.user_status == 'INACTIVE':
            return Response({'error': 'Account is inactive.'}, status=403)

        if not user.check_password(pwd):
            user.failed_attempts += 1
            if user.failed_attempts >= MAX_LOGIN_ATTEMPTS:
                user.user_status = 'LOCKED'
                user.save(update_fields=['failed_attempts', 'user_status'])
                return Response({'error': 'Account locked after too many failed attempts.'}, status=403)
            user.save(update_fields=['failed_attempts'])
            remaining = MAX_LOGIN_ATTEMPTS - user.failed_attempts
            return Response({'error': f'Invalid credentials. {remaining} attempt(s) remaining.'}, status=401)

        user.failed_attempts = 0
        user.save(update_fields=['failed_attempts'])
        tokens = _get_tokens(user)
        return Response({
            **tokens,
            'role':    user.role,
            'name':    user.name,
            'user_id': user.user_id,
            'lab':     user.lab,
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            RefreshToken(request.data.get('refresh')).blacklist()
        except (TokenError, Exception):
            pass
        return Response({'message': 'Logged out.'})


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ──────────────────────── User Management ────────────────────────

class UserListView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request):
        role = request.query_params.get('role')
        qs   = User.objects.exclude(role='SuperAdmin')

        # Staff can only see Candidates
        if request.user.role == 'Staff':
            qs = qs.filter(role='Candidate')
        elif role:
            qs = qs.filter(role=role)

        return Response(UserSerializer(qs, many=True).data)


class BulkUserCreateView(APIView):
    """
    POST multipart/form-data with file=<excel>
    SuperAdmin can create Staff + Candidate.
    Staff can only create Candidate.
    Excel columns: SlNo | UserID | Name | Role | Password | Mobile | Lab | Action
    Actions: ADD, MOD, DEL, INACT, ACT
    """
    permission_classes = [IsStaffOrSuperAdmin]

    def post(self, request):
        f = request.FILES.get('file')
        if not f:
            return Response({'error': 'No file provided.'}, status=400)

        try:
            wb = openpyxl.load_workbook(f, read_only=True, data_only=True)
            ws = wb.active
        except Exception:
            return Response({'error': 'Invalid Excel file.'}, status=400)

        rows        = list(ws.iter_rows(min_row=2, values_only=True))
        success, fail, detail = 0, 0, []
        actor = request.user

        for i, row in enumerate(rows, start=2):
            if not any(row):
                continue
            try:
                _, uid, name, role, pwd, mobile, lab, action = (
                    (row + (None,) * 8)[:8]
                )
                uid    = str(uid or '').strip()
                name   = str(name or '').strip()
                role   = str(role or '').strip()
                action = str(action or 'ADD').strip().upper()
                pwd    = str(pwd or '').strip()
                mobile = str(mobile or '').strip()
                lab    = str(lab or '').strip() or None

                if not uid:
                    raise ValueError("UserID is required.")

                # Permission gate: Staff can only create/manage Candidates
                if actor.role == 'Staff' and role != 'Candidate':
                    raise ValueError("Staff can only manage Candidates.")
                if role not in ('SuperAdmin', 'Staff', 'Candidate'):
                    raise ValueError(f"Invalid role '{role}'.")
                if role == 'SuperAdmin':
                    raise ValueError("Cannot bulk-create SuperAdmin.")

                if action == 'ADD':
                    if User.objects.filter(user_id=uid).exists():
                        raise ValueError(f"UserID '{uid}' already exists.")
                    User.objects.create_user(
                        user_id=uid, password=pwd, name=name,
                        role=role, lab=lab, mobile=mobile,
                        created_by=actor.user_id,
                    )
                elif action == 'MOD':
                    user = User.objects.get(user_id=uid)
                    user.name = name or user.name
                    user.lab  = lab or user.lab
                    if pwd:
                        user.set_password(pwd)
                    user.modified_by = actor.user_id
                    user.save()
                elif action == 'DEL':
                    User.objects.filter(user_id=uid).delete()
                elif action == 'INACT':
                    User.objects.filter(user_id=uid).update(user_status='INACTIVE', modified_by=actor.user_id)
                elif action == 'ACT':
                    User.objects.filter(user_id=uid).update(
                        user_status='ACTIVE', failed_attempts=0, modified_by=actor.user_id
                    )
                else:
                    raise ValueError(f"Unknown action '{action}'.")

                success += 1
                detail.append({'row': i, 'user_id': uid, 'status': 'success', 'action': action})
            except Exception as e:
                fail += 1
                detail.append({'row': i, 'user_id': str((row + (None,)*8)[1] or ''), 'status': 'error', 'message': str(e)})

        BulkUploadLog.objects.create(
            uploaded_by=actor,
            filename=f.name,
            total_rows=success + fail,
            success_count=success,
            fail_count=fail,
            result_detail=detail,
        )

        return Response({
            'total':   success + fail,
            'success': success,
            'fail':    fail,
            'detail':  detail,
        })


class UnlockUserView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def post(self, request, user_id):
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)
        if request.user.role == 'Staff' and user.role != 'Candidate':
            return Response({'error': 'Not authorized.'}, status=403)
        user.user_status    = 'ACTIVE'
        user.failed_attempts = 0
        user.modified_by    = request.user.user_id
        user.save(update_fields=['user_status', 'failed_attempts', 'modified_by', 'modified_datetime'])
        return Response({'message': f'{user_id} unlocked.'})


class ResetPasswordView(APIView):
    permission_classes = [IsStaffOrSuperAdmin]

    def post(self, request, user_id):
        new_pwd = request.data.get('password', '').strip()
        if not new_pwd:
            return Response({'error': 'Password required.'}, status=400)
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)
        if request.user.role == 'Staff' and user.role != 'Candidate':
            return Response({'error': 'Not authorized.'}, status=403)
        user.set_password(new_pwd)
        user.failed_attempts = 0
        user.user_status     = 'ACTIVE'
        user.modified_by     = request.user.user_id
        user.save()
        return Response({'message': 'Password reset successful.'})


# ───────────────────────── File Upload ───────────────────────────

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Candidate: own files. Staff/SuperAdmin: query by user_id or lab."""
        if request.user.role == 'Candidate':
            files = FileUpload.objects.filter(user=request.user).exclude(status='Deleted')
            return Response(FileUploadSerializer(files, many=True).data)

        # Staff / SuperAdmin
        uid = request.query_params.get('user_id')
        lab = request.query_params.get('lab')
        qs  = FileUpload.objects.exclude(status='Deleted').select_related('user')
        if uid:
            qs = qs.filter(user__user_id=uid)
        if lab:
            qs = qs.filter(user__lab=lab)
        return Response(FileUploadAdminSerializer(qs, many=True).data)

    def post(self, request):
        """Candidate uploads a file."""
        if request.user.role not in ('Candidate',):
            return Response({'error': 'Only candidates can upload files.'}, status=403)

        uploaded_file = request.FILES.get('file')
        file_type     = request.data.get('file_type', '').strip()

        if not uploaded_file:
            return Response({'error': 'No file attached.'}, status=400)

        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return Response({'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}, status=400)

        if uploaded_file.size > MAX_UPLOAD_BYTES:
            return Response({'error': 'File exceeds 20 MB limit.'}, status=400)

        # Derive type from extension if not provided
        if file_type not in ('Word', 'Excel', 'PPT'):
            file_type = EXT_TO_TYPE.get(ext, 'Word')

        # LOCK: Block upload if this file type is already Printed by admin
        already_printed = FileUpload.objects.filter(
            user=request.user,
            file_type=file_type,
            status='Printed'
        ).exists()
        if already_printed:
            return Response(
                {'error': f'Your {file_type} file has already been printed by the examiner. You cannot replace it.'},
                status=403
            )

        user  = request.user
        sl_no = _next_sl_no(user)
        ts    = datetime.now().strftime('%Y%m%d%H%M%S')
        # Sanitize lab name: keep URL-safe (no spaces, backslashes)
        lab   = (user.lab or 'NOLAB').replace(' ', '-').replace('\\', '-').replace('/', '-')

        stored_name = f"{user.user_id}_{file_type}_{sl_no:03d}_{ts}{ext}"
        # os.path.join for real filesystem path (safe on Windows too)
        dir_path  = os.path.join(settings.MEDIA_ROOT, 'uploads', lab, user.user_id)
        os.makedirs(dir_path, exist_ok=True)
        full_path = os.path.join(dir_path, stored_name)

        with open(full_path, 'wb') as dest:
            for chunk in uploaded_file.chunks():
                dest.write(chunk)

        # Always use forward slashes for URL — critical on Windows
        rel_path = f"uploads/{lab}/{user.user_id}/{stored_name}"

        record = FileUpload.objects.create(
            user=user,
            original_name=uploaded_file.name,
            stored_name=stored_name,
            file_path=rel_path,
            file_type=file_type,
            file_size=uploaded_file.size,
            sl_no=sl_no,
        )
        return Response(FileUploadSerializer(record).data, status=201)


class FileDeleteView(APIView):
    """Soft-delete: Candidate deletes own file; Staff/SA can delete any.
    Candidates CANNOT delete a file that has status='Printed'.
    """

    def delete(self, request, pk):
        try:
            record = FileUpload.objects.get(pk=pk)
        except FileUpload.DoesNotExist:
            return Response({'error': 'File not found.'}, status=404)

        if request.user.role == 'Candidate':
            # Ownership check
            if record.user != request.user:
                return Response({'error': 'Not authorized.'}, status=403)
            # LOCK: Cannot delete a Printed file
            if record.status == 'Printed':
                return Response(
                    {'error': 'This file has already been printed by the examiner and cannot be deleted.'},
                    status=403
                )

        record.status = 'Deleted'
        record.save(update_fields=['status', 'modified_at'])
        return Response({'message': 'File deleted.'})


# ─────────────────── Admin Print Workflow ────────────────────────

class AdminCandidateFoldersView(APIView):
    """List distinct labs and candidate IDs within each lab."""
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request):
        lab = request.query_params.get('lab')
        if lab:
            candidates = (
                User.objects
                .filter(role='Candidate', lab=lab)
                .values('user_id', 'name', 'lab')
                .order_by('user_id')
            )
            return Response(list(candidates))
        # Return distinct labs
        labs = (
            User.objects
            .filter(role='Candidate')
            .exclude(lab=None)
            .values_list('lab', flat=True)
            .distinct()
            .order_by('lab')
        )
        return Response(list(labs))


class AdminCandidateFilesView(APIView):
    """List all files for a candidate (for admin print view)."""
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request, user_id):
        files = (
            FileUpload.objects
            .filter(user__user_id=user_id)
            .exclude(status='Deleted')
            .select_related('user')
        )
        return Response(FileUploadAdminSerializer(files, many=True).data)


class AdminFilePrintView(APIView):
    """Mark a file as printed."""
    permission_classes = [IsStaffOrSuperAdmin]

    def post(self, request, pk):
        try:
            record = FileUpload.objects.get(pk=pk)
        except FileUpload.DoesNotExist:
            return Response({'error': 'File not found.'}, status=404)

        record.status     = 'Printed'
        record.printed_at = timezone.now()
        record.printed_by = request.user.user_id
        record.save(update_fields=['status', 'printed_at', 'printed_by', 'modified_at'])
        return Response({'message': 'Marked as printed.', 'printed_at': record.printed_at})


class FileDownloadPathView(APIView):
    """Return the server-relative media URL for a file (for admin to open/print)."""
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request, pk):
        try:
            record = FileUpload.objects.get(pk=pk)
        except FileUpload.DoesNotExist:
            return Response({'error': 'File not found.'}, status=404)
        clean_path = record.file_path.replace('\\', '/')
        url = request.build_absolute_uri(settings.MEDIA_URL + clean_path)
        return Response({'url': url, 'original_name': record.original_name})

# ─────────────────── Bulk Upload History ────────────────────────

class BulkUploadLogListView(APIView):
    """Return paginated bulk upload batch history for the current user or all (SuperAdmin)."""
    permission_classes = [IsStaffOrSuperAdmin]

    def get(self, request):
        if request.user.role == 'SuperAdmin':
            logs = BulkUploadLog.objects.all().select_related('uploaded_by')
        else:
            logs = BulkUploadLog.objects.filter(
                uploaded_by=request.user
            ).select_related('uploaded_by')

        data = []
        for log in logs:
            data.append({
                'id':            log.id,
                'filename':      log.filename,
                'uploaded_by':   log.uploaded_by.user_id if log.uploaded_by else '—',
                'uploader_name': log.uploaded_by.name    if log.uploaded_by else '—',
                'total_rows':    log.total_rows,
                'success_count': log.success_count,
                'fail_count':    log.fail_count,
                'uploaded_at':   log.uploaded_at.isoformat(),
                'result_detail': log.result_detail,
            })
        return Response(data)
