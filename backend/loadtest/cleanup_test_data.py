# ================================================================
#  IIAP UploadFiles - Load Test Data Cleanup
#
#  HOW TO RUN (from backend folder):
#    cd S:/UploadFiles/backend
#    python loadtest/cleanup_test_data.py
#
#  Removes all LT* users, their file DB records,
#  and the uploaded files from disk.
# ================================================================

import os
import sys

THIS_FILE = os.path.abspath(__file__)
LOADTEST  = os.path.dirname(THIS_FILE)
BACKEND   = os.path.dirname(LOADTEST)

sys.path.insert(0, BACKEND)

env_path = os.path.join(BACKEND, '.env')
if os.path.exists(env_path):
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, val = line.partition('=')
            os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

import django
django.setup()

from django.conf import settings
from users.models import User, FileUpload  # noqa

RED   = '\033[91m'
GREEN = '\033[92m'
BLUE  = '\033[94m'
BOLD  = '\033[1m'
RESET = '\033[0m'

def log(sym, color, msg):
    print(color + sym + '  ' + msg + RESET)

def section(title):
    print()
    print(BOLD + BLUE + '-' * 55 + RESET)
    print(BOLD + BLUE + '  ' + title + RESET)
    print(BOLD + BLUE + '-' * 55 + RESET)


# ── STEP 1: Delete files from disk ────────────────────────────
section('STEP 1: Removing uploaded files from disk')

lt_files     = FileUpload.objects.filter(user__user_id__startswith='LT').select_related('user')
media_root   = getattr(settings, 'MEDIA_ROOT', os.path.join(BACKEND, 'media'))
disk_deleted = 0
disk_missing = 0

for record in lt_files:
    # file_path is stored as relative path e.g. uploads/Lab-A/LTCAND001/...
    rel_path = record.file_path
    if not rel_path:
        continue
    # Normalize separators (Windows backslash fix)
    rel_path = rel_path.replace('\\', '/')
    abs_path = os.path.join(media_root, rel_path)
    if os.path.exists(abs_path):
        try:
            os.remove(abs_path)
            disk_deleted += 1
        except OSError as exc:
            log('!', RED, 'Could not delete ' + abs_path + ': ' + str(exc))
    else:
        disk_missing += 1

log('✓', GREEN, 'Files removed from disk : ' + str(disk_deleted))
if disk_missing:
    log('-', RED, 'Already missing on disk : ' + str(disk_missing))


# ── STEP 2: Delete DB records ─────────────────────────────────
section('STEP 2: Removing database records')

file_count, _ = FileUpload.objects.filter(user__user_id__startswith='LT').delete()
user_count, _ = User.objects.filter(user_id__startswith='LT').delete()

log('✓', GREEN, 'File records deleted    : ' + str(file_count))
log('✓', GREEN, 'Users deleted           : ' + str(user_count))


# ── Done ──────────────────────────────────────────────────────
section('CLEANUP COMPLETE')
print()
print(BOLD + GREEN + '  All LT* test data has been removed.' + RESET)
print('  Run seed_test_data.py again before the next load test.')
print()