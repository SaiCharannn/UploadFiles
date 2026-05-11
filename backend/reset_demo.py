# ================================================================
#  UploadFiles — Demo Reset Script
#  Clears ALL data from the database and disk.
#  Does NOT create any users — use your separate admin/staff/
#  candidate creation scripts after running this.
#
#  HOW TO RUN (from backend/ folder):
#    cd S:/UploadFiles/backend
#    python reset_demo.py
#
#  WHAT IT DOES:
#    1. Deletes ALL uploaded files from disk  (media/uploads/)
#    2. Truncates ALL database tables:
#         file_uploads, bulk_upload_logs,
#         JWT token blacklist, users
#
#  After running:
#    Use your SuperAdmin creation script to set up the first admin.
#    Then log in and bulk-upload staff / candidate Excel files.
# ================================================================

import os
import sys
import shutil

# ── Bootstrap Django ─────────────────────────────────────────
THIS_FILE = os.path.abspath(__file__)
BACKEND   = os.path.dirname(THIS_FILE)
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

from django.db import connection

# ── Colours ──────────────────────────────────────────────────
RED    = '\033[91m'
GREEN  = '\033[92m'
YELLOW = '\033[93m'
BLUE   = '\033[94m'
BOLD   = '\033[1m'
RESET  = '\033[0m'

def log(symbol, color, message):
    print(color + symbol + '  ' + message + RESET)

def section(title):
    print()
    print(BOLD + BLUE + '─' * 55 + RESET)
    print(BOLD + BLUE + '  ' + title + RESET)
    print(BOLD + BLUE + '─' * 55 + RESET)


# ── STEP 0: Confirm ──────────────────────────────────────────
print()
print(BOLD + RED + '  !! WARNING: This will DELETE all data !!' + RESET)
print('  All users, uploaded files, and logs will be wiped.')
print('  No demo users will be created — run your separate')
print('  admin creation script after this.')
print()
confirm = input('  Type  YES  to continue: ').strip()
if confirm != 'YES':
    print()
    log('✗', RED, 'Cancelled. Nothing was changed.')
    sys.exit(0)


# ── STEP 1: Delete uploaded files from disk ──────────────────
section('STEP 1: Clearing uploaded files from disk')

media_uploads = os.path.join(BACKEND, 'media', 'uploads')
if os.path.exists(media_uploads):
    shutil.rmtree(media_uploads)
    os.makedirs(media_uploads, exist_ok=True)
    log('✓', GREEN, 'media/uploads/ cleared')
else:
    os.makedirs(media_uploads, exist_ok=True)
    log('✓', GREEN, 'media/uploads/ created (was empty)')


# ── STEP 2: Truncate all tables ───────────────────────────────
section('STEP 2: Clearing database tables')

with connection.cursor() as cur:
    cur.execute('TRUNCATE TABLE file_uploads, bulk_upload_logs RESTART IDENTITY CASCADE;')
    cur.execute('TRUNCATE TABLE token_blacklist_blacklistedtoken RESTART IDENTITY CASCADE;')
    cur.execute('TRUNCATE TABLE token_blacklist_outstandingtoken  RESTART IDENTITY CASCADE;')
    cur.execute('DELETE FROM users;')

log('✓', GREEN, 'file_uploads          cleared')
log('✓', GREEN, 'bulk_upload_logs      cleared')
log('✓', GREEN, 'JWT token blacklist   cleared')
log('✓', GREEN, 'users                 cleared')


# ── Done ─────────────────────────────────────────────────────
section('RESET COMPLETE')

print()
print(BOLD + '  Database is now empty. Next steps:' + RESET)
print()
print('  1. Run your SuperAdmin creation script to create ADMIN001.')
print('  2. Log in as SuperAdmin and bulk-upload  staff_users.xlsx')
print('     to create the 5 Staff accounts.')
print('  3. Log in as Staff and bulk-upload  candidate_users.xlsx')
print('     to create the 10 Candidate accounts.')
print()
print(BOLD + GREEN + '  Ready. No data currently in the system.' + RESET)
print()