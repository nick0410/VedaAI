# Deployment Guide

This repo is configured to deploy in **~10 minutes** with two free-tier hosts:

| Layer | Host | Why |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Native Next.js, fastest static + edge |
| Backend (Express + Socket.IO + BullMQ worker) | **Render** | Long-running process, supports persistent WebSockets |
| MongoDB | **MongoDB Atlas** (already set up) | — |
| Redis | **Upstash** (already set up) | — |
| LLM | **Groq** (`openai/gpt-oss-120b`) | — |

The order matters: deploy the **backend first** so you have its URL to give the frontend.

---

## 1 · Backend → Render

1. Go to <https://dashboard.render.com/select-repo?type=blueprint>
2. Sign in with GitHub
3. Pick the **`nick0410/VedaAI`** repo
4. Render reads `render.yaml` and proposes a web service named `vedaai-api`
5. Click **Apply** — you'll be prompted for 4 environment variables:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | your full `mongodb+srv://…` connection string (including db name) |
   | `REDIS_URL` | your `rediss://…` Upstash URL |
   | `GROQ_API_KEY` | your `gsk_…` key from <https://console.groq.com/keys> |
   | `CORS_ORIGIN` | start with `*` for the first deploy — tighten in step 3 |

6. Click **Apply** again. Render builds and deploys (~3 min the first time).
7. When the service is **Live**, copy its public URL — looks like `https://vedaai-api.onrender.com`.

Health check: open `https://YOUR-RENDER-URL/api/health` → should return `{"ok":true}`.

> **Free-tier note**: Render's free plan spins the service down after ~15 min idle. The first request after that wakes it up (~30 s cold start). Fine for demos, not for production.

---

## 2 · Frontend → Vercel

1. Go to <https://vercel.com/new>
2. **Import** the `nick0410/VedaAI` repo
3. On the configuration screen:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - Leave build & output settings as defaults
4. Click **Environment Variables** and add two:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | the Render backend URL from step 1 (e.g. `https://vedaai-api.onrender.com`) |
   | `NEXT_PUBLIC_WS_URL` | same URL — Socket.IO uses the same host |

5. Click **Deploy**. First deploy ~1 min.
6. When green, copy the production URL — looks like `https://vedaai.vercel.app`.

---

## 3 · Lock down CORS on the backend

Back on Render:

1. Open your `vedaai-api` service
2. **Environment** tab → edit `CORS_ORIGIN`
3. Replace `*` with your Vercel URL. To keep local dev working too:

   ```
   http://localhost:3000,https://vedaai.vercel.app
   ```

   *(comma-separated, no spaces required)*

4. Save → Render redeploys automatically.

---

## 4 · Smoke test the live stack

Open `https://YOUR-VERCEL-URL` in your phone or laptop browser:

- [ ] Sign up creates an account
- [ ] You land on an empty Assignments dashboard
- [ ] Create Assignment → fill the form → "Next →"
- [ ] Live status streams over WebSocket from Render
- [ ] Generated paper renders with your school name in the header
- [ ] Download PDF produces a clean text PDF
- [ ] Groups → add CSV → assign paper → works

---

## Local development still works

`.env` files stay on your machine, never in the repo. To run locally:

```bash
# backend
cd backend
cp .env.example .env   # then paste your secrets
npm install
npm run dev            # :4000

# frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev            # :3000
```

---

## Rotating secrets after deploy

Because some secrets have been visible in the chat that built this repo, rotate them once the deploy is verified:

1. **Groq** → <https://console.groq.com/keys> → revoke old key → create new → update on Render
2. **Atlas** → Database Access → change `nikhileshdubey039` password → update `MONGO_URI` on Render
3. **Upstash** → your DB → Settings → reset token → update `REDIS_URL` on Render

Render restarts the service automatically when env vars change.

---

## Updating after the first deploy

`git push origin main` triggers **both** Vercel and Render to rebuild automatically. No manual deploy clicks needed after the initial setup.
