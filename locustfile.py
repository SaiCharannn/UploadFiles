# ================================================================
# IIAP UploadFiles - Locust Load Test
# locustfile.py lives at: UploadFiles/ (project root)
#
# STEP 1 - Install locust:
#   pip install locust
#
# STEP 2 - Seed test users (run from backend folder):
#   cd UploadFiles/backend
#   python loadtest/seed_test_data.py
#
# STEP 3 - Start Django (keep this terminal open):
#   cd UploadFiles/backend
#   python manage.py runserver
#
# STEP 4 - Run Locust (new terminal, from project root):
#   cd UploadFiles
#   locust -f locustfile.py --host http://localhost:8000
#
# STEP 5 - Open browser and control the test:
#   http://localhost:8089
#
# STEP 6 - After testing, clean up test users:
#   cd UploadFiles/backend
#   python loadtest/cleanup_test_data.py
# ================================================================
import os
import random
from locust import HttpUser, task, between, events, tag
from locust.exception import StopUser

# ── Sample file paths ─────────────────────────────────────────
# locustfile.py is at UploadFiles/ (root)
# sample files are at UploadFiles/backend/loadtest/sample_files/
ROOT        = os.path.dirname(os.path.abspath(__file__))
SAMPLE_DIR  = os.path.join(ROOT, 'backend', 'loadtest', 'sample_files')
SAMPLE_WORD  = os.path.join(SAMPLE_DIR, 'test.docx')
SAMPLE_EXCEL = os.path.join(SAMPLE_DIR, 'test.xlsx')
SAMPLE_PPT   = os.path.join(SAMPLE_DIR, 'test.pptx')

# Verify sample files exist on startup
for fpath in [SAMPLE_WORD, SAMPLE_EXCEL, SAMPLE_PPT]:
    if not os.path.exists(fpath):
        print(f"WARNING: Sample file not found: {fpath}")
        print("Upload tests will skip missing files.")

# ── Test credentials ──────────────────────────────────────────
# Created by backend/loadtest/seed_test_data.py
CANDIDATE_CREDS = [
    {"user_id": f"LTCAND{i:03d}", "password": "Test@1234"}
    for i in range(1, 51)
]
STAFF_CREDS = [
    {"user_id": f"LTSTAFF{i:02d}", "password": "Test@1234"}
    for i in range(1, 6)
]
ADMIN_CREDS = [
    {"user_id": "LTADMIN01", "password": "Test@1234"}
]

LAB_NAME = "Lab-A"


# ── Login helper ──────────────────────────────────────────────
def do_login(client, cred_list):
    """
    Pick a random credential, POST to /api/auth/login/
    Returns (access_token, user_id) or (None, None) on failure.
    """
    cred = random.choice(cred_list)
    with client.post(
        "/api/auth/login/",
        json={"user_id": cred["user_id"], "password": cred["password"]},
        name="POST /api/auth/login/",
        catch_response=True,
    ) as resp:
        if resp.status_code == 200:
            data = resp.json()
            return data.get("access"), data.get("user_id")
        else:
            resp.failure(
                f"Login failed for {cred['user_id']}: "
                f"{resp.status_code} — {resp.text[:100]}"
            )
            return None, None


# ══════════════════════════════════════════════════════════════
# USER CLASS 1: CandidateUser
# Represents exam candidates uploading Word / Excel / PPT files.
# Weight 7 = 70% of all virtual users will be Candidates.
# wait_time between(5, 20) = each candidate waits 5–20 seconds
# between actions (realistic exam pace).
# ══════════════════════════════════════════════════════════════
class CandidateUser(HttpUser):
    weight    = 7
    wait_time = between(5, 20)

    def on_start(self):
        """Login once when this virtual user starts."""
        self.token   = None
        self.user_id = None
        token, uid = do_login(self.client, CANDIDATE_CREDS)
        if not token:
            raise StopUser()
        self.token   = token
        self.user_id = uid
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def on_stop(self):
        """Logout when test ends — blacklists token server-side."""
        if self.token:
            self.client.post(
                "/api/auth/logout/",
                json={"refresh": ""},
                headers=self.headers,
                name="POST /api/auth/logout/ (candidate)",
            )

    @task(3)
    @tag("candidate", "read")
    def view_my_files(self):
        """
        GET own file list.
        Weight 3 = most common action — candidates refresh
        their file list every 2 minutes in the real app.
        """
        self.client.get(
            "/api/files/",
            headers=self.headers,
            name="GET /api/files/ (own list)",
        )

    @task(2)
    @tag("candidate", "upload")
    def upload_word(self):
        """Upload a Word (.docx) file."""
        self._upload(SAMPLE_WORD, "test.docx", "Word")

    @task(2)
    @tag("candidate", "upload")
    def upload_excel(self):
        """Upload an Excel (.xlsx) file."""
        self._upload(SAMPLE_EXCEL, "test.xlsx", "Excel")

    @task(2)
    @tag("candidate", "upload")
    def upload_ppt(self):
        """Upload a PowerPoint (.pptx) file."""
        self._upload(SAMPLE_PPT, "test.pptx", "PPT")

    @task(1)
    @tag("candidate", "read")
    def check_me(self):
        """GET /api/auth/me/ — verify token is still valid."""
        self.client.get(
            "/api/auth/me/",
            headers=self.headers,
            name="GET /api/auth/me/ (candidate)",
        )

    def _upload(self, filepath, filename, file_type):
        """Send multipart file upload to POST /api/files/"""
        if not os.path.exists(filepath):
            return  # skip if sample file is missing
        try:
            with open(filepath, "rb") as f:
                with self.client.post(
                    "/api/files/",
                    files={"file": (filename, f, "application/octet-stream")},
                    data={"file_type": file_type},
                    headers=self.headers,
                    name=f"POST /api/files/ ({file_type})",
                    catch_response=True,
                ) as resp:
                    # 201 = uploaded, 403 = already printed (expected), both OK
                    if resp.status_code in (201, 403):
                        resp.success()
                    else:
                        resp.failure(f"Upload {file_type} failed: {resp.status_code}")
        except OSError:
            pass  # file read error — skip silently


# ══════════════════════════════════════════════════════════════
# USER CLASS 2: StaffUser
# Represents exam invigilators browsing files and printing.
# Weight 2 = 20% of virtual users.
# wait_time between(3, 10) = staff works faster than candidates.
# ══════════════════════════════════════════════════════════════
class StaffUser(HttpUser):
    weight    = 2
    wait_time = between(3, 10)

    def on_start(self):
        self.token        = None
        self.headers      = {}
        self.cand_ids     = []
        token, uid = do_login(self.client, STAFF_CREDS)
        if not token:
            raise StopUser()
        self.token   = token
        self.headers = {"Authorization": f"Bearer {self.token}"}
        # Pre-load candidate IDs so other tasks can use them
        self._load_candidates()

    def on_stop(self):
        if self.token:
            self.client.post(
                "/api/auth/logout/",
                json={"refresh": ""},
                headers=self.headers,
                name="POST /api/auth/logout/ (staff)",
            )

    def _load_candidates(self):
        """Load candidates for Lab-A once at start."""
        try:
            resp = self.client.get(
                f"/api/admin/labs/?lab={LAB_NAME}",
                headers=self.headers,
                name="GET /api/admin/labs/?lab= (init)",
            )
            if resp.status_code == 200:
                self.cand_ids = [c["user_id"] for c in resp.json()]
        except Exception:
            pass

    @task(2)
    @tag("staff", "read")
    def list_labs(self):
        """GET all labs — staff opens the Print Files page."""
        self.client.get(
            "/api/admin/labs/",
            headers=self.headers,
            name="GET /api/admin/labs/ (all)",
        )

    @task(3)
    @tag("staff", "read")
    def list_candidates(self):
        """GET candidates in Lab-A — staff selects a lab."""
        with self.client.get(
            f"/api/admin/labs/?lab={LAB_NAME}",
            headers=self.headers,
            name="GET /api/admin/labs/?lab= (candidates)",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                self.cand_ids = [c["user_id"] for c in data]

    @task(4)
    @tag("staff", "read")
    def view_candidate_files(self):
        """
        GET files for a specific candidate.
        Weight 4 = most common staff action.
        Staff clicks a candidate → files load.
        """
        if not self.cand_ids:
            return
        uid = random.choice(self.cand_ids)
        self.client.get(
            f"/api/admin/candidates/{uid}/files/",
            headers=self.headers,
            name="GET /api/admin/candidates/{uid}/files/",
        )

    @task(1)
    @tag("staff", "read")
    def list_users(self):
        """GET candidate user list — Manage Users page."""
        self.client.get(
            "/api/users/?role=Candidate",
            headers=self.headers,
            name="GET /api/users/?role=Candidate",
        )


# ══════════════════════════════════════════════════════════════
# USER CLASS 3: AdminUser
# Represents the SuperAdmin doing oversight.
# Weight 1 = 10% of virtual users.
# wait_time between(2, 8) = admin checks quickly.
# ══════════════════════════════════════════════════════════════
class AdminUser(HttpUser):
    weight    = 1
    wait_time = between(2, 8)

    def on_start(self):
        self.token   = None
        self.headers = {}
        token, _ = do_login(self.client, ADMIN_CREDS)
        if not token:
            raise StopUser()
        self.token   = token
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def on_stop(self):
        if self.token:
            self.client.post(
                "/api/auth/logout/",
                json={"refresh": ""},
                headers=self.headers,
                name="POST /api/auth/logout/ (admin)",
            )

    @task(3)
    @tag("admin", "read")
    def list_all_users(self):
        """GET all users — Manage Users page."""
        self.client.get(
            "/api/users/",
            headers=self.headers,
            name="GET /api/users/ (all)",
        )

    @task(2)
    @tag("admin", "read")
    def bulk_history(self):
        """GET bulk upload batch history."""
        self.client.get(
            "/api/users/bulk/history/",
            headers=self.headers,
            name="GET /api/users/bulk/history/",
        )

    @task(2)
    @tag("admin", "read")
    def list_labs(self):
        """GET all labs — Print Files overview."""
        self.client.get(
            "/api/admin/labs/",
            headers=self.headers,
            name="GET /api/admin/labs/ (admin)",
        )

    @task(1)
    @tag("admin", "read")
    def check_session(self):
        self.client.get(
            "/api/auth/me/",
            headers=self.headers,
            name="GET /api/auth/me/ (admin)",
        )


# ══════════════════════════════════════════════════════════════
# Print summary to console when test ends
# ══════════════════════════════════════════════════════════════
@events.quitting.add_listener
def on_quit(environment, **kwargs):
    stats = environment.stats
    print("\n" + "=" * 70)
    print("  LOAD TEST COMPLETE")
    print("=" * 70)
    print(f"  {'Method':<7} {'Endpoint':<45} {'Reqs':>6} {'Fails':>6} {'Avg':>7} {'p95':>7}")
    print("-" * 70)
    for name, e in sorted(stats.entries.items(), key=lambda x: -x[1].num_requests):
        if e.num_requests == 0:
            continue
        print(
            f"  {e.method:<7} {name[:44]:<45} "
            f"{e.num_requests:>6} {e.num_failures:>6} "
            f"{e.avg_response_time:>6.0f}ms "
            f"{e.get_response_time_percentile(0.95):>6.0f}ms"
        )
    print("=" * 70)
    total_reqs  = sum(e.num_requests  for e in stats.entries.values())
    total_fails = sum(e.num_failures  for e in stats.entries.values())
    fail_pct    = (total_fails / total_reqs * 100) if total_reqs else 0
    print(f"\n  Total requests : {total_reqs}")
    print(f"  Total failures : {total_fails} ({fail_pct:.2f}%)")
    print(f"  Result         : {'PASS ✓' if fail_pct < 2 else 'FAIL ✗  — failure rate too high'}")
    print()
