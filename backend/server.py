from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import io
import uuid
import logging
import bcrypt
import jwt as pyjwt
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Header, Query, Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
import pandas as pd

# ------------- Config -------------
mongo_url = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@nkprestigesteel.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'NK@Prestige2026')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
APP_NAME = os.environ.get('APP_NAME', 'nk-prestige-steel')

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"

client = AsyncIOMotorClient(mongo_url)
db = client[DB_NAME]

app = FastAPI(title="NK Prestige Steel API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


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
        # refresh key and retry once
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


class BusinessInfo(BaseModel):
    business_name: str = "NK Prestige Steel Corporation"
    tagline: str = "India's Trusted Scrap Recycling Partner"
    subtitle: str = "We Buy All Types of Scrap at the Best Market Price"
    phone: str = "+91 9741309869"
    whatsapp: str = "+91 9741309869"
    email: str = "nkprestigesteel@gmail.com"
    office_address: str = "Troop Lane Main Road, Near Jai Bheem Circle, Ramanagara - 562159, Karnataka"
    godown_address: str = "278/1 Near Kannamangaladoddi, Close to State Highway 275, Ramanagara - 562159, Karnataka"
    gst_number: str = "29KZRPK1994P1ZV"
    google_maps_url: str = "https://maps.google.com/?q=Ramanagara+Karnataka"
    working_hours: str = "Mon-Sat: 9:00 AM - 7:00 PM"
    facebook: str = ""
    instagram: str = ""
    linkedin: str = ""
    twitter: str = ""
    youtube: str = ""


class NewsletterIn(BaseModel):
    email: EmailStr


# ------------- Auth Routes -------------
@api_router.post("/auth/login", response_model=TokenOut)
async def login(body: LoginIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
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
    put_object(path, data, content_type)
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


@api_router.get("/files/{file_path:path}")
async def get_file(file_path: str):
    """Public file serving for gallery/pickup media."""
    data, content_type = get_object(file_path)
    return Response(content=data, media_type=content_type)


# ------------- Pickup Requests -------------
@api_router.post("/pickup", response_model=PickupRequest)
async def create_pickup(body: PickupRequestIn):
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
    put_object(path, data, content_type)
    return {"path": path, "url": f"/api/files/{path}"}


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
async def newsletter(body: NewsletterIn):
    await db.newsletter.update_one(
        {"email": body.email.lower()},
        {"$set": {"email": body.email.lower(), "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


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
    ("Ferrous", "MS Scrap (Heavy)", 42.5, 41.0),
    ("Ferrous", "MS Scrap (Light)", 38.0, 37.5),
    ("Ferrous", "TMT Rebar Scrap", 44.0, 43.5),
    ("Ferrous", "Iron Turning", 32.0, 33.0),
    ("Ferrous", "Cast Iron", 36.5, 36.0),
    ("Non-Ferrous", "Copper (Bright)", 785.0, 770.0),
    ("Non-Ferrous", "Copper (Heavy)", 745.0, 740.0),
    ("Non-Ferrous", "Copper Wire (Bare)", 820.0, 810.0),
    ("Non-Ferrous", "Brass (Honey)", 505.0, 500.0),
    ("Non-Ferrous", "Brass (Mixed)", 465.0, 470.0),
    ("Non-Ferrous", "Aluminium (Sheet)", 175.0, 172.0),
    ("Non-Ferrous", "Aluminium (Cast)", 155.0, 158.0),
    ("Non-Ferrous", "Aluminium (Wire)", 195.0, 190.0),
    ("Stainless", "SS 304", 128.0, 125.0),
    ("Stainless", "SS 316", 165.0, 160.0),
    ("Stainless", "SS 202", 78.0, 76.0),
    ("Battery", "Lead-Acid Battery", 92.0, 90.0),
    ("Battery", "Lithium-Ion Battery", 145.0, 148.0),
    ("Battery", "Inverter Battery", 88.0, 86.0),
    ("Electrical", "Cable Scrap (Copper)", 480.0, 475.0),
    ("Electrical", "Cable Scrap (Aluminium)", 145.0, 142.0),
    ("Electrical", "Transformer Scrap", 68.0, 65.0),
    ("Electronic", "PCB Boards (Mixed)", 220.0, 215.0),
    ("Electronic", "Motherboard Scrap", 380.0, 375.0),
    ("Electronic", "AC Compressor", 55.0, 54.0),
    ("Electronic", "Generator Scrap", 48.0, 46.0),
    ("Plastic", "HDPE Plastic", 42.0, 43.0),
    ("Plastic", "PVC Plastic", 28.0, 27.5),
    ("Paper", "Cardboard", 14.0, 13.5),
    ("Paper", "Newspaper", 16.5, 16.0),
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
