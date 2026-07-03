# NK Prestige Steel Corporation — Product Requirements Doc

## Original Problem Statement
Build a world-class premium 3D scrap business website for NK Prestige Steel Corporation with live daily scrap prices, one-click contact, premium gallery, services CMS, admin dashboard, 3D animations, SEO, and PWA support.

## Tech Stack
- Frontend: React 19, Tailwind CSS, GSAP, @react-three/fiber v9, @react-three/drei, Framer Motion, dnd-kit, Lucide, Sonner
- Backend: FastAPI, MongoDB (Motor), slowapi (rate limit), httpx.AsyncClient, ReportLab, Resend, bcrypt/passlib, PyJWT
- LLM: Emergent Universal Key (Gemini/Claude/OpenAI)

## Personas
- **Business Owner (Admin)**: Manages prices, gallery, services, hero, backups
- **Customer/Visitor**: Views today's prices, requests pickup, contacts owner

## Implemented (as of Feb 2026)
- 3D hero, animated statistics, glassmorphism, dark theme
- Live scrap prices with trends, filters, CSV import/export
- One-click contact bar (call/WhatsApp/email/Maps)
- Gallery with masonry + dnd-kit drag/drop reorder
- Services CMS, testimonials, FAQ, pickup enquiry with photo upload
- Admin dashboard (auth-protected) with backup/restore, hero editor, payments CMS
- Multi-language EN/KN, PWA manifest/service worker, sitemap.xml, robots.txt
- Brute-force lockout + slowapi rate limiting
- AI chat widget (Emergent LLM key)
- PDF brochure via ReportLab
- Password reset flow with Resend email fallback

## Admin Credentials (current)
- Email: `noor011.mk@gmail.com`
- Password: `@2X!15NjXI#S`

## Public Contact
- Phone / WhatsApp: +91 9741309869
- Email: nkprestigesteel@gmail.com

## Backlog / Next
- P1: Top up Emergent LLM budget to re-enable AI chat
- P1: Add Resend API key for real password-reset emails (currently returns debug_link)
- P2: Custom domain wiring after deployment
- P2: More detailed analytics dashboard
