# ================================================================
#  IIAP UploadFiles - Load Test Data Cleanup
#  HOW TO RUN (from backend folder):
#    cd S:/UploadFiles/backend
#    python loadtest/cleanup_test_data.py
#
#  Deletes all LT* test users and their uploaded files.
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

from users.models import User, FileUpload  # noqa

print("Cleaning up load test data...")
print("")

files = FileUpload.objects.filter(user__user_id__startswith='LT').delete()
users = User.objects.filter(user_id__startswith='LT').delete()

print("  File records deleted : " + str(files[0]))
print("  Users deleted        : " + str(users[0]))
print("")
print("Cleanup complete.")
