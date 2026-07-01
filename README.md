# NK Prestige Steel Corporation — Website

A premium, Fortune-500 style industrial website for NK Prestige Steel Corporation (scrap recycling, Karnataka).

## Stack
- **Frontend**: React 19 · Tailwind · Shadcn UI · @react-three/fiber · Framer Motion · Phosphor Icons
- **Backend**: FastAPI · Motor (MongoDB) · JWT auth · Emergent Object Storage
- **DB**: MongoDB

## Local Development

```bash
# Backend
cd /app/backend
pip install -r requirements.txt
# Uvicorn is managed by supervisor: sudo supervisorctl restart backend

# Frontend
cd /app/frontend
yarn install
# Managed by supervisor: sudo supervisorctl restart frontend
```

Environment variables:
- `backend/.env`: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `EMERGENT_LLM_KEY`, `APP_NAME`, `CORS_ORIGINS`
- `frontend/.env`: `REACT_APP_BACKEND_URL`

## Admin
- Login URL: `/login`
- Default credentials: `admin@nkprestigesteel.com` / `NK@Prestige2026` (see `/app/memory/test_credentials.md`)
- Dashboard: Business Info · Scrap Prices · Services · Gallery · Testimonials · FAQ · Pickup Requests
- CSV import/export for prices.

## Public Routes
| Path | Description |
|------|-------------|
| `/` | Home — 3D hero, ticker, prices preview, services, gallery preview, testimonials, FAQ |
| `/prices` | Full live scrap price table with search / filter / sort / auto-refresh |
| `/services` | All 35 scrap services with search |
| `/gallery` | Masonry gallery with lightbox and category filter |
| `/pickup` | Free pickup request form with photo/video upload |
| `/contact` | Office + Godown addresses, contact info, Google Maps |
| `/login` | Admin login |
| `/admin` | Admin CMS (JWT protected) |

## Deployment (Hostinger)
1. Build frontend: `cd frontend && yarn build`
2. Serve `frontend/build/` via Hostinger static hosting or nginx
3. Deploy FastAPI backend (`uvicorn server:app --host 0.0.0.0 --port 8001`) on a VPS or Hostinger Cloud
4. Point a hosted MongoDB (Atlas / hosted) via `MONGO_URL`
5. Set `EMERGENT_LLM_KEY` for object storage (or migrate to S3/local uploads for production)
6. Update `REACT_APP_BACKEND_URL` to the deployed backend domain and rebuild the frontend
7. Point your custom domain's `A`/`CNAME` records at Hostinger.

## Test Credentials
See `/app/memory/test_credentials.md`.
