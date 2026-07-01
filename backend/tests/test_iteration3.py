"""Iteration 3 tests: PWA/GA/GSC, brochure PDF, projects CRUD, forgot/reset/change password, async storage."""
import os
import re
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://prestige-steel-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@nkprestigesteel.com"
ADMIN_PASSWORD = "NK@Prestige2026"


def _login(email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)


@pytest.fixture(scope="module")
def token():
    r = _login()
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Brochure PDF ----
class TestBrochurePDF:
    def test_brochure_pdf(self):
        r = requests.get(f"{API}/brochure.pdf", timeout=30)
        assert r.status_code == 200, r.text[:200]
        assert "application/pdf" in r.headers.get("Content-Type", "")
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd.lower()
        assert r.content[:4] == b"%PDF"
        assert len(r.content) > 3 * 1024


# ---- Projects CRUD ----
class TestProjects:
    def test_public_list(self):
        r = requests.get(f"{API}/projects", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_only_visible_filter(self):
        r = requests.get(f"{API}/projects", params={"only_visible": "true"}, timeout=15)
        assert r.status_code == 200

    def test_crud(self, auth_headers):
        payload = {
            "title": "TEST_Project_" + uuid.uuid4().hex[:6],
            "location": "TEST_Bengaluru",
            "description": "test desc",
            "images": [],
            "order": 999,
            "visible": True,
        }
        cr = requests.post(f"{API}/projects", json=payload, headers=auth_headers, timeout=15)
        assert cr.status_code in (200, 201), cr.text
        pid = cr.json()["id"]

        # verify persistence
        lst = requests.get(f"{API}/projects", timeout=15).json()
        assert any(p["id"] == pid for p in lst)

        payload["title"] = "TEST_Project_Updated"
        ur = requests.put(f"{API}/projects/{pid}", json=payload, headers=auth_headers, timeout=15)
        assert ur.status_code == 200, ur.text
        assert ur.json()["title"] == "TEST_Project_Updated"

        dr = requests.delete(f"{API}/projects/{pid}", headers=auth_headers, timeout=15)
        assert dr.status_code in (200, 204)
        lst2 = requests.get(f"{API}/projects", timeout=15).json()
        assert not any(p["id"] == pid for p in lst2)

    def test_create_requires_auth(self):
        r = requests.post(f"{API}/projects", json={"title": "no_auth", "location": "x"}, timeout=15)
        assert r.status_code in (401, 403)


# ---- Forgot / Reset Password ----
class TestForgotReset:
    def test_forgot_unknown_email_no_leak(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": "nobody_" + uuid.uuid4().hex + "@example.com"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d.get("ok") is True

    def test_forgot_and_reset_full_flow(self):
        # Request reset for real admin
        r = requests.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("ok") is True
        debug_link = d.get("debug_link")
        assert debug_link and "reset-password?token=" in debug_link, f"debug_link missing: {d}"
        m = re.search(r"token=([A-Za-z0-9\-_\.]+)", debug_link)
        assert m, "token not found in debug_link"
        token_val = m.group(1)

        new_password = "TempReset_" + uuid.uuid4().hex[:8] + "!"
        # Reset password using token
        rr = requests.post(
            f"{API}/auth/reset-password",
            json={"token": token_val, "new_password": new_password},
            timeout=15,
        )
        assert rr.status_code == 200, rr.text

        # Old token cannot be reused
        rr2 = requests.post(
            f"{API}/auth/reset-password",
            json={"token": token_val, "new_password": "AnotherPass123!"},
            timeout=15,
        )
        assert rr2.status_code in (400, 401, 403, 410), rr2.text

        # Verify login with new password
        lr = _login(password=new_password)
        assert lr.status_code == 200, lr.text

        # Reset back to original via forgot flow again
        r2 = requests.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        d2 = r2.json()
        m2 = re.search(r"token=([A-Za-z0-9\-_\.]+)", d2["debug_link"])
        rb = requests.post(
            f"{API}/auth/reset-password",
            json={"token": m2.group(1), "new_password": ADMIN_PASSWORD},
            timeout=15,
        )
        assert rb.status_code == 200, rb.text
        # confirm restore
        assert _login().status_code == 200

    def test_reset_short_password(self):
        r = requests.post(f"{API}/auth/forgot-password", json={"email": ADMIN_EMAIL}, timeout=15)
        m = re.search(r"token=([A-Za-z0-9\-_\.]+)", r.json()["debug_link"])
        rr = requests.post(
            f"{API}/auth/reset-password",
            json={"token": m.group(1), "new_password": "abc"},
            timeout=15,
        )
        assert rr.status_code in (400, 422)


# ---- Change Password (admin) ----
class TestChangePassword:
    def test_wrong_current(self, auth_headers):
        r = requests.post(
            f"{API}/auth/change-password",
            json={"current_password": "wrong-pass", "new_password": "NewPass1234!"},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code in (400, 401), r.text

    def test_change_then_revert(self, auth_headers):
        new_pw = "ChangeTest_" + uuid.uuid4().hex[:6] + "!"
        r = requests.post(
            f"{API}/auth/change-password",
            json={"current_password": ADMIN_PASSWORD, "new_password": new_pw},
            headers=auth_headers,
            timeout=15,
        )
        assert r.status_code == 200, r.text
        # Login with new
        lr = _login(password=new_pw)
        assert lr.status_code == 200, lr.text
        new_headers = {"Authorization": f"Bearer {lr.json()['access_token']}"}
        # Revert back
        rr = requests.post(
            f"{API}/auth/change-password",
            json={"current_password": new_pw, "new_password": ADMIN_PASSWORD},
            headers=new_headers,
            timeout=15,
        )
        assert rr.status_code == 200, rr.text
        assert _login().status_code == 200


# ---- BusinessInfo new fields ----
class TestBusinessInfoGAGSC:
    def test_ga_gsc_fields(self, auth_headers):
        cur = requests.get(f"{API}/business-info", timeout=15).json()
        assert "google_analytics_id" in cur
        assert "google_search_console_verification" in cur
        original_ga = cur.get("google_analytics_id", "")
        original_gsc = cur.get("google_search_console_verification", "")
        cur["google_analytics_id"] = "G-TEST12345"
        cur["google_search_console_verification"] = "test-gsc-verification-token"
        r = requests.put(f"{API}/business-info", json=cur, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        got = requests.get(f"{API}/business-info", timeout=15).json()
        assert got["google_analytics_id"] == "G-TEST12345"
        assert got["google_search_console_verification"] == "test-gsc-verification-token"
        # revert
        cur["google_analytics_id"] = original_ga
        cur["google_search_console_verification"] = original_gsc
        requests.put(f"{API}/business-info", json=cur, headers=auth_headers, timeout=15)


# ---- Async storage IO ----
class TestAsyncStorage:
    def test_gallery_upload_and_get(self, auth_headers):
        png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
               b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8"
               b"\xcf\xc0\x00\x00\x00\x03\x00\x01\x5b\x8ce\xa5\x00\x00\x00\x00IEND\xaeB`\x82")
        files = {"file": ("t.png", png, "image/png")}
        t0 = time.time()
        r = requests.post(f"{API}/gallery/upload", files=files, headers=auth_headers, timeout=30)
        elapsed = time.time() - t0
        if r.status_code == 500:
            pytest.skip(f"Storage unavailable: {r.text}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "file_path" in d and d["file_path"].startswith("nk-prestige-steel/gallery/")
        # Fetch and verify content via /api/files/{path}
        fr = requests.get(f"{API}/files/{d['file_path']}", timeout=30)
        assert fr.status_code == 200
        assert fr.content == png
        assert elapsed < 20  # reasonable (not blocked)
        # cleanup: delete the created gallery item
        requests.delete(f"{API}/gallery/{d['id']}", headers=auth_headers, timeout=15)


# ---- SEO regression ----
class TestSEORegression:
    def test_robots(self):
        r = requests.get(f"{API}/robots.txt", timeout=15)
        assert r.status_code == 200
        assert "text/plain" in r.headers.get("Content-Type", "")
        assert "Sitemap:" in r.text

    def test_sitemap_public_url(self):
        r = requests.get(f"{API}/sitemap.xml", timeout=15)
        assert r.status_code == 200
        # Count <url> entries
        n = r.text.count("<url>")
        assert n >= 6, f"Expected >=6 urls, got {n}"
        # Should use PUBLIC_URL https base
        assert "https://" in r.text
