# NK Prestige Steel Corporation — PRD

## Original Problem Statement
Fortune-500 industrial premium website for NK Prestige Steel Corporation (scrap dealer, Karnataka). React + FastAPI + MongoDB stack, Hostinger-deployable.

## Company Info
- **NK Prestige Steel Corporation** · GST `29KZRPK1994P1ZV`
- Primary Phone / WhatsApp: `+91 9741309869` · Extra: `+91 8310064128`
- Email: `nkprestigesteel@gmail.com`
- Office: Troop Lane Main Road, Ramanagara – 562159, Karnataka
- Godown: 278/1 Near Kannamangaladoddi, Ramanagara – 562159, Karnataka
- Website: https://nkprestigesteel.com (custom domain — pending DNS)

## Admin
- `admin@nkprestigesteel.com` / `NK@Prestige2026`
- Change password via Admin → **Change Password** tab, or `/forgot-password` flow

## Stack
React 19 + Tailwind + Shadcn UI + @react-three/fiber v9 + framer-motion + Phosphor Icons + i18n (EN/KN) + PWA. FastAPI + Motor + JWT + slowapi + brute-force lockout + emergentintegrations LLM + reportlab PDF + httpx async storage. MongoDB.

## Implemented (through Iteration 4 — 2026-07-03)
Iter 1 MVP · Iter 2 P1 (contacts + i18n + AI chat + SEO + security) · Iter 3 P1 (PWA + Projects + PDF brochure + password reset + async storage)

### Iteration 4 (this session)
- ✅ **Payment Methods** — full CRUD, kinds UPI/BANK/NEFT/RTGS/CASH/CHEQUE/OTHER, per-method QR upload (via `/api/upload-image?folder=payments`), enable/disable, order. New `/payments` public page + admin PaymentsTab. 4 defaults seeded (UPI, Bank Transfer, Cash on Pickup, Cheque/DD).
- ✅ **Hero Section media/CTA editor** — new fields on BusinessInfo: `hero_image_url`, `hero_cta_primary_label/url`, `hero_cta_secondary_label/url`. Home hero swaps to admin-uploaded image when set (falls back to 3D scene).
- ✅ **Backup & Restore** — `GET /api/backup` downloads a versioned JSON dump of all 9 collections; `POST /api/restore` accepts the file with optional `?replace=true`. Admin BackupTab with download + upload + "replace all" toggle.
- ✅ **Gallery reorder** — `POST /api/gallery/reorder` accepts `{ids: […]}`; admin Gallery tab shows up/down arrow overlays on each tile that persist the order.
- ✅ **Favicon + SEO keywords** — new `favicon_url` and `seo_keywords` fields on BusinessInfo; `useAnalytics()` hook injects `<link rel="icon">` and `<meta name="keywords">` dynamically at runtime, no rebuild needed.
- ✅ Generic image upload endpoint (`/api/upload-image?folder=…`) for QR/favicon/hero uploads.
- ✅ Backend tests: **12/12 iter-4 tests pass** (payment CRUD + JWT guard, backup roundtrip, restore, reorder + JWT guard, upload + serve, BusinessInfo new fields round-trip).

## Backlog
### P1
- Real email delivery (SendGrid/Resend) for `/forgot-password`
- Full drag-drop gallery reorder (currently up/down arrows)
- Multiple-hero-slide carousel editor
- Server-side format validation for GA ID / GSC token

### P2
- Split `server.py` (~1500 loc) into routers/models/services
- Google Reviews embed, live news, before/after slider, voice search, native Share API
- Migrate reportlab PDF gen to `asyncio.to_thread()` for higher concurrency

## Deployment (Hostinger + nkprestigesteel.com)
1. `cd /app/frontend && yarn build` → serve `build/` via Hostinger static / nginx
2. Deploy FastAPI (`uvicorn server:app --host 0.0.0.0 --port 8001`) on Hostinger VPS
3. Backend env: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EMERGENT_LLM_KEY`, `PUBLIC_URL=https://nkprestigesteel.com`, `CORS_ORIGINS=https://nkprestigesteel.com`
4. Frontend env: `REACT_APP_BACKEND_URL=https://api.nkprestigesteel.com` (or same domain + `/api` proxy), then rebuild
5. Point A/CNAME at Hostinger. Ensure ingress passes `X-Forwarded-For` (rate-limits + brute-force lockout).
6. Log into `/admin` → Business Info to paste **Google Analytics ID**, **Search Console verification**, favicon URL, and (optional) hero image URL — no code changes needed.
