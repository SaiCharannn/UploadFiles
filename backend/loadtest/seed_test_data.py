# ================================================================
#  IIAP UploadFiles - Load Test Data Seeder
#  HOW TO RUN (from backend folder):
#    cd S:/UploadFiles/backend
#    python loadtest/seed_test_data.py
#
#  Creates:
#    1  SuperAdmin : LTADMIN01
#    5  Staff      : LTSTAFF01 to LTSTAFF05
#    50 Candidates : LTCAND001 to LTCAND050  (Lab-A)
#    All passwords : Test@1234      
# ================================================================

import os
import sys

# --- Find backend/ directory ---
# This file is at backend/loadtest/seed_test_data.py
# So backend/ is exactly one level up from loadtest/
THIS_FILE = os.path.abspath(__file__)
LOADTEST  = os.path.dirname(THIS_FILE)   # backend/loadtest/
BACKEND   = os.path.dirname(LOADTEST)    # backend/

print("Backend folder : " + BACKEND)

if not os.path.isfile(os.path.join(BACKEND, 'manage.py')):
    print("")
    print("ERROR: manage.py not found in: " + BACKEND)
    print("Run this script from the backend folder:")
    print("  cd UploadFiles/backend")
    print("  python loadtest/seed_test_data.py")
    sys.exit(1)

# --- Add backend/ to Python path ---
sys.path.insert(0, BACKEND)

# --- Read .env file manually ---
env_path = os.path.join(BACKEND, '.env')
if os.path.exists(env_path):
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, val = line.partition('=')
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            os.environ.setdefault(key, val)
    print(".env loaded    : OK")
else:
    print("WARNING: .env not found at: " + env_path)

# --- Set Django settings ---
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

# --- Check decouple is installed ---
try:
    import decouple  # noqa
except ModuleNotFoundError:
    print("")
    print("ERROR: python-decouple is not installed.")
    print("Fix:  pip install python-decouple")
    sys.exit(1)

# --- Setup Django ---
import django
try:
    django.setup()
    print("Django ready   : OK")
    print("")
except Exception as e:
    print("")
    print("ERROR: Django setup failed: " + str(e))
    print("Check your .env file has correct DB_NAME, DB_USER, DB_PASSWORD.")
    sys.exit(1)

# --- Import model after django.setup() ---
from users.models import User  # noqa

PASSWORD = 'Test@1234'
LAB      = 'Lab-A'
created  = 0
skipped  = 0


def make(uid, name, role, lab=None):
    global created, skipped
    if User.objects.filter(user_id=uid).exists():
        print("  SKIP   " + uid + " (already exists)")
        skipped += 1
        return
    User.objects.create_user(
        user_id=uid,
        password=PASSWORD,
        name=name,
        role=role,
        lab=lab,
        created_by='LOADTEST_SEEDER',
    )
    print("  CREATE " + role.ljust(12) + " " + uid)
    created += 1


print("=== Creating load test users ===")
print("")

make('LTADMIN01', 'LT Admin', 'SuperAdmin')

for i in range(1, 6):
    make('LTSTAFF{:02d}'.format(i), 'LT Staff {}'.format(i), 'Staff')

for i in range(1, 51):
    make('LTCAND{:03d}'.format(i), 'LT Candidate {}'.format(i), 'Candidate', lab=LAB)

print("")
print("Done.  Created: {}   Skipped: {}".format(created, skipped))
print("All passwords : " + PASSWORD)
print("Lab assigned  : " + LAB)
