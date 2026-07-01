# NK Prestige Steel Corporation — Product Requirements Doc

## Original Problem Statement
World-class premium website for NK Prestige Steel Corporation (scrap recycling business, Karnataka, India). Fortune-500 industrial design aesthetic (dark navy blue + steel grey + gold accent, glassmorphism, Three.js 3D). Fully responsive, SEO-optimized, mobile-friendly, production-ready. React + FastAPI + MongoDB. Easy to deploy on Hostinger with custom domain.

## Company Info
- Business: **NK Prestige Steel Corporation**
- GST: `29KZRPK1994P1ZV`
- Phone / WhatsApp: `+91 9741309869`
- Email: `nkprestigesteel@gmail.com`
- Office: Troop Lane Main Road, Near Jai Bheem Circle, Ramanagara – 562159, Karnataka
- Godown: 278/1 Near Kannamangaladoddi, Close to State Highway 275, Ramanagara – 562159, Karnataka

## Admin Credentials
- Email: `admin@nkprestigesteel.com`
- Password: `NK@Prestige2026`

## Architecture
- **Backend**: FastAPI (Motor / MongoDB), JWT bearer auth, Emergent object storage for images/videos, CSV/Excel import-export with pandas/openpyxl.
- **Frontend**: React 19 + React Router 7 + Tailwind + Shadcn UI + @react-three/fiber v9 + @react-three/drei + framer-motion + react-fast-marquee + Phosphor Icons.
- **DB collections**: users, business_info (singleton), prices, services, testimonials, faqs, gallery, pickups, newsletter, login_attempts.

## User Personas
1. **Prospective scrap seller** — checks live prices, calls or WhatsApps the owner, submits a pickup request with photos.
2. **Corporate/factory client** — reviews services, reads testimonials, downloads GST invoice details, contacts sales.
3. **Admin (owner)** — logs in, updates daily scrap prices, uploads gallery photos, manages pickup requests, edits company info without touching code.

## Implemented Features (Iteration 1 — 2026-07-01)
- ✅ Hero with 3D scene (gold ingot + orbiting metal shards + truck chassis silhouette + particle field)
- ✅ Animated stat counters (rAF), fade-in transitions (framer-motion)
- ✅ Scrolling live price ticker (react-fast-marquee) with trend arrows
- ✅ Live scrap prices page — 30 seeded prices, search, category filter, sort, auto-refresh, printable list
- ✅ Services page — 35 seeded services with search
- ✅ Gallery — masonry layout, category filter, lightbox modal (fallback demo images when empty)
- ✅ Pickup request form — media upload (image/video) to Emergent object storage
- ✅ Contact page — dual addresses (office + godown), Google Maps embed
- ✅ Floating contact bar — one-click Call / WhatsApp / Email / Maps / Back-to-top (hidden on admin/login)
- ✅ Newsletter signup in footer
- ✅ JWT admin login + Admin CMS dashboard (Business Info, Prices, Services, Gallery, Testimonials, FAQ, Pickup Requests)
- ✅ CSV export + CSV/Excel import for scrap prices
- ✅ Idempotent admin + seed data on startup
- ✅ Fortune-500 dark navy + gold theme, Clash Display + Manrope typography, glassmorphism, hover glow, sharp edges, industrial grid background
- ✅ Fully responsive (mobile + tablet + desktop)
- ✅ 100% backend test pass (24/24), 100% frontend flows verified

## Backlog / Deferred
### P1 (next iteration)
- Multi-language toggle EN / KN (i18n)
- AI Chat Assistant + Instant Quote Assistant (Emergent LLM key)
- PWA — installable mobile app
- SEO meta / OG tags per page + sitemap.xml + robots.txt + schema.org LocalBusiness
- Google Analytics + Search Console integration
- Voice search + smart search
- Before/After image comparison slider in gallery
- Projects section (with location, customer, date)
- Backup / Restore + Export/Import full DB from admin
- Password reset flow + brute-force lockout on login (5 attempts / 15 min)
- Rate limiting on public endpoints
- Migrate `requests` (sync) to `httpx` (async) for object storage to avoid event-loop blocking

### P2
- Downloadable company brochure (PDF)
- Share website (native share API)
- Print scrap price list styling refinements
- Google Reviews embed
- Live news / market updates block on homepage
- Admin-driven color/theme editor

## Deployment
- Backend: uvicorn on port 8001 (supervisor-managed)
- Frontend: craco start on port 3000 (supervisor-managed)
- MongoDB local via `MONGO_URL`
- Object storage: Emergent (via `EMERGENT_LLM_KEY`)
- To deploy on Hostinger: build React (`yarn build`), serve `build/` statically, run FastAPI behind a reverse proxy (nginx), point MongoDB to a hosted cluster.
