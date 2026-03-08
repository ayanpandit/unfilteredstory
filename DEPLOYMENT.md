# UnfilterStory — Deployment Guide

## Architecture

| Component | Platform | URL Pattern |
| --------- | -------- | ----------- |
| Backend API | Render / Railway | `https://your-api.onrender.com` |
| PostgreSQL | Render / Railway | Managed by platform |
| CMS | Vercel | `https://your-cms.vercel.app` |
| Frontend | Vercel | `https://your-frontend.vercel.app` |

---

## 1. Deploy Backend + Database on Render

### Option A: Blueprint (recommended)

1. Push code to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect your repo and select the root directory.
4. Render reads `render.yaml` and creates:
   - A **Web Service** (`unfilter-story-api`)
   - A **PostgreSQL** database (`unfilter-story-db`)
5. After creation, go to the web service **Environment** tab and set:
   ```
   CORS_ORIGIN=https://your-frontend.vercel.app,https://your-cms.vercel.app
   ```
6. The `DATABASE_URL` and `JWT_SECRET` are auto-configured.

### Option B: Manual Setup

1. **Create PostgreSQL database** on Render:
   - Dashboard → New → PostgreSQL
   - Name: `unfilter-story-db`
   - Copy the **Internal Database URL** (for same-region services) or **External Database URL**

2. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect your GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm ci && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && node dist/src/main`
   - Environment: **Node**

3. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<your-postgres-connection-string>
   JWT_SECRET=<generate-a-strong-secret>
   CORS_ORIGIN=https://your-frontend.vercel.app,https://your-cms.vercel.app
   ```

   Generate a JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### Railway Alternative

1. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub.
2. Add a **PostgreSQL** service from the Railway marketplace.
3. Link the backend service to the database (Railway auto-sets `DATABASE_URL`).
4. Set the remaining env vars: `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`.
5. Set build command: `npm ci && npx prisma generate && npm run build`
6. Set start command: `npx prisma migrate deploy && node dist/src/main`
7. Set root directory: `backend`

---

## 2. Deploy CMS on Vercel

1. Go to [Vercel](https://vercel.app) → **Add New** → **Project**.
2. Import your GitHub repo.
3. Set **Root Directory**: `CMS`
4. Framework Preset: **Next.js** (auto-detected).
5. Set **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
   ```
6. Click **Deploy**.

---

## 3. Deploy Frontend on Vercel

1. Same as CMS, but a separate Vercel project.
2. Set **Root Directory**: `Frontend`
3. Framework Preset: **Next.js**
4. Set **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
   ```
5. Click **Deploy**.

---

## 4. Post-Deployment Setup

### Seed the Database

After the backend is running, seed admin user data:

```bash
# SSH into your Render service or use Railway CLI
# Or run locally pointing DATABASE_URL to production DB:

DATABASE_URL="your-production-db-url" npx prisma db seed
```

This creates:
- `admin` / `admin123` (ADMIN)
- `editor` / `editor123` (EDITOR)
- `reporter` / `reporter123` (REPORTER)

> **Important**: Change these passwords immediately after first login via the CMS Account page.

### Update CORS

Once you have the final Vercel URLs, update the `CORS_ORIGIN` env var on Render/Railway:

```
CORS_ORIGIN=https://your-frontend.vercel.app,https://your-cms.vercel.app
```

### Custom Domains (optional)

- **Vercel**: Project Settings → Domains → Add your domain
- **Render**: Service Settings → Custom Domain → Add domain + configure DNS

---

## 5. Environment Variables Reference

### Backend (Render/Railway)

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing |
| `NODE_ENV` | No | `development` | Set to `production` |
| `PORT` | No | `3000` | Server port (Render uses 10000) |
| `CORS_ORIGIN` | No | `*` | Comma-separated allowed origins |
| `JWT_EXPIRATION` | No | `1d` | Token expiry duration |
| `REDIS_HOST` | No | `localhost` | Redis host (optional) |
| `REDIS_PORT` | No | `6379` | Redis port (optional) |

### CMS & Frontend (Vercel)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL with `/api/v1` suffix |

---

## Troubleshooting

### Backend won't start on Render
- Check the **Logs** tab for errors.
- Ensure `DATABASE_URL` is set correctly (use Internal URL for same-region).
- Render free tier spins down after 15 min inactivity — first request takes ~30s.

### CORS errors in browser
- Verify `CORS_ORIGIN` includes both the CMS and Frontend URLs (no trailing slash).
- Redeploy the backend after changing env vars.

### Database migrations fail
- Ensure your database is accessible from the backend service.
- Check that `prisma/migrations/` directory is included in the deploy.

### CMS/Frontend shows "API error"
- Confirm `NEXT_PUBLIC_API_URL` is set in Vercel env vars.
- Rebuild the Vercel project after adding/changing env vars (Next.js bakes `NEXT_PUBLIC_*` at build time).
