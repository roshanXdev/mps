# Vercel Deployment Guide — IGNOU Assignment Portal

## Quick Deploy

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Vercel auto-detects the `vercel.json` config — no changes needed
4. Set environment variables (see below)
5. Click **Deploy**

---

## Required Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `ADMIN_PASSWORD` | Admin panel password | `mySecurePass123` |

### Free PostgreSQL options:
- **[Neon](https://neon.tech)** — Recommended. Free tier, serverless Postgres. Copy the connection string from Neon dashboard.
- **[Supabase](https://supabase.com)** — Free tier. Use the "Transaction pooler" connection string.
- **[Railway](https://railway.app)** — Free tier. Use the connection string from Railway dashboard.

---

## How the Deployment Works

```
vercel.json
├── buildCommand  → compiles libs + builds Vite frontend
├── outputDirectory → artifacts/ignou-assignments/dist/public (static frontend)
├── /api/* routes  → api/server.ts (Express serverless function)
└── /* routes      → /index.html (React SPA routing)
```

- **Frontend**: Built by Vite, served as static files from Vercel's CDN
- **API**: Single Express serverless function at `api/server.ts`
- **Files**: Assignment files stored as base64 in PostgreSQL (no filesystem needed)

---

## File Size Limit

Vercel's serverless functions have a **4.5MB request body limit** on free plans.

This means assignment files should be under **~3MB** (base64 adds ~33% overhead).

For larger files (PDFs > 3MB), consider upgrading to Vercel Pro or using Vercel Blob:
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for file storage
- Or host files on AWS S3 / Cloudinary

---

## Admin Panel

After deployment, visit `https://your-site.vercel.app/admin`

Default password: `ignou@admin2024` (change via `ADMIN_PASSWORD` env var)

---

## After First Deploy

The database tables are created automatically when you first run:
```bash
pnpm --filter @workspace/db run push
```
Or run this against your production DB by setting `DATABASE_URL` to your production connection string locally.

---

## Local Development

Local dev still uses the full Express server (not the Vercel function):
```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/ignou-assignments run dev
```
