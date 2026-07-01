"""E2E backend tests for NK Prestige Steel API (external URL)."""
import os
import io
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://prestige-steel-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@nkprestigesteel.com"
ADMIN_PASSWORD = "NK@Prestige2026"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and data["email"] == ADMIN_EMAIL
    return data["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# -------- Auth --------
class TestAuth:
    def test_login_success(self, token):
        assert isinstance(token, str) and len(token) > 20

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_requires_token(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_token(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == ADMIN_EMAIL and data["role"] == "admin"


# -------- Business Info --------
class TestBusinessInfo:
    def test_get_business_info(self):
        r = requests.get(f"{API}/business-info", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["business_name"] and d["gst_number"] == "29KZRPK1994P1ZV"
        assert d["phone"] == "+91 9741309869"

    def test_update_business_info_requires_auth(self):
        r = requests.put(f"{API}/business-info", json={}, timeout=15)
        assert r.status_code in (401, 422)

    def test_update_business_info(self, auth_headers):
        # get current
        cur = requests.get(f"{API}/business-info", timeout=15).json()
        cur["tagline"] = "TEST_TAGLINE_" + str(int(time.time()))
        r = requests.put(f"{API}/business-info", json=cur, headers=auth_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["tagline"] == cur["tagline"]
        # verify persistence
        got = requests.get(f"{API}/business-info", timeout=15).json()
        assert got["tagline"] == cur["tagline"]
        # revert
        cur["tagline"] = "India's Trusted Scrap Recycling Partner"
        requests.put(f"{API}/business-info", json=cur, headers=auth_headers, timeout=15)


# -------- Prices --------
class TestPrices:
    def test_list_prices_seeded(self):
        r = requests.get(f"{API}/prices", timeout=15)
        assert r.status_code == 200
        prices = r.json()
        assert len(prices) >= 30, f"Expected >=30 seeded prices, got {len(prices)}"
        assert all("price_per_kg" in p for p in prices)

    def test_only_visible_filter(self):
        r = requests.get(f"{API}/prices", params={"only_visible": "true"}, timeout=15)
        assert r.status_code == 200

    def test_prices_crud_and_previous_tracking(self, auth_headers):
        payload = {
            "category": "TEST",
            "name": "TEST_Scrap_Item",
            "unit": "kg",
            "price_per_kg": 100.0,
            "notes": "test",
            "visible": True,
        }
        cr = requests.post(f"{API}/prices", json=payload, headers=auth_headers, timeout=15)
        assert cr.status_code == 200, cr.text
        item = cr.json()
        pid = item["id"]
        assert item["price_per_ton"] == 100000.0
        # Update price - should auto set previous
        payload["price_per_kg"] = 120.0
        ur = requests.put(f"{API}/prices/{pid}", json=payload, headers=auth_headers, timeout=15)
        assert ur.status_code == 200
        upd = ur.json()
        assert upd["price_per_kg"] == 120.0
        assert upd["previous_price"] == 100.0
        # Delete
        dr = requests.delete(f"{API}/prices/{pid}", headers=auth_headers, timeout=15)
        assert dr.status_code == 200
        # Verify deletion via list
        listed = requests.get(f"{API}/prices", timeout=15).json()
        assert not any(p["id"] == pid for p in listed)

    def test_export_csv(self, auth_headers):
        r = requests.get(f"{API}/prices/export/csv", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("Content-Type", "")
        assert "price_per_kg" in r.text

    def test_import_csv(self, auth_headers):
        csv_data = "category,name,unit,price_per_kg,price_per_ton,previous_price,notes\nTEST,TEST_Import_Item,kg,55.5,55500,54,imported\n"
        files = {"file": ("test.csv", csv_data, "text/csv")}
        r = requests.post(f"{API}/prices/import/csv", headers=auth_headers, files=files, timeout=30)
        assert r.status_code == 200
        assert r.json().get("imported", 0) >= 1
        # cleanup
        prices = requests.get(f"{API}/prices", timeout=15).json()
        for p in prices:
            if p["name"] == "TEST_Import_Item":
                requests.delete(f"{API}/prices/{p['id']}", headers=auth_headers, timeout=15)


# -------- Services --------
class TestServices:
    def test_list_services_seeded(self):
        r = requests.get(f"{API}/services", timeout=15)
        assert r.status_code == 200
        services = r.json()
        assert len(services) >= 35, f"Expected >=35 seeded services, got {len(services)}"

    def test_services_crud(self, auth_headers):
        payload = {"title": "TEST_Service", "description": "test desc", "icon": "Wrench", "order": 999, "visible": True}
        cr = requests.post(f"{API}/services", json=payload, headers=auth_headers, timeout=15)
        assert cr.status_code == 200
        sid = cr.json()["id"]
        payload["title"] = "TEST_Service_Updated"
        ur = requests.put(f"{API}/services/{sid}", json=payload, headers=auth_headers, timeout=15)
        assert ur.status_code == 200 and ur.json()["title"] == "TEST_Service_Updated"
        dr = requests.delete(f"{API}/services/{sid}", headers=auth_headers, timeout=15)
        assert dr.status_code == 200


# -------- Testimonials --------
class TestTestimonials:
    def test_list(self):
        r = requests.get(f"{API}/testimonials", timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_crud(self, auth_headers):
        payload = {"name": "TEST_User", "location": "TEST", "rating": 5, "message": "TEST msg", "visible": True}
        cr = requests.post(f"{API}/testimonials", json=payload, headers=auth_headers, timeout=15)
        assert cr.status_code == 200
        tid = cr.json()["id"]
        payload["message"] = "TEST_Updated"
        ur = requests.put(f"{API}/testimonials/{tid}", json=payload, headers=auth_headers, timeout=15)
        assert ur.status_code == 200 and ur.json()["message"] == "TEST_Updated"
        dr = requests.delete(f"{API}/testimonials/{tid}", headers=auth_headers, timeout=15)
        assert dr.status_code == 200


# -------- FAQs --------
class TestFaqs:
    def test_list(self):
        r = requests.get(f"{API}/faqs", timeout=15)
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_crud(self, auth_headers):
        payload = {"question": "TEST_Q?", "answer": "TEST_A", "order": 999, "visible": True}
        cr = requests.post(f"{API}/faqs", json=payload, headers=auth_headers, timeout=15)
        assert cr.status_code == 200
        fid = cr.json()["id"]
        dr = requests.delete(f"{API}/faqs/{fid}", headers=auth_headers, timeout=15)
        assert dr.status_code == 200


# -------- Pickup --------
class TestPickup:
    def test_public_create(self):
        payload = {
            "name": "TEST_Rakesh", "mobile": "9999999999", "scrap_type": "MS Scrap",
            "quantity": "500kg", "location": "Ramanagara", "remarks": "test"
        }
        r = requests.post(f"{API}/pickup", json=payload, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "new" and data["name"] == "TEST_Rakesh"
        return data["id"]

    def test_list_requires_admin(self):
        r = requests.get(f"{API}/pickup", timeout=15)
        assert r.status_code == 401

    def test_list_status_update_delete(self, auth_headers):
        payload = {"name": "TEST_Flow", "mobile": "9000000000", "scrap_type": "Copper", "quantity": "10kg", "location": "BLR"}
        cr = requests.post(f"{API}/pickup", json=payload, timeout=15)
        pid = cr.json()["id"]
        lr = requests.get(f"{API}/pickup", headers=auth_headers, timeout=15)
        assert lr.status_code == 200 and any(p["id"] == pid for p in lr.json())
        ur = requests.put(f"{API}/pickup/{pid}/status", params={"status": "contacted"}, headers=auth_headers, timeout=15)
        assert ur.status_code == 200
        # verify
        lr2 = requests.get(f"{API}/pickup", headers=auth_headers, timeout=15).json()
        found = next(p for p in lr2 if p["id"] == pid)
        assert found["status"] == "contacted"
        dr = requests.delete(f"{API}/pickup/{pid}", headers=auth_headers, timeout=15)
        assert dr.status_code == 200


# -------- Newsletter --------
class TestNewsletter:
    def test_subscribe(self):
        r = requests.post(f"{API}/newsletter", json={"email": "test_user@example.com"}, timeout=15)
        assert r.status_code == 200


# -------- Upload / Files --------
class TestUploads:
    def test_pickup_upload_and_get(self):
        # 1x1 PNG
        png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x5b\x8ce\xa5\x00\x00\x00\x00IEND\xaeB`\x82"
        files = {"file": ("test.png", png, "image/png")}
        r = requests.post(f"{API}/pickup/upload", files=files, timeout=60)
        if r.status_code == 500:
            pytest.skip(f"Storage unavailable: {r.text}")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "path" in data and "url" in data
        # Fetch file
        fr = requests.get(f"{BASE_URL}{data['url']}", timeout=30)
        assert fr.status_code == 200

    def test_gallery_upload_requires_admin(self):
        files = {"file": ("test.png", b"fake", "image/png")}
        r = requests.post(f"{API}/gallery/upload", files=files, timeout=30)
        assert r.status_code == 401
