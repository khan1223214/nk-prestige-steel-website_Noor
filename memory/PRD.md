# NK Prestige Steel Corporation — Product Requirements Doc

## Original Problem Statement
World-class premium website for NK Prestige Steel Corporation (scrap dealer, Karnataka, India). Fortune-500 industrial design (dark navy blue + steel grey + gold accent, glassmorphism, Three.js 3D). Fully responsive, SEO-optimized, mobile-friendly, production-ready. React + FastAPI + MongoDB. Deployable on Hostinger with custom domain.

## Company Info
- Business: **NK Prestige Steel Corporation**
- GST: `29KZRPK1994P1ZV`
- Primary Phone / WhatsApp: `+91 9741309869`
- Additional Phone / WhatsApp: `+91 8310064128` (extra_phones / extra_whatsapps)
- Email: `nkprestigesteel@gmail.com`
- Office: Troop Lane Main Road, Near Jai Bheem Circle, Ramanagara – 562159, Karnataka
- Godown: 278/1 Near Kannamangaladoddi, Close to State Highway 275, Ramanagara – 562159, Karnataka

## Admin Credentials
- Email: `admin@nkprestigesteel.com`
- Password: `NK@Prestige2026`

## Brand / Copy
- Hero H1: **Karnataka's Premium Scrap Dealer**
- Tagline: **Premium Scrap Dealer & Metal Trading**
- Stats: **400+ Happy Clients · 5+ Years Experience · 40+ Pickup Locations** (Tonnes-Recycled removed)

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), JWT bearer auth, Emergent object storage, emergentintegrations LLM (`openai gpt-5.4-mini`), slowapi rate limiting, brute-force lockout (email-keyed, 5 fails → 15 min).
- **Frontend**: React 19 + Router 7 + Tailwind + Shadcn UI + @react-three/fiber v9 + framer-motion + react-fast-marquee + Phosphor Icons + custom i18n (EN + KN).
- **SEO**: React 19 native `<title>`/`<meta>` hoisting via `<Seo />`; sitemap.xml + robots.txt (both `/api/…` and static in `/public`); LocalBusiness JSON-LD on Home; `PUBLIC_URL` env var for canonical https base.
- **DB**: users, business_info (singleton with extra_phones/whatsapps/emails + additional_addresses), prices, services, testimonials, faqs, gallery (with demo Unsplash/Pexels URLs seeded), pickups, newsletter, login_attempts, settings (seed version).

## Implemented Features
### Iteration 1 (MVP)
- ✅ Fortune-500 dark navy + gold theme; Three.js hero (gold ingot + orbiting shards + truck chassis)
- ✅ Live scrap prices (30 items), search/filter/sort/auto-refresh, printable, scrolling ticker
- ✅ 35 services with cards & search
- ✅ Gallery masonry + lightbox
- ✅ Pickup request form with media upload (object storage)
- ✅ Contact page with office + godown addresses, Google Maps embed
- ✅ Floating contact bar (Call/WhatsApp/Email/Maps/Back-to-Top)
- ✅ Newsletter, JWT admin login, Admin CMS (7 tabs incl. Business Info, Prices, Services, Gallery, Testimonials, FAQ, Pickups)
- ✅ CSV / Excel import-export for prices

### Iteration 2 (P1) — 2026-07-01
- ✅ Updated all scrap prices to **Jan 2026 rates** via idempotent v2 migration
- ✅ Seeded 8 demo gallery items (Unsplash/Pexels)
- ✅ **Multiple contact numbers/addresses/emails** (extra_phones, extra_whatsapps, extra_emails, additional_addresses arrays)
- ✅ Added `+91 8310064128` as extra phone/WhatsApp; Admin can add/remove any of them via new Business Info editors
- ✅ **Multi-language toggle (EN / KN Kannada)** with `<I18nProvider>` + navbar `<Translate>` button, persists in localStorage
- ✅ **AI Chat / Instant Quote assistant** — floating widget above contact bar, uses Emergent LLM key (openai gpt-5.4-mini). System prompt injects live scrap prices + business info; multi-turn session persistence via `session_id`
- ✅ **SEO**: `<Seo />` component per route (title / description / OG / Twitter / canonical / robots), `<LocalBusinessSchema />` JSON-LD on Home, `/robots.txt` (via `/api` + static), `/sitemap.xml` (via `/api` + static) with `PUBLIC_URL` canonical https base
- ✅ **Brute-force lockout** — 5 wrong passwords per email → 15-min lockout, keyed by email (IP-rotation-safe)
- ✅ **Rate limits (slowapi + X-Forwarded-For real client IP)**: login 10/min, newsletter 5/hour, pickup 10/hour, ai chat 20/min
- ✅ Rebrand: "India's Trusted" removed; hero shows **"Karnataka's Premium Scrap Dealer"**; all "scrap recycler/recycling" → "scrap dealer"; stats reduced to 3 (Happy Clients / Years / Locations)
- ✅ Admin Gallery correctly renders both uploaded and URL-based items

## Backlog / Deferred
### P1 (next)
- PWA — installable mobile app + service worker + offline shell
- Google Analytics + Search Console verification
- Voice search + smart search
- Before/After image slider in gallery
- Projects section (with location, customer, completion date)
- Backup / Restore / full DB Export-Import from admin
- Password reset flow
- Downloadable company brochure (PDF generator)
- Native "Share Website" via Web Share API + print scrap price list refinements

### P2
- Migrate object storage IO from sync `requests` → `httpx.AsyncClient`
- Split server.py (~1080 lines) into routers/models/seed modules
- Global IP-based enumeration backoff on top of per-email lockout
- Google Reviews embed / live news block on home

## Deployment (Hostinger)
1. `cd frontend && yarn build` → serve `build/` via Hostinger static hosting or nginx
2. Deploy FastAPI (`uvicorn server:app --host 0.0.0.0 --port 8001`) on a VPS or Hostinger Cloud
3. Hosted MongoDB (Atlas) → `MONGO_URL`
4. Set `EMERGENT_LLM_KEY` for object storage + AI chat
5. Set `PUBLIC_URL="https://your-domain.com"` for canonical sitemap URLs
6. Update `REACT_APP_BACKEND_URL` and rebuild frontend
7. Point domain `A`/`CNAME` at Hostinger; make sure ingress passes `X-Forwarded-For` header for correct rate limiting
