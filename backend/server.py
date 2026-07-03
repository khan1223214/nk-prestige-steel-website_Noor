from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import io
import uuid
import logging
import secrets
import bcrypt
import jwt as pyjwt
import requests
import httpx
import resend as resend_sdk
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Header, Query, Request, Response
from fastapi.responses import StreamingResponse, PlainTextResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
import pandas as pd
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from emergentintegrations.llm.chat import LlmChat, UserMessage


def _real_client_ip(request):
    """Return real client IP behind k8s ingress / proxies (X-Forwarded-For first)."""
    xff = request.headers.get("x-forwarded-for") or request.headers.get("x-real-ip")
    if xff:
        return xff.split(",")[0].strip()
    try:
        return get_remote_address(request)
    except Exception:
        return "unknown"

# ------------- Config -------------
mongo_url = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@nkprestigesteel.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'NK@Prestige2026')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
APP_NAME = os.environ.get('APP_NAME', 'nk-prestige-steel')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '').strip()
RESEND_FROM = os.environ.get('RESEND_FROM', 'NK Prestige Steel <onboarding@resend.dev>')
if RESEND_API_KEY:
    resend_sdk.api_key = RESEND_API_KEY

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"

client = AsyncIOMotorClient(mongo_url)
db = client[DB_NAME]

app = FastAPI(title="NK Prestige Steel API")
api_router = APIRouter(prefix="/api")

# Rate limiter — behind k8s ingress: use X-Forwarded-For as client key
limiter = Limiter(key_func=_real_client_ip)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Brute force lockout config
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


# ------------- Helpers -------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(email: str) -> str:
    payload = {
        "sub": email,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_admin(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin only")
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ------------- Object Storage -------------
storage_key = None


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_LLM_KEY:
        logger.warning("EMERGENT_LLM_KEY not set; storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Legacy sync API (kept for backward compat). Prefer aput_object in new async code."""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if resp.status_code == 403:
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


async def aput_object(path: str, data: bytes, content_type: str) -> dict:
    """Async storage upload via httpx — non-blocking for FastAPI event loop."""
    global storage_key
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            content=data,
        )
        if resp.status_code == 403:
            storage_key = None
            key = init_storage()
            resp = await client.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                content=data,
            )
        resp.raise_for_status()
        return resp.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 403:
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="File not found")
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


async def aget_object(path: str):
    """Async storage download via httpx — non-blocking."""
    global storage_key
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage unavailable")
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
        )
        if resp.status_code == 403:
            storage_key = None
            key = init_storage()
            resp = await client.get(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key},
            )
        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail="File not found")
        resp.raise_for_status()
        return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ------------- Models -------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


class ScrapPriceIn(BaseModel):
    category: str
    name: str
    unit: str = "kg"
    price_per_kg: float
    price_per_ton: Optional[float] = None
    previous_price: Optional[float] = None
    notes: Optional[str] = ""
    visible: bool = True


class ScrapPrice(ScrapPriceIn):
    id: str
    updated_at: str


class ServiceIn(BaseModel):
    title: str
    description: str
    icon: str = "Wrench"
    image_url: Optional[str] = None
    order: int = 0
    visible: bool = True


class Service(ServiceIn):
    id: str


class TestimonialIn(BaseModel):
    name: str
    location: str = ""
    rating: int = 5
    message: str
    avatar_url: Optional[str] = None
    visible: bool = True


class Testimonial(TestimonialIn):
    id: str


class FaqIn(BaseModel):
    question: str
    answer: str
    order: int = 0
    visible: bool = True


class Faq(FaqIn):
    id: str


class GalleryItemIn(BaseModel):
    title: str = ""
    caption: str = ""
    category: str = "General"
    media_type: str = "image"  # image | video
    file_path: str
    order: int = 0
    visible: bool = True


class GalleryItem(GalleryItemIn):
    id: str
    created_at: str


class PickupRequestIn(BaseModel):
    name: str
    mobile: str
    scrap_type: str
    quantity: str
    location: str
    remarks: Optional[str] = ""
    media_paths: List[str] = []


class PickupRequest(PickupRequestIn):
    id: str
    status: str = "new"
    created_at: str


class AdditionalAddress(BaseModel):
    label: str = ""
    address: str = ""
    maps_url: str = ""


class BusinessInfo(BaseModel):
    business_name: str = "NK Prestige Steel Corporation"
    tagline: str = "Premium Scrap Dealer & Metal Trading"
    subtitle: str = "We Buy All Types of Scrap at the Best Market Price"
    phone: str = "+91 9741309869"
    whatsapp: str = "+91 9741309869"
    email: str = "nkprestigesteel@gmail.com"
    # Additional contacts (owner can add/remove)
    extra_phones: List[str] = Field(default_factory=lambda: ["+91 8310064128"])
    extra_whatsapps: List[str] = Field(default_factory=lambda: ["+91 8310064128"])
    extra_emails: List[str] = Field(default_factory=list)
    office_address: str = "Troop Lane Main Road, Near Jai Bheem Circle, Ramanagara - 562159, Karnataka"
    godown_address: str = "278/1 Near Kannamangaladoddi, Close to State Highway 275, Ramanagara - 562159, Karnataka"
    additional_addresses: List[AdditionalAddress] = Field(default_factory=list)
    gst_number: str = "29KZRPK1994P1ZV"
    google_maps_url: str = "https://maps.google.com/?q=Ramanagara+Karnataka"
    working_hours: str = "Mon-Sat: 9:00 AM - 7:00 PM"
    facebook: str = ""
    instagram: str = ""
    linkedin: str = ""
    twitter: str = ""
    youtube: str = ""
    # SEO / analytics
    google_analytics_id: str = ""
    google_search_console_verification: str = ""
    seo_keywords: str = "scrap dealer karnataka, scrap buyer ramanagara, copper scrap price, aluminium scrap, iron scrap, factory scrap, industrial dismantling"
    favicon_url: str = ""
    # Hero customization
    hero_image_url: str = ""
    hero_cta_primary_label: str = "Call Owner"
    hero_cta_primary_url: str = ""
    hero_cta_secondary_label: str = "Get Quote"
    hero_cta_secondary_url: str = "/pickup"


class PaymentMethodIn(BaseModel):
    kind: str  # UPI | BANK | CASH | CHEQUE | NEFT | RTGS | OTHER
    label: str
    details: str = ""  # e.g., UPI ID, IFSC + account #, etc.
    qr_image_url: Optional[str] = None
    enabled: bool = True
    order: int = 0


class PaymentMethod(PaymentMethodIn):
    id: str
    created_at: str


class ProjectIn(BaseModel):
    title: str
    description: str
    location: str = ""
    customer: str = ""
    completion_date: str = ""
    image_url: Optional[str] = None
    order: int = 0
    visible: bool = True


class Project(ProjectIn):
    id: str
    created_at: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class NewsletterIn(BaseModel):
    email: EmailStr


# ------------- Auth Routes -------------
def _client_ip(request: Request) -> str:
    return _real_client_ip(request)


async def _check_lockout(identifier: str):
    now = datetime.now(timezone.utc)
    rec = await db.login_attempts.find_one({"_id": identifier})
    if not rec:
        return
    if rec.get("locked_until"):
        locked_until = datetime.fromisoformat(rec["locked_until"])
        if now < locked_until:
            wait = int((locked_until - now).total_seconds() / 60) + 1
            raise HTTPException(status_code=429, detail=f"Too many failed attempts. Try again in {wait} minute(s).")


async def _record_failed(identifier: str):
    now = datetime.now(timezone.utc)
    rec = await db.login_attempts.find_one({"_id": identifier}) or {"_id": identifier, "count": 0}
    count = rec.get("count", 0) + 1
    update = {"count": count, "last_attempt": now.isoformat()}
    if count >= MAX_LOGIN_ATTEMPTS:
        update["locked_until"] = (now + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
        update["count"] = 0
    await db.login_attempts.update_one({"_id": identifier}, {"$set": update}, upsert=True)


async def _clear_attempts(identifier: str):
    await db.login_attempts.delete_one({"_id": identifier})


@api_router.post("/auth/login", response_model=TokenOut)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginIn):
    email = body.email.lower().strip()
    # Key lockout by email only (per-account) so IP rotation doesn't bypass.
    identifier = f"email:{email}"
    await _check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await _record_failed(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await _clear_attempts(identifier)
    token = create_access_token(email)
    return TokenOut(access_token=token, email=email)


@api_router.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return {"email": admin["sub"], "role": admin["role"]}


# ------------- Business Info -------------
@api_router.get("/business-info", response_model=BusinessInfo)
async def get_business_info():
    doc = await db.business_info.find_one({"_id": "singleton"})
    if not doc:
        info = BusinessInfo()
        await db.business_info.insert_one({"_id": "singleton", **info.model_dump()})
        return info
    doc.pop("_id", None)
    return BusinessInfo(**doc)


@api_router.put("/business-info", response_model=BusinessInfo)
async def update_business_info(body: BusinessInfo, admin=Depends(get_current_admin)):
    await db.business_info.update_one(
        {"_id": "singleton"},
        {"$set": body.model_dump()},
        upsert=True,
    )
    return body


# ------------- Scrap Prices -------------
@api_router.get("/prices", response_model=List[ScrapPrice])
async def list_prices(only_visible: bool = False):
    q = {"visible": True} if only_visible else {}
    docs = await db.prices.find(q, {"_id": 0}).sort("category", 1).to_list(1000)
    return [ScrapPrice(**d) for d in docs]


@api_router.post("/prices", response_model=ScrapPrice)
async def create_price(body: ScrapPriceIn, admin=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["updated_at"] = now_iso()
    if doc.get("previous_price") is None:
        doc["previous_price"] = doc["price_per_kg"]
    if doc.get("price_per_ton") is None:
        doc["price_per_ton"] = doc["price_per_kg"] * 1000
    await db.prices.insert_one(doc)
    doc.pop("_id", None)
    return ScrapPrice(**doc)


@api_router.put("/prices/{price_id}", response_model=ScrapPrice)
async def update_price(price_id: str, body: ScrapPriceIn, admin=Depends(get_current_admin)):
    existing = await db.prices.find_one({"id": price_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    update = body.model_dump()
    # Auto-set previous_price to old price_per_kg if price changed
    if update["price_per_kg"] != existing.get("price_per_kg"):
        update["previous_price"] = existing.get("price_per_kg")
    if update.get("price_per_ton") is None:
        update["price_per_ton"] = update["price_per_kg"] * 1000
    update["updated_at"] = now_iso()
    await db.prices.update_one({"id": price_id}, {"$set": update})
    doc = await db.prices.find_one({"id": price_id}, {"_id": 0})
    return ScrapPrice(**doc)


@api_router.delete("/prices/{price_id}")
async def delete_price(price_id: str, admin=Depends(get_current_admin)):
    res = await db.prices.delete_one({"id": price_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api_router.get("/prices/export/csv")
async def export_prices_csv(admin=Depends(get_current_admin)):
    docs = await db.prices.find({}, {"_id": 0}).to_list(1000)
    df = pd.DataFrame(docs)
    if df.empty:
        df = pd.DataFrame(columns=["category", "name", "unit", "price_per_kg", "price_per_ton", "previous_price"])
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=scrap_prices.csv"},
    )


@api_router.post("/prices/import/csv")
async def import_prices_csv(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    content = await file.read()
    try:
        if file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file: {e}")
    count = 0
    for _, row in df.iterrows():
        try:
            existing = await db.prices.find_one({"name": str(row.get("name", "")).strip()})
            data = {
                "category": str(row.get("category", "General")),
                "name": str(row.get("name", "")).strip(),
                "unit": str(row.get("unit", "kg")),
                "price_per_kg": float(row.get("price_per_kg", 0)),
                "price_per_ton": float(row.get("price_per_ton", float(row.get("price_per_kg", 0)) * 1000)),
                "previous_price": float(row.get("previous_price", 0) or 0) or float(row.get("price_per_kg", 0)),
                "notes": str(row.get("notes", "")),
                "visible": True,
                "updated_at": now_iso(),
            }
            if existing:
                data["previous_price"] = existing.get("price_per_kg", data["price_per_kg"])
                await db.prices.update_one({"id": existing["id"]}, {"$set": data})
            else:
                data["id"] = str(uuid.uuid4())
                await db.prices.insert_one(data)
            count += 1
        except Exception as e:
            logger.warning(f"Row import failed: {e}")
    return {"imported": count}


# ------------- Services -------------
@api_router.get("/services", response_model=List[Service])
async def list_services(only_visible: bool = False):
    q = {"visible": True} if only_visible else {}
    docs = await db.services.find(q, {"_id": 0}).sort("order", 1).to_list(1000)
    return [Service(**d) for d in docs]


@api_router.post("/services", response_model=Service)
async def create_service(body: ServiceIn, admin=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db.services.insert_one(doc)
    doc.pop("_id", None)
    return Service(**doc)


@api_router.put("/services/{sid}", response_model=Service)
async def update_service(sid: str, body: ServiceIn, admin=Depends(get_current_admin)):
    await db.services.update_one({"id": sid}, {"$set": body.model_dump()})
    doc = await db.services.find_one({"id": sid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return Service(**doc)


@api_router.delete("/services/{sid}")
async def delete_service(sid: str, admin=Depends(get_current_admin)):
    await db.services.delete_one({"id": sid})
    return {"ok": True}


# ------------- Testimonials -------------
@api_router.get("/testimonials", response_model=List[Testimonial])
async def list_testimonials(only_visible: bool = False):
    q = {"visible": True} if only_visible else {}
    docs = await db.testimonials.find(q, {"_id": 0}).to_list(1000)
    return [Testimonial(**d) for d in docs]


@api_router.post("/testimonials", response_model=Testimonial)
async def create_testimonial(body: TestimonialIn, admin=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db.testimonials.insert_one(doc)
    doc.pop("_id", None)
    return Testimonial(**doc)


@api_router.put("/testimonials/{tid}", response_model=Testimonial)
async def update_testimonial(tid: str, body: TestimonialIn, admin=Depends(get_current_admin)):
    await db.testimonials.update_one({"id": tid}, {"$set": body.model_dump()})
    doc = await db.testimonials.find_one({"id": tid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return Testimonial(**doc)


@api_router.delete("/testimonials/{tid}")
async def delete_testimonial(tid: str, admin=Depends(get_current_admin)):
    await db.testimonials.delete_one({"id": tid})
    return {"ok": True}


# ------------- FAQ -------------
@api_router.get("/faqs", response_model=List[Faq])
async def list_faqs(only_visible: bool = False):
    q = {"visible": True} if only_visible else {}
    docs = await db.faqs.find(q, {"_id": 0}).sort("order", 1).to_list(1000)
    return [Faq(**d) for d in docs]


@api_router.post("/faqs", response_model=Faq)
async def create_faq(body: FaqIn, admin=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db.faqs.insert_one(doc)
    doc.pop("_id", None)
    return Faq(**doc)


@api_router.put("/faqs/{fid}", response_model=Faq)
async def update_faq(fid: str, body: FaqIn, admin=Depends(get_current_admin)):
    await db.faqs.update_one({"id": fid}, {"$set": body.model_dump()})
    doc = await db.faqs.find_one({"id": fid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return Faq(**doc)


@api_router.delete("/faqs/{fid}")
async def delete_faq(fid: str, admin=Depends(get_current_admin)):
    await db.faqs.delete_one({"id": fid})
    return {"ok": True}


# ------------- Gallery -------------
@api_router.get("/gallery", response_model=List[GalleryItem])
async def list_gallery(only_visible: bool = False, category: Optional[str] = None):
    q = {}
    if only_visible:
        q["visible"] = True
    if category and category != "All":
        q["category"] = category
    docs = await db.gallery.find(q, {"_id": 0}).sort("order", 1).to_list(1000)
    return [GalleryItem(**d) for d in docs]


@api_router.post("/gallery/upload", response_model=GalleryItem)
async def upload_gallery(
    file: UploadFile = File(...),
    title: str = "",
    caption: str = "",
    category: str = "General",
    admin=Depends(get_current_admin),
):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    content_type = file.content_type or "application/octet-stream"
    media_type = "video" if content_type.startswith("video/") or ext in ("mp4", "mov", "webm") else "image"
    path = f"{APP_NAME}/gallery/{uuid.uuid4()}.{ext}"
    data = await file.read()
    await aput_object(path, data, content_type)
    item = {
        "id": str(uuid.uuid4()),
        "title": title,
        "caption": caption,
        "category": category,
        "media_type": media_type,
        "file_path": path,
        "order": 0,
        "visible": True,
        "created_at": now_iso(),
    }
    await db.gallery.insert_one(item)
    item.pop("_id", None)
    return GalleryItem(**item)


@api_router.put("/gallery/{gid}", response_model=GalleryItem)
async def update_gallery(gid: str, body: GalleryItemIn, admin=Depends(get_current_admin)):
    await db.gallery.update_one({"id": gid}, {"$set": body.model_dump()})
    doc = await db.gallery.find_one({"id": gid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return GalleryItem(**doc)


@api_router.delete("/gallery/{gid}")
async def delete_gallery(gid: str, admin=Depends(get_current_admin)):
    await db.gallery.delete_one({"id": gid})
    return {"ok": True}


# ------------- Pickup Requests -------------
@api_router.post("/pickup", response_model=PickupRequest)
@limiter.limit("10/hour")
async def create_pickup(request: Request, body: PickupRequestIn):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["status"] = "new"
    doc["created_at"] = now_iso()
    await db.pickups.insert_one(doc)
    doc.pop("_id", None)
    return PickupRequest(**doc)


@api_router.post("/pickup/upload")
async def upload_pickup_media(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    content_type = file.content_type or "application/octet-stream"
    path = f"{APP_NAME}/pickup/{uuid.uuid4()}.{ext}"
    data = await file.read()
    await aput_object(path, data, content_type)
    return {"path": path, "url": f"/api/files/{path}"}


@api_router.get("/files/{file_path:path}")
async def get_file(file_path: str):
    """Public file serving for gallery/pickup media."""
    data, content_type = await aget_object(file_path)
    return Response(content=data, media_type=content_type)


@api_router.get("/pickup", response_model=List[PickupRequest])
async def list_pickups(admin=Depends(get_current_admin)):
    docs = await db.pickups.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [PickupRequest(**d) for d in docs]


@api_router.put("/pickup/{pid}/status")
async def update_pickup_status(pid: str, status: str = Query(...), admin=Depends(get_current_admin)):
    await db.pickups.update_one({"id": pid}, {"$set": {"status": status}})
    return {"ok": True}


@api_router.delete("/pickup/{pid}")
async def delete_pickup(pid: str, admin=Depends(get_current_admin)):
    await db.pickups.delete_one({"id": pid})
    return {"ok": True}


# ------------- Newsletter -------------
@api_router.post("/newsletter")
@limiter.limit("5/hour")
async def newsletter(request: Request, body: NewsletterIn):
    await db.newsletter.update_one(
        {"email": body.email.lower()},
        {"$set": {"email": body.email.lower(), "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


# ------------- AI Chat Assistant -------------
class ChatIn(BaseModel):
    session_id: str
    message: str


class ChatOut(BaseModel):
    session_id: str
    reply: str


async def _build_ai_system_prompt() -> str:
    info_doc = await db.business_info.find_one({"_id": "singleton"}) or {}
    prices = await db.prices.find({"visible": True}, {"_id": 0}).sort("category", 1).to_list(200)
    price_lines = "\n".join(
        f"- {p['name']} ({p['category']}): ₹{p['price_per_kg']}/kg" for p in prices[:40]
    )
    return f"""You are the friendly AI Instant Quote Assistant for NK Prestige Steel Corporation, a premium scrap dealer in Karnataka, India.

BUSINESS INFO:
- Name: {info_doc.get('business_name', 'NK Prestige Steel Corporation')}
- Phone: {info_doc.get('phone', '')}
- WhatsApp: {info_doc.get('whatsapp', '')}
- Email: {info_doc.get('email', '')}
- Office: {info_doc.get('office_address', '')}
- Godown: {info_doc.get('godown_address', '')}
- GST: {info_doc.get('gst_number', '')}
- Hours: {info_doc.get('working_hours', '')}

TODAY'S LIVE SCRAP PRICES:
{price_lines}

YOUR JOB:
- Answer customer questions about scrap prices, pickup, services, and business location.
- Give quick INSTANT QUOTES when a customer mentions a scrap type and quantity — multiply price/kg by quantity.
- Be short (2-4 lines maximum), warm, and helpful.
- When customers want to book a pickup, direct them to the Request Pickup page or the WhatsApp number.
- Prices are indicative — always mention "final price after weighing at godown".
- Never invent prices for items not in the list — ask them to call for a custom quote.
- Reply in the language the user writes in (English or Kannada)."""


@api_router.post("/ai/chat", response_model=ChatOut)
@limiter.limit("20/minute")
async def ai_chat(request: Request, body: ChatIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    try:
        system_prompt = await _build_ai_system_prompt()
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=body.session_id,
            system_message=system_prompt,
        ).with_model("openai", "gpt-5.4-mini")
        response = await chat.send_message(UserMessage(text=body.message))
        return ChatOut(session_id=body.session_id, reply=str(response))
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail="AI assistant temporarily unavailable. Please call us directly.")


# ------------- SEO endpoints -------------
@api_router.get("/robots.txt", response_class=PlainTextResponse)
async def robots():
    return """User-agent: *
Allow: /
Disallow: /admin
Disallow: /login

Sitemap: /api/sitemap.xml
"""


@api_router.get("/sitemap.xml")
async def sitemap(request: Request):
    # Prefer PUBLIC_URL env var (canonical https), fallback to request base_url
    base = os.environ.get("PUBLIC_URL", "").rstrip("/")
    if not base:
        base = str(request.base_url).rstrip("/").replace("/api", "")
    urls = ["/", "/prices", "/services", "/gallery", "/pickup", "/contact"]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        xml += f"  <url><loc>{base}{u}</loc><changefreq>daily</changefreq><priority>{1.0 if u == '/' else 0.7}</priority></url>\n"
    xml += "</urlset>"
    return Response(content=xml, media_type="application/xml")


def _send_reset_email(to_email: str, reset_link: str, business_name: str = "NK Prestige Steel") -> bool:
    """Send password-reset email via Resend. Returns True on success, False otherwise."""
    if not RESEND_API_KEY:
        return False
    try:
        html = f"""
        <div style="font-family: 'Manrope', Arial, sans-serif; background: #060B14; color: #fff; padding: 32px; max-width: 560px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #8a6f18 100%); padding: 20px; margin-bottom: 24px;">
            <h1 style="margin:0; color:#060B14; font-size: 22px; letter-spacing: -0.02em;">{business_name}</h1>
          </div>
          <h2 style="color:#D4AF37; font-size: 18px; letter-spacing:0.02em; text-transform:uppercase;">Password reset requested</h2>
          <p style="color:#94A3B8; line-height:1.6;">Hi Admin,<br/>We received a request to reset your admin password. Click the button below to choose a new one. This link is valid for <b>1 hour</b>.</p>
          <div style="margin: 28px 0;">
            <a href="{reset_link}" style="background:#D4AF37; color:#060B14; padding: 14px 28px; text-decoration:none; font-weight:600; letter-spacing:0.02em; text-transform:uppercase;">Reset Password</a>
          </div>
          <p style="color:#94A3B8; font-size:12px; line-height:1.6;">If you didn't request this, please ignore this email — your password will stay the same.<br/>Or copy and paste this link into your browser:<br/><span style="color:#D4AF37; word-break:break-all;">{reset_link}</span></p>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin: 32px 0;" />
          <p style="color:#94A3B8; font-size:11px;">Sent by {business_name} · This is an automated message.</p>
        </div>
        """
        resend_sdk.Emails.send({
            "from": RESEND_FROM,
            "to": [to_email],
            "subject": f"Reset your {business_name} admin password",
            "html": html,
        })
        return True
    except Exception as e:
        logger.error(f"Resend send failed: {e}")
        return False


@api_router.post("/auth/forgot-password")
@limiter.limit("5/hour")
async def forgot_password(request: Request, body: ForgotPasswordIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    # Always return ok (don't leak whether email exists)
    if not user:
        return {"ok": True, "message": "If the email exists, a reset link has been sent."}
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "email": email,
        "expires_at": expires,
        "used": False,
        "created_at": now_iso(),
    })
    reset_link = f"{os.environ.get('PUBLIC_URL', '')}/reset-password?token={token}"
    logger.info(f"[PASSWORD RESET] For {email} — link: {reset_link}")

    business_name = "NK Prestige Steel Corporation"
    info_doc = await db.business_info.find_one({"_id": "singleton"})
    if info_doc and info_doc.get("business_name"):
        business_name = info_doc["business_name"]

    email_sent = _send_reset_email(email, reset_link, business_name)
    resp = {"ok": True, "message": "If the email exists, a reset link has been sent."}
    # Only expose debug_link when email delivery is NOT configured / failed —
    # keeps behaviour identical in production once a real RESEND_API_KEY is set.
    if not email_sent:
        resp["debug_link"] = reset_link
    return resp


@api_router.post("/auth/reset-password")
@limiter.limit("10/hour")
async def reset_password(request: Request, body: ResetPasswordIn):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or already-used token")
    expires = rec["expires_at"]
    if isinstance(expires, str):
        expires = datetime.fromisoformat(expires)
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Token expired")
    await db.users.update_one(
        {"email": rec["email"]},
        {"$set": {"password_hash": hash_password(body.new_password)}},
    )
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    await db.login_attempts.delete_one({"_id": f"email:{rec['email']}"})
    return {"ok": True}


@api_router.post("/auth/change-password")
async def change_password(body: ChangePasswordIn, admin=Depends(get_current_admin)):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    user = await db.users.find_one({"email": admin["sub"]})
    if not user or not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    await db.users.update_one(
        {"email": admin["sub"]},
        {"$set": {"password_hash": hash_password(body.new_password)}},
    )
    return {"ok": True}


# ------------- Projects -------------
@api_router.get("/projects", response_model=List[Project])
async def list_projects(only_visible: bool = False):
    q = {"visible": True} if only_visible else {}
    docs = await db.projects.find(q, {"_id": 0}).sort("order", 1).to_list(1000)
    return [Project(**d) for d in docs]


@api_router.post("/projects", response_model=Project)
async def create_project(body: ProjectIn, admin=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return Project(**doc)


@api_router.put("/projects/{pid}", response_model=Project)
async def update_project(pid: str, body: ProjectIn, admin=Depends(get_current_admin)):
    await db.projects.update_one({"id": pid}, {"$set": body.model_dump()})
    doc = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return Project(**doc)


@api_router.delete("/projects/{pid}")
async def delete_project(pid: str, admin=Depends(get_current_admin)):
    await db.projects.delete_one({"id": pid})
    return {"ok": True}


# ------------- Company Brochure PDF -------------
@api_router.get("/brochure.pdf")
async def brochure_pdf():
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from html import escape

    info_doc = await db.business_info.find_one({"_id": "singleton"}) or {}
    services = await db.services.find({"visible": True}, {"_id": 0}).sort("order", 1).to_list(200)
    prices = await db.prices.find({"visible": True}, {"_id": 0}).sort("category", 1).to_list(200)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm, topMargin=20*mm, bottomMargin=18*mm,
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Tag", fontSize=12, leading=15, textColor=colors.HexColor("#6b7280")))
    styles.add(ParagraphStyle(name="Gold", fontSize=10, leading=13, textColor=colors.HexColor("#8a6f18"), fontName="Helvetica-Bold"))

    def header(canvas, d):
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#060B14"))
        canvas.rect(0, A4[1] - 16*mm, A4[0], 16*mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#D4AF37"))
        canvas.setFont("Helvetica-Bold", 12)
        canvas.drawString(18*mm, A4[1] - 10*mm, info_doc.get("business_name", "NK Prestige Steel"))
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(A4[0] - 18*mm, A4[1] - 10*mm, f"GST: {info_doc.get('gst_number', '')}")
        canvas.setFillColor(colors.HexColor("#94A3B8"))
        canvas.setFont("Helvetica", 8)
        canvas.drawRightString(A4[0] - 18*mm, 10*mm, f"Page {d.page}")
        canvas.restoreState()

    story = []
    story.append(Paragraph(escape(info_doc.get("business_name", "NK Prestige Steel Corporation")), styles["Title"]))
    story.append(Paragraph(escape(info_doc.get("tagline", "")), styles["Tag"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(escape(info_doc.get("subtitle", "")), styles["BodyText"]))
    story.append(Spacer(1, 16))

    # Services
    story.append(Paragraph("What We Buy & Do", styles["Heading2"]))
    svc_rows = []
    for s in services[:24]:
        svc_rows.append([f"• {escape(s.get('title', ''))}", escape((s.get('description') or '')[:80])])
    if svc_rows:
        t = Table(svc_rows, colWidths=[55*mm, 115*mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#8a6f18")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
    story.append(Spacer(1, 16))

    # Prices
    story.append(Paragraph("Today's Live Scrap Prices", styles["Heading2"]))
    price_rows = [["Category", "Item", "Rate (₹/kg)"]]
    for p in prices[:30]:
        price_rows.append([
            escape(p.get("category", "")),
            escape(p.get("name", "")),
            f"₹{p.get('price_per_kg', 0):,.2f}",
        ])
    pt = Table(price_rows, colWidths=[45*mm, 90*mm, 35*mm], repeatRows=1)
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0A1128")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#D4AF37")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (2, 1), (2, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(pt)
    story.append(Spacer(1, 16))

    # Contact
    story.append(Paragraph("Contact & Locations", styles["Heading2"]))
    all_phones = ", ".join([info_doc.get("phone", "")] + (info_doc.get("extra_phones") or []))
    story.append(Paragraph(f"<b>Phone:</b> {escape(all_phones)}", styles["BodyText"]))
    story.append(Paragraph(f"<b>WhatsApp:</b> {escape(info_doc.get('whatsapp', ''))}", styles["BodyText"]))
    story.append(Paragraph(f"<b>Email:</b> {escape(info_doc.get('email', ''))}", styles["BodyText"]))
    story.append(Paragraph(f"<b>Office:</b> {escape(info_doc.get('office_address', ''))}", styles["BodyText"]))
    story.append(Paragraph(f"<b>Godown:</b> {escape(info_doc.get('godown_address', ''))}", styles["BodyText"]))
    story.append(Paragraph(f"<b>Working Hours:</b> {escape(info_doc.get('working_hours', ''))}", styles["BodyText"]))

    doc.build(story, onFirstPage=header, onLaterPages=header)
    buf.seek(0)
    pdf_bytes = buf.getvalue()

    fname = f"NK-Prestige-Steel-Brochure-{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


# ------------- Payment Methods -------------
@api_router.get("/payment-methods", response_model=List[PaymentMethod])
async def list_payment_methods(only_enabled: bool = False):
    q = {"enabled": True} if only_enabled else {}
    docs = await db.payment_methods.find(q, {"_id": 0}).sort("order", 1).to_list(200)
    return [PaymentMethod(**d) for d in docs]


@api_router.post("/payment-methods", response_model=PaymentMethod)
async def create_payment_method(body: PaymentMethodIn, admin=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = now_iso()
    await db.payment_methods.insert_one(doc)
    doc.pop("_id", None)
    return PaymentMethod(**doc)


@api_router.put("/payment-methods/{pid}", response_model=PaymentMethod)
async def update_payment_method(pid: str, body: PaymentMethodIn, admin=Depends(get_current_admin)):
    await db.payment_methods.update_one({"id": pid}, {"$set": body.model_dump()})
    doc = await db.payment_methods.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return PaymentMethod(**doc)


@api_router.delete("/payment-methods/{pid}")
async def delete_payment_method(pid: str, admin=Depends(get_current_admin)):
    await db.payment_methods.delete_one({"id": pid})
    return {"ok": True}


# ------------- Generic Image Upload (QR / favicon / hero) -------------
@api_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), folder: str = "misc", admin=Depends(get_current_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "png"
    content_type = file.content_type or "image/png"
    path = f"{APP_NAME}/{folder}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    await aput_object(path, data, content_type)
    return {"path": path, "url": f"/api/files/{path}"}


# ------------- Gallery Reorder -------------
class ReorderIn(BaseModel):
    ids: List[str]


@api_router.post("/gallery/reorder")
async def reorder_gallery(body: ReorderIn, admin=Depends(get_current_admin)):
    for i, gid in enumerate(body.ids):
        await db.gallery.update_one({"id": gid}, {"$set": {"order": i}})
    return {"ok": True, "count": len(body.ids)}


# ------------- Backup / Restore -------------
BACKUP_COLLECTIONS = ["business_info", "prices", "services", "testimonials", "faqs", "gallery", "projects", "payment_methods", "pickups"]


@api_router.get("/backup")
async def backup(admin=Depends(get_current_admin)):
    """Export full site data as a JSON file."""
    dump = {"exported_at": now_iso(), "version": 1, "collections": {}}
    for c in BACKUP_COLLECTIONS:
        docs = await db[c].find({}, {"_id": 0}).to_list(10000)
        dump["collections"][c] = docs
    import json as _json
    body = _json.dumps(dump, default=str, indent=2)
    fname = f"nk-prestige-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    return Response(
        content=body,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


@api_router.post("/restore")
async def restore(file: UploadFile = File(...), replace: bool = False, admin=Depends(get_current_admin)):
    """Import backup JSON. When replace=True, empties each collection first."""
    import json as _json
    raw = await file.read()
    try:
        dump = _json.loads(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid backup file")
    cols = dump.get("collections", {})
    summary = {}
    for c, docs in cols.items():
        if c not in BACKUP_COLLECTIONS:
            continue
        if replace:
            await db[c].delete_many({})
        n = 0
        for d in docs:
            try:
                if c == "business_info":
                    d["_id"] = "singleton"
                    await db[c].update_one({"_id": "singleton"}, {"$set": {k: v for k, v in d.items() if k != "_id"}}, upsert=True)
                else:
                    if "id" in d:
                        await db[c].update_one({"id": d["id"]}, {"$set": d}, upsert=True)
                    else:
                        await db[c].insert_one(d)
                n += 1
            except Exception as e:
                logger.warning(f"Restore skipped doc in {c}: {e}")
        summary[c] = n
    return {"ok": True, "restored": summary}


# ------------- Seed / Startup -------------
DEFAULT_SERVICES = [
    ("MS Scrap", "Mild Steel scrap of all grades, purchased at best market rates.", "Wrench"),
    ("TMT Structure Scrap", "Rebar and TMT structural scrap from construction sites.", "Buildings"),
    ("Ferrous Metals", "Iron, steel, and all ferrous metal recycling solutions.", "Anvil"),
    ("Non-Ferrous Metals", "Aluminium, copper, brass, and non-ferrous metals.", "Atom"),
    ("Copper Scrap", "Bare copper wire, copper tubing, and copper components.", "Lightning"),
    ("Brass Scrap", "Brass fittings, valves, and hardware scrap.", "Coin"),
    ("Aluminium Scrap", "Aluminium sheets, extrusions, castings, and cans.", "Cube"),
    ("Stainless Steel Scrap", "SS304, SS316, and industrial stainless steel scrap.", "Diamond"),
    ("Electrical Scrap", "Panels, breakers, transformers, and electrical equipment.", "Plug"),
    ("Electronic Scrap", "PCB boards, ICs, motherboards, and electronic waste.", "Cpu"),
    ("Cable Scrap", "Copper and aluminium cable scrap with sheathing.", "Waveform"),
    ("Wire Scrap", "Insulated and bare wire scrap.", "FlowArrow"),
    ("Battery Scrap", "Lead-acid, lithium-ion, and industrial battery scrap.", "BatteryCharging"),
    ("UPS Scrap", "UPS units, inverters, and backup power system scrap.", "PlugCharging"),
    ("Generator Scrap", "DG sets, alternators, and generator components.", "Engine"),
    ("Machinery Scrap", "Old machinery, tools, and industrial equipment.", "Gear"),
    ("Factory Scrap", "Complete factory clearance and industrial scrap.", "Factory"),
    ("Office Scrap", "Office furniture, fixtures, and equipment.", "Chair"),
    ("Computer Scrap", "Desktops, servers, CPUs, and IT equipment.", "Desktop"),
    ("Laptop Scrap", "Old laptops, notebooks, and portable computers.", "Laptop"),
    ("Printer Scrap", "Printers, copiers, and office machines.", "Printer"),
    ("AC Scrap", "Window ACs, split ACs, and cooling units.", "Snowflake"),
    ("Wood Scrap", "Wooden pallets, furniture, and timber scrap.", "Tree"),
    ("Furniture Scrap", "Metal and mixed furniture recycling.", "Armchair"),
    ("Paper Scrap", "Cardboard, newspaper, and office paper.", "FilePdf"),
    ("Plastic Scrap", "HDPE, LDPE, PVC, and industrial plastic scrap.", "Bottle"),
    ("Cotton Boxes", "Cardboard cotton boxes and packaging waste.", "Package"),
    ("Building Demolition", "Complete building demolition with scrap buyback.", "Buildings"),
    ("Factory Demolition", "Industrial demolition and clearance services.", "Warehouse"),
    ("Software Company Dismantling", "IT office dismantling and asset buyback.", "Buildings"),
    ("Industrial Dismantling", "Heavy industrial dismantling with safety compliance.", "HardHat"),
    ("Civil Works", "Civil engineering and construction support.", "Ruler"),
    ("Welding Works", "On-site welding and metal fabrication.", "Flame"),
    ("Lifting & Shifting", "Heavy lifting and shifting services.", "Crane"),
    ("Industrial Waste Management", "End-to-end industrial waste handling.", "Recycle"),
]

DEFAULT_PRICES = [
    # Ferrous — Jan 2026 India market rates
    ("Ferrous", "MS Scrap (Heavy)", 44.5, 43.0),
    ("Ferrous", "MS Scrap (Light)", 40.0, 39.5),
    ("Ferrous", "TMT Rebar Scrap", 46.5, 45.5),
    ("Ferrous", "Iron Turning", 34.0, 33.0),
    ("Ferrous", "Cast Iron", 38.5, 37.5),
    # Non-Ferrous
    ("Non-Ferrous", "Copper (Bright)", 815.0, 800.0),
    ("Non-Ferrous", "Copper (Heavy)", 780.0, 770.0),
    ("Non-Ferrous", "Copper Wire (Bare)", 855.0, 840.0),
    ("Non-Ferrous", "Brass (Honey)", 525.0, 515.0),
    ("Non-Ferrous", "Brass (Mixed)", 485.0, 490.0),
    ("Non-Ferrous", "Aluminium (Sheet)", 185.0, 180.0),
    ("Non-Ferrous", "Aluminium (Cast)", 162.0, 165.0),
    ("Non-Ferrous", "Aluminium (Wire)", 205.0, 198.0),
    # Stainless
    ("Stainless", "SS 304", 135.0, 130.0),
    ("Stainless", "SS 316", 172.0, 168.0),
    ("Stainless", "SS 202", 82.0, 80.0),
    # Battery
    ("Battery", "Lead-Acid Battery", 96.0, 94.0),
    ("Battery", "Lithium-Ion Battery", 152.0, 150.0),
    ("Battery", "Inverter Battery", 92.0, 90.0),
    # Electrical
    ("Electrical", "Cable Scrap (Copper)", 500.0, 490.0),
    ("Electrical", "Cable Scrap (Aluminium)", 152.0, 148.0),
    ("Electrical", "Transformer Scrap", 72.0, 68.0),
    # Electronic
    ("Electronic", "PCB Boards (Mixed)", 230.0, 222.0),
    ("Electronic", "Motherboard Scrap", 395.0, 385.0),
    ("Electronic", "AC Compressor", 58.0, 56.0),
    ("Electronic", "Generator Scrap", 52.0, 49.0),
    # Plastic
    ("Plastic", "HDPE Plastic", 44.0, 45.0),
    ("Plastic", "PVC Plastic", 30.0, 29.0),
    # Paper
    ("Paper", "Cardboard", 15.5, 14.5),
    ("Paper", "Newspaper", 17.5, 17.0),
]

# Demo gallery items (Karnataka-appropriate scrap yard photos from stock sources)
DEFAULT_GALLERY_URLS = [
    ("https://images.unsplash.com/photo-1770068511830-a6cc498f4bfe", "Aerial Scrap Yard", "Yard Operations"),
    ("https://images.unsplash.com/photo-1767340078189-4258fbb7bd7c", "Engine Recycling", "Automotive"),
    ("https://images.pexels.com/photos/36095234/pexels-photo-36095234.jpeg", "Industrial Steel", "Steel"),
    ("https://images.pexels.com/photos/32770255/pexels-photo-32770255.jpeg", "Corporate Facility", "Facility"),
    ("https://images.pexels.com/photos/35058546/pexels-photo-35058546.jpeg", "Loading Bay", "Facility"),
    ("https://images.unsplash.com/photo-1605733513597-a8f8341084e6", "Metal Sorting", "Yard Operations"),
    ("https://images.unsplash.com/photo-1580982327559-c1202864eb05", "Recycling Process", "Recycling"),
    ("https://images.unsplash.com/photo-1611273426858-450d8e3c9fce", "Steel Fabrication", "Steel"),
]

DEFAULT_TESTIMONIALS = [
    ("Rajesh Kumar", "Bangalore", 5, "NK Prestige Steel gave me the best price for my factory scrap. Very professional team and instant payment."),
    ("Priya Sharma", "Ramanagara", 5, "Amazing service! They picked up all our old office equipment and paid us fair market rate."),
    ("Mohammed Iqbal", "Mysore", 5, "Trusted partner for our construction site scrap. Reliable, transparent, and always on time."),
    ("Anita Reddy", "Bangalore", 5, "The online pickup request feature is so convenient. Got a quote in minutes."),
]

DEFAULT_FAQS = [
    ("What types of scrap do you buy?", "We buy all types of ferrous and non-ferrous scrap including MS, iron, copper, brass, aluminium, stainless steel, electrical, electronic, battery, machinery, and industrial scrap."),
    ("How are scrap prices decided?", "Prices are based on daily national and international market rates. You can check our live prices page for today's rates."),
    ("Do you provide pickup service?", "Yes, we offer free pickup service across Karnataka. Request a pickup online or call us directly."),
    ("What payment methods do you offer?", "We pay via bank transfer (NEFT/RTGS/UPI) or cash for smaller quantities. Payment is instant after weighing."),
    ("Do you handle factory demolition?", "Yes, we handle complete factory and building demolition with proper safety compliance and scrap buyback."),
    ("What is your service area?", "Primarily Karnataka including Bangalore, Ramanagara, Mysore, Mandya, and surrounding areas. We serve pan-India for large industrial contracts."),
]


async def seed_data():
    # Admin
    existing_admin = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if not existing_admin:
        await db.users.insert_one({
            "email": ADMIN_EMAIL.lower(),
            "password_hash": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info(f"Admin seeded: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing_admin["password_hash"]):
        await db.users.update_one(
            {"email": ADMIN_EMAIL.lower()},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )
        logger.info("Admin password refreshed")

    # Business info
    if not await db.business_info.find_one({"_id": "singleton"}):
        info = BusinessInfo()
        await db.business_info.insert_one({"_id": "singleton", **info.model_dump()})

    # Services
    if await db.services.count_documents({}) == 0:
        for i, (title, desc, icon) in enumerate(DEFAULT_SERVICES):
            await db.services.insert_one({
                "id": str(uuid.uuid4()),
                "title": title,
                "description": desc,
                "icon": icon,
                "image_url": None,
                "order": i,
                "visible": True,
            })
        logger.info(f"Seeded {len(DEFAULT_SERVICES)} services")

    # Prices
    if await db.prices.count_documents({}) == 0:
        for cat, name, today, prev in DEFAULT_PRICES:
            await db.prices.insert_one({
                "id": str(uuid.uuid4()),
                "category": cat,
                "name": name,
                "unit": "kg",
                "price_per_kg": today,
                "price_per_ton": today * 1000,
                "previous_price": prev,
                "notes": "",
                "visible": True,
                "updated_at": now_iso(),
            })
        logger.info(f"Seeded {len(DEFAULT_PRICES)} prices")

    # Testimonials
    if await db.testimonials.count_documents({}) == 0:
        for name, loc, rating, msg in DEFAULT_TESTIMONIALS:
            await db.testimonials.insert_one({
                "id": str(uuid.uuid4()),
                "name": name,
                "location": loc,
                "rating": rating,
                "message": msg,
                "avatar_url": None,
                "visible": True,
            })

    # FAQs
    if await db.faqs.count_documents({}) == 0:
        for i, (q, a) in enumerate(DEFAULT_FAQS):
            await db.faqs.insert_one({
                "id": str(uuid.uuid4()),
                "question": q,
                "answer": a,
                "order": i,
                "visible": True,
            })

    # Seed default payment methods
    if await db.payment_methods.count_documents({}) == 0:
        info = await db.business_info.find_one({"_id": "singleton"}) or {}
        phone_no = (info.get("phone", "+91 9741309869") or "").replace(" ", "").replace("+", "")
        defaults = [
            ("UPI", "UPI (Google Pay / PhonePe / Paytm)", f"{phone_no}@paytm", True, 0),
            ("BANK", "Bank Transfer (NEFT / RTGS / IMPS)", "Bank: SBI\nA/C: 3xxxxxxxx\nIFSC: SBIN0XXXXXX\nBranch: Ramanagara", True, 1),
            ("CASH", "Cash on Pickup", "Available for small pickups; instant payment upon weighing.", True, 2),
            ("CHEQUE", "Cheque / DD", "Payable to 'NK Prestige Steel Corporation'.", True, 3),
        ]
        for kind, label, details, enabled, order in defaults:
            await db.payment_methods.insert_one({
                "id": str(uuid.uuid4()),
                "kind": kind,
                "label": label,
                "details": details,
                "qr_image_url": None,
                "enabled": enabled,
                "order": order,
                "created_at": now_iso(),
            })
        logger.info("Seeded default payment methods")

    # Migration v2: update to 2026 prices + add extra phone + seed demo gallery
    settings = await db.settings.find_one({"_id": "seed"}) or {}
    version = settings.get("version", 1)
    if version < 2:
        # Update all seeded prices to their DEFAULT_PRICES values (matches by name)
        for cat, name, today, prev in DEFAULT_PRICES:
            existing = await db.prices.find_one({"name": name})
            if existing:
                await db.prices.update_one(
                    {"name": name},
                    {"$set": {
                        "category": cat,
                        "price_per_kg": today,
                        "price_per_ton": today * 1000,
                        "previous_price": prev,
                        "updated_at": now_iso(),
                    }},
                )
        # Ensure extra phone/whatsapp is populated for existing business_info
        info_doc = await db.business_info.find_one({"_id": "singleton"})
        if info_doc:
            extras_p = info_doc.get("extra_phones") or []
            extras_w = info_doc.get("extra_whatsapps") or []
            if "+91 8310064128" not in extras_p:
                extras_p.append("+91 8310064128")
            if "+91 8310064128" not in extras_w:
                extras_w.append("+91 8310064128")
            await db.business_info.update_one(
                {"_id": "singleton"},
                {"$set": {
                    "extra_phones": extras_p,
                    "extra_whatsapps": extras_w,
                    "extra_emails": info_doc.get("extra_emails", []),
                    "additional_addresses": info_doc.get("additional_addresses", []),
                }},
            )
        # Seed demo gallery items if empty
        if await db.gallery.count_documents({}) == 0:
            for i, (url, title, cat) in enumerate(DEFAULT_GALLERY_URLS):
                await db.gallery.insert_one({
                    "id": str(uuid.uuid4()),
                    "title": title,
                    "caption": "",
                    "category": cat,
                    "media_type": "image",
                    "file_path": url,
                    "order": i,
                    "visible": True,
                    "created_at": now_iso(),
                })
            logger.info(f"Seeded {len(DEFAULT_GALLERY_URLS)} demo gallery items")

        await db.settings.update_one({"_id": "seed"}, {"$set": {"version": 2}}, upsert=True)
        logger.info("Migration v2 applied: updated prices, extra phone, demo gallery")

    # Migration v3: replace old tagline
    if version < 3:
        await db.business_info.update_one(
            {"_id": "singleton", "tagline": "India's Trusted Scrap Recycling Partner"},
            {"$set": {"tagline": "Premium Scrap Recycling & Metal Trading"}},
        )
        await db.settings.update_one({"_id": "seed"}, {"$set": {"version": 3}}, upsert=True)
        logger.info("Migration v3 applied: rebranded tagline")


@app.on_event("startup")
async def on_startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.prices.create_index("id", unique=True)
        await db.services.create_index("id", unique=True)
        await db.testimonials.create_index("id", unique=True)
        await db.faqs.create_index("id", unique=True)
        await db.gallery.create_index("id", unique=True)
        await db.pickups.create_index("id", unique=True)
        await db.projects.create_index("id", unique=True)
        await db.payment_methods.create_index("id", unique=True)
        await db.password_reset_tokens.create_index("token", unique=True)
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
        await db.login_attempts.create_index("_id")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
    await seed_data()
    init_storage()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


@api_router.get("/")
async def root():
    return {"service": "NK Prestige Steel API", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
