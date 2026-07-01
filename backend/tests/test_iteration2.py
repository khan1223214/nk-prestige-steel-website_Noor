"""Iteration 2 tests: extras arrays, 2026 prices, gallery seed, lockout, rate limits, AI chat, SEO."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://prestige-steel-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@nkprestigesteel.com"
ADMIN_PASSWORD = "NK@Prestige2026"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Business info extras ----
class TestBusinessInfoExtras:
    def test_extras_present(self):
        d = requests.get(f"{API}/business-info", timeout=15).json()
        assert "+91 8310064128" in d["extra_phones"]
        assert "+91 8310064128" in d["extra_whatsapps"]
        assert d["tagline"] == "Premium Scrap Dealer & Metal Trading"
        assert isinstance(d.get("extra_emails"), list)
        assert isinstance(d.get("additional_addresses"), list)

    def test_admin_can_edit_extras(self, auth_headers):
        cur = requests.get(f"{API}/business-info", timeout=15).json()
        original = dict(cur)
        cur["extra_phones"] = ["+91 8310064128", "+91 9000000000"]
        cur["extra_emails"] = ["extra@example.com"]
        cur["additional_addresses"] = [{"label": "Branch", "address": "Test Addr", "maps_url": "https://maps.google.com/"}]
        r = requests.put(f"{API}/business-info", json=cur, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        got = requests.get(f"{API}/business-info", timeout=15).json()
        assert "+91 9000000000" in got["extra_phones"]
        assert "extra@example.com" in got["extra_emails"]
        assert got["additional_addresses"][0]["label"] == "Branch"
        # revert
        requests.put(f"{API}/business-info", json=original, headers=auth_headers, timeout=15)


# ---- 2026 prices + seeded gallery ----
class TestSeeds:
    def test_ms_heavy_price(self):
        prices = requests.get(f"{API}/prices", timeout=15).json()
        heavy = [p for p in prices if p["name"] == "MS Scrap (Heavy)"]
        assert heavy and heavy[0]["price_per_kg"] == 44.5

    def test_gallery_seeded(self):
        items = requests.get(f"{API}/gallery", params={"only_visible": "true"}, timeout=15).json()
        assert len(items) >= 8
        assert all(i["file_path"].startswith("https://") for i in items)


# ---- SEO endpoints ----
class TestSEO:
    def test_robots(self):
        r = requests.get(f"{API}/robots.txt", timeout=15)
        assert r.status_code == 200
        assert "Disallow: /admin" in r.text
        assert "Sitemap:" in r.text

    def test_sitemap(self):
        r = requests.get(f"{API}/sitemap.xml", timeout=15)
        assert r.status_code == 200
        for path in ["/prices", "/services", "/gallery", "/pickup", "/contact"]:
            assert path in r.text
        assert "<urlset" in r.text


# ---- AI chat ----
class TestAIChat:
    def test_chat_returns_reply(self):
        sid = f"test-{uuid.uuid4()}"
        r = requests.post(f"{API}/ai/chat", json={"session_id": sid, "message": "How much for 10kg copper wire?"}, timeout=60)
        # 500 acceptable if LLM key empty; but currently should work
        if r.status_code == 500:
            pytest.skip(f"LLM unavailable: {r.text}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert isinstance(d.get("reply"), str) and len(d["reply"]) > 0
        assert d["session_id"] == sid


# ---- Brute force lockout ----
class TestLockout:
    def test_lockout_after_5_fails(self):
        # Use throwaway email so admin isn't affected
        email = f"locktest_{uuid.uuid4().hex[:8]}@example.com"
        # 5 failed attempts (should return 401)
        for i in range(5):
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"}, timeout=15)
            assert r.status_code == 401, f"Attempt {i+1}: {r.status_code} {r.text}"
        # 6th should trigger 429
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": "wrong"}, timeout=15)
        assert r.status_code == 429, f"Expected lockout 429, got {r.status_code}: {r.text}"
        assert "Too many failed attempts" in r.text


# ---- Rate limits ----
class TestRateLimits:
    def test_newsletter_rate_limit(self):
        # 5/hour limit; make 6 requests with unique emails, expect 429
        seen_429 = False
        for i in range(8):
            r = requests.post(f"{API}/newsletter", json={"email": f"rl_{uuid.uuid4().hex[:6]}@example.com"}, timeout=10)
            if r.status_code == 429:
                seen_429 = True
                break
        assert seen_429, "Newsletter rate limit not triggered within 8 requests"

    def test_pickup_rate_limit(self):
        seen_429 = False
        for i in range(12):
            payload = {"name": f"TEST_RL_{i}", "mobile": "9999999999", "scrap_type": "MS", "quantity": "1kg", "location": "test"}
            r = requests.post(f"{API}/pickup", json=payload, timeout=10)
            if r.status_code == 429:
                seen_429 = True
                break
        assert seen_429, "Pickup rate limit not triggered within 12 requests"
