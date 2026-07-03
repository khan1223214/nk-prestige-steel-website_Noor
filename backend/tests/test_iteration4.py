"""Iteration 4 backend tests: payment methods CRUD, backup/restore, gallery reorder,
upload-image, and BusinessInfo new hero/SEO fields."""
import io
import json
import os
import struct
import zlib

import pytest
import requests

def _base():
    v = os.environ.get("REACT_APP_BACKEND_URL")
    if not v:
        # read from frontend/.env
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        v = line.split("=", 1)[1].strip()
                        break
        except Exception:
            pass
    if not v:
        raise RuntimeError("REACT_APP_BACKEND_URL not set")
    return v.rstrip("/")

BASE = _base()
ADMIN_EMAIL = "admin@nkprestigesteel.com"
ADMIN_PASSWORD = "NK@Prestige2026"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


def _make_png() -> bytes:
    # Minimal 1x1 red PNG
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    idat_raw = b"\x00\xff\x00\x00"
    idat = zlib.compress(idat_raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


# -------------------- Payment Methods --------------------
class TestPaymentMethods:
    def test_list_seeded(self):
        r = requests.get(f"{BASE}/api/payment-methods", timeout=15)
        assert r.status_code == 200
        methods = r.json()
        assert isinstance(methods, list)
        kinds = {m["kind"] for m in methods}
        # seeded should include UPI/BANK/CASH/CHEQUE
        for expected in ["UPI", "BANK", "CASH", "CHEQUE"]:
            assert expected in kinds, f"missing seeded kind {expected}: {kinds}"
        assert len(methods) >= 4

    def test_only_enabled_filter(self, auth):
        # create disabled row
        r = requests.post(f"{BASE}/api/payment-methods",
                          json={"kind": "OTHER", "label": "TEST_DisabledPM", "enabled": False, "order": 99},
                          headers=auth, timeout=15)
        assert r.status_code == 200
        pid = r.json()["id"]
        try:
            all_list = requests.get(f"{BASE}/api/payment-methods").json()
            enabled_list = requests.get(f"{BASE}/api/payment-methods?only_enabled=true").json()
            assert any(m["id"] == pid for m in all_list)
            assert not any(m["id"] == pid for m in enabled_list)
            assert all(m["enabled"] is True for m in enabled_list)
        finally:
            requests.delete(f"{BASE}/api/payment-methods/{pid}", headers=auth)

    def test_crud(self, auth):
        r = requests.post(f"{BASE}/api/payment-methods",
                          json={"kind": "UPI", "label": "API Test UPI", "details": "test@upi", "order": 50},
                          headers=auth, timeout=15)
        assert r.status_code == 200
        row = r.json()
        assert row["kind"] == "UPI" and row["label"] == "API Test UPI"
        pid = row["id"]

        # PUT
        r2 = requests.put(f"{BASE}/api/payment-methods/{pid}",
                          json={"kind": "UPI", "label": "API Test UPI Updated", "details": "test2@upi", "order": 51, "enabled": True},
                          headers=auth, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["label"] == "API Test UPI Updated"

        # verify persistence
        row_get = next((m for m in requests.get(f"{BASE}/api/payment-methods").json() if m["id"] == pid), None)
        assert row_get and row_get["label"] == "API Test UPI Updated"

        # DELETE
        r3 = requests.delete(f"{BASE}/api/payment-methods/{pid}", headers=auth, timeout=15)
        assert r3.status_code == 200 and r3.json()["ok"] is True

        assert not any(m["id"] == pid for m in requests.get(f"{BASE}/api/payment-methods").json())

    def test_create_requires_auth(self):
        r = requests.post(f"{BASE}/api/payment-methods", json={"kind": "UPI", "label": "x"}, timeout=15)
        assert r.status_code in (401, 403)


# -------------------- Backup / Restore --------------------
class TestBackupRestore:
    def test_backup_download(self, auth):
        r = requests.get(f"{BASE}/api/backup", headers=auth, timeout=30)
        assert r.status_code == 200
        assert "application/json" in r.headers.get("content-type", "")
        assert "attachment" in r.headers.get("content-disposition", "").lower()
        data = r.json()
        assert data.get("version") == 1
        cols = data.get("collections", {})
        for c in ["business_info", "prices", "services", "testimonials", "faqs", "gallery", "projects", "payment_methods", "pickups"]:
            assert c in cols, f"missing collection {c}"
        # ~30 prices
        assert len(cols["prices"]) >= 20, f"prices count too low: {len(cols['prices'])}"

    def test_restore_roundtrip(self, auth):
        # download
        r = requests.get(f"{BASE}/api/backup", headers=auth, timeout=30)
        assert r.status_code == 200
        raw = r.content
        # upload back with replace=false
        files = {"file": ("backup.json", raw, "application/json")}
        r2 = requests.post(f"{BASE}/api/restore", files=files, headers=auth, timeout=60)
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body.get("ok") is True
        assert "restored" in body
        assert body["restored"].get("prices", 0) >= 20

    def test_backup_requires_auth(self):
        r = requests.get(f"{BASE}/api/backup", timeout=15)
        assert r.status_code in (401, 403)


# -------------------- Gallery Reorder --------------------
class TestGalleryReorder:
    def test_reorder(self, auth):
        gallery = requests.get(f"{BASE}/api/gallery").json()
        if len(gallery) < 2:
            pytest.skip("need at least 2 gallery items")
        # snapshot current order
        ids = [g["id"] for g in gallery[:3]]
        reversed_ids = list(reversed(ids))
        r = requests.post(f"{BASE}/api/gallery/reorder", json={"ids": reversed_ids}, headers=auth, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        new_list = requests.get(f"{BASE}/api/gallery").json()
        # Get the order of the reordered ids in the response, filtered to only ones we reordered
        found_order = [g["id"] for g in new_list if g["id"] in reversed_ids]
        assert found_order[:len(reversed_ids)] == reversed_ids, f"order mismatch: {found_order} vs {reversed_ids}"

        # restore original order
        requests.post(f"{BASE}/api/gallery/reorder", json={"ids": ids}, headers=auth, timeout=15)

    def test_reorder_requires_auth(self):
        r = requests.post(f"{BASE}/api/gallery/reorder", json={"ids": []}, timeout=15)
        assert r.status_code in (401, 403)


# -------------------- Upload Image --------------------
class TestUploadImage:
    def test_upload_and_fetch(self, auth):
        png = _make_png()
        files = {"file": ("test.png", png, "image/png")}
        r = requests.post(f"{BASE}/api/upload-image?folder=payments", files=files, headers=auth, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "path" in body and "url" in body
        assert body["url"].startswith("/api/files/")
        # fetch via absolute
        fetch_url = f"{BASE}{body['url']}"
        r2 = requests.get(fetch_url, timeout=30)
        assert r2.status_code == 200
        assert r2.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_upload_requires_auth(self):
        png = _make_png()
        files = {"file": ("test.png", png, "image/png")}
        r = requests.post(f"{BASE}/api/upload-image?folder=payments", files=files, timeout=15)
        assert r.status_code in (401, 403)


# -------------------- BusinessInfo new fields --------------------
class TestBusinessInfoNewFields:
    def test_new_fields_present_and_persist(self, auth):
        # get current
        cur = requests.get(f"{BASE}/api/business-info").json()
        original = {k: cur.get(k, "") for k in [
            "seo_keywords", "favicon_url", "hero_image_url",
            "hero_cta_primary_label", "hero_cta_primary_url",
            "hero_cta_secondary_label", "hero_cta_secondary_url"]}

        new_vals = {
            "seo_keywords": "TEST_kw1, TEST_kw2",
            "favicon_url": "/api/files/test-favicon.ico",
            "hero_image_url": "/api/files/test-hero.jpg",
            "hero_cta_primary_label": "TEST_Primary",
            "hero_cta_primary_url": "tel:+911111111111",
            "hero_cta_secondary_label": "TEST_Secondary",
            "hero_cta_secondary_url": "/pickup?test=1",
        }
        payload = {**cur, **new_vals}
        payload.pop("_id", None)
        r = requests.put(f"{BASE}/api/business-info", json=payload, headers=auth, timeout=15)
        assert r.status_code == 200, r.text

        got = requests.get(f"{BASE}/api/business-info").json()
        for k, v in new_vals.items():
            assert got.get(k) == v, f"field {k}: expected {v}, got {got.get(k)}"

        # revert
        revert_payload = {**got, **original}
        revert_payload.pop("_id", None)
        requests.put(f"{BASE}/api/business-info", json=revert_payload, headers=auth, timeout=15)
