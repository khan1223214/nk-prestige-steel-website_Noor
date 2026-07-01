# NK Prestige Steel Corporation — PRD

## Original Problem Statement
Fortune-500 industrial premium website for NK Prestige Steel Corporation (scrap dealer, Karnataka). React + FastAPI + MongoDB. Hostinger-deployable.

## Company Info
- **NK Prestige Steel Corporation** · GST `29KZRPK1994P1ZV`
- Primary Phone / WhatsApp: `+91 9741309869` · Extra: `+91 8310064128`
- Email: `nkprestigesteel@gmail.com`
- Office: Troop Lane Main Road, Ramanagara – 562159, Karnataka
- Godown: 278/1 Near Kannamangaladoddi, Ramanagara – 562159, Karnataka

## Admin
- `admin@nkprestigesteel.com` / `NK@Prestige2026`
- Change password via Admin → **Change Password** tab, or `/forgot-password` flow

## Brand
- Hero: **Karnataka's Premium Scrap Dealer**
- Tagline: **Premium Scrap Dealer & Metal Trading**
- Stats: **400+ Clients · 5+ Years · 40+ Pickup Locations**

## Stack
- **Backend**: FastAPI + Motor (Mongo) + JWT + slowapi rate-limit + brute-force lockout + emergentintegrations LLM (openai gpt-5.4-mini) + reportlab PDF + httpx async storage + Emergent object storage.
- **Frontend**: React 19 + Router 7 + Tailwind + Shadcn UI + @react-three/fiber v9 + framer-motion + Phosphor Icons + i18n (EN/KN).
- **PWA**: manifest.json + service-worker.js (production only).
- **SEO**: React 19 native head hoisting via `<Seo />`, LocalBusiness JSON-LD, robots.txt + sitemap.xml (PUBLIC_URL canonical), admin-configurable Google Analytics + Search Console verification.

## DB Collections
`users` · `business_info` (singleton, incl. extra_phones/whatsapps/emails/additional_addresses + google_analytics_id + google_search_console_verification) · `prices` · `services` · `testimonials` · `faqs` · `gallery` · `pickups` · `projects` · `newsletter` · `login_attempts` · `password_reset_tokens` (TTL) · `settings` (seed version)

## Implemented (through Iteration 3 — 2026-07-01)
- Iter 1 MVP: hero + 3D scene, live prices, services, gallery, pickup form, contact, floating bar, admin CMS, CSV import/export
- Iter 2 P1: multi-contact, EN/KN i18n, AI chat, SEO, brute-force lockout, rate limits, rebrand
- **Iter 3 P1 (this iteration)**:
  - ✅ **PWA** — manifest.json (installable) + service worker (offline shell) + apple-touch-icon + theme-color
  - ✅ **Google Analytics** + **Search Console verification** — admin-editable via Business Info (`google_analytics_id`, `google_search_console_verification`); auto-injected by `useAnalytics()` hook
  - ✅ **Downloadable PDF brochure** — `/api/brochure.pdf` (reportlab, gold-navy branded, includes services + live prices + contacts) with footer button
  - ✅ **Projects section** — `/projects` page + admin CRUD tab with title/description/location/customer/completion_date/image
  - ✅ **Password reset flow** — `/api/auth/forgot-password` + `/api/auth/reset-password` + `/forgot-password` + `/reset-password` pages; token single-use, 1-hour expiry, Mongo TTL cleanup
  - ✅ **Admin change-password** — `/api/auth/change-password` + Security tab in admin
  - ✅ **Async httpx storage IO** — `aput_object` / `aget_object` for gallery/pickup uploads and file serving; no more sync `requests` blocking the event loop

## Backlog
### P1
- Wire real email delivery (SendGrid/Resend) so `/forgot-password` sends actual emails
- Migrate reportlab brochure generation to `asyncio.to_thread()` for higher concurrency
- Split `server.py` (~1360 lines) into `routers/`, `models/`, `services/`
- Add server-side format validation for GA ID (`^G-[A-Z0-9]+$`) and GSC token
- Downloadable print-optimized scrap price PDF

### P2
- Google Reviews embed, live news, before/after slider, voice search, native Share API

## Deployment (Hostinger + custom domain)
1. `cd /app/frontend && yarn build` → serve `build/` via Hostinger static / nginx
2. Deploy FastAPI (`uvicorn server:app --host 0.0.0.0 --port 8001`) on Hostinger VPS
3. Set backend env: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EMERGENT_LLM_KEY`, `PUBLIC_URL=https://your-domain.com`, `CORS_ORIGINS=https://your-domain.com`
4. Set frontend env: `REACT_APP_BACKEND_URL=https://api.your-domain.com` (or same domain with `/api` path), then rebuild
5. Point A/CNAME records at Hostinger. Ensure ingress passes `X-Forwarded-For` header (rate-limits + brute-force lockout depend on it).
6. Admin → Business Info → paste your **Google Analytics ID** and **Search Console verification** value (no code change needed).
