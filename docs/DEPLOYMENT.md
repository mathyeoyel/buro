# Buro Deployment Plan

## Purpose

This document defines the intended MVP deployment shape for Buro. It should guide implementation without requiring application code yet.

## Target Stack

- **Frontend:** React PWA on Vercel
- **Backend:** Django + Django REST Framework on Koyeb or Render
- **Realtime:** Django Channels / WebSockets
- **Database:** Neon Postgres
- **Redis:** Upstash
- **Media:** Cloudinary
- **Email:** Resend
- **Planned production domain:** `buro.ss` (not registered yet)
- **Audio:** provider adapter for Agora, 100ms, or LiveKit

## Domain Status

`buro.ss` is the **planned** production domain. It is **not registered yet** and must not be described as live, active, owned, configured, or connected during development or staging.

Connect production domains only after staging validation passes and the app is stable:

- `buro.ss` — planned primary frontend domain
- `app.buro.ss` — planned alternate frontend subdomain (if used)
- `api.buro.ss` — planned backend API and WebSocket domain

Until then, use `localhost` locally and temporary Vercel/Koyeb/Render URLs for staging.

## Environments

Recommended environments:

- `local`: developer machines on `localhost`
- `staging`: temporary Vercel/Koyeb/Render deploy URLs for integration testing and private testers
- `production`: custom domain on `buro.ss` — only after staging passes and the app is stable

Each environment should have separate credentials where possible.

## Frontend Deployment

Vercel should host the React PWA.

Responsibilities:

- Serve the PWA.
- Provide frontend environment variables.
- Route browser traffic to the backend API and WebSocket URLs.
- Support preview deployments.

Expected environment variables:

```text
# Local example
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000
VITE_APP_DOMAIN=localhost
VITE_AUDIO_PROVIDER=

# Staging example (temporary host-provided URLs)
VITE_API_BASE_URL=https://buro-backend.onrender.com/api
VITE_WS_BASE_URL=wss://buro-backend.onrender.com
VITE_APP_DOMAIN=buro-backend.onrender.com
VITE_AUDIO_PROVIDER=

# Production (future) — connect only after staging is stable and buro.ss is registered
VITE_API_BASE_URL=https://api.buro.ss/api
VITE_WS_BASE_URL=wss://api.buro.ss
VITE_APP_DOMAIN=buro.ss
VITE_AUDIO_PROVIDER=
```

Exact variable names can change with the selected frontend tooling, but API, WebSocket, domain, and provider values must be configurable per environment. Do not default to `buro.ss` during local development or staging.

## Backend Deployment

Koyeb or Render should host the Django backend.

Responsibilities:

- Serve DRF HTTP APIs.
- Serve Django Channels WebSockets.
- Connect to Neon Postgres.
- Connect to Upstash Redis.
- Generate audio provider tokens.
- Send transactional email through Resend.
- Store media metadata if Cloudinary is used.

Expected environment variables:

```text
DJANGO_SECRET_KEY=
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=
DJANGO_CORS_ALLOWED_ORIGINS=
DATABASE_URL=
REDIS_URL=
RESEND_API_KEY=
CLOUDINARY_URL=
AUDIO_PROVIDER=
AUDIO_PROVIDER_APP_ID=
AUDIO_PROVIDER_APP_SECRET=
AUDIO_PROVIDER_API_KEY=
AUDIO_PROVIDER_API_SECRET=
FRONTEND_URL=
```

`DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, and `FRONTEND_URL` must match the active environment:

- **Local:** `localhost`, `127.0.0.1`, and the local frontend port
- **Staging:** temporary Vercel/Koyeb/Render hostnames
- **Production (future):** `buro.ss`, `app.buro.ss`, and `api.buro.ss` — only after registration and DNS setup

Provider-specific names may differ. Keep them isolated to the audio adapter.

## Database

Neon Postgres should store durable application state:

- Users.
- Profiles.
- Rooms.
- Participants.
- Blocks.
- Reports.
- Optional persisted chat messages.
- Operational timestamps.

Guidelines:

- Use migrations for all schema changes.
- Do not store provider tokens long term unless required.
- Avoid storing high-volume ephemeral events before there is a clear need.

## Redis

Upstash Redis should support:

- Django Channels channel layer.
- Short-lived room coordination.
- Rate-limit counters.
- Ephemeral keys with TTLs.

Guidelines:

- Do not use Redis as the source of truth for durable room records.
- Add TTLs to ephemeral keys.
- Keep payloads small.

## Media

Cloudinary is available for lightweight media needs, but MVP media usage should be minimal.

Allowed MVP use:

- Optional profile images if implemented.

Not allowed in MVP:

- Room recordings.
- Video uploads.
- Stories.
- Post media.

## Email

Resend should be used for transactional email.

Allowed MVP use:

- Email verification if enabled.
- Password reset if implemented.
- Account-related transactional messages.

Avoid marketing or notification email during MVP unless there is a clear product need.

## Domain And Routing

### Local development

Use `localhost` for all local work:

- Frontend: `http://localhost:5173` (or the chosen dev server port)
- Backend API: `http://localhost:8000/api`
- WebSockets: `ws://localhost:8000/ws/...`

### Staging

Use temporary host-provided URLs from Vercel, Koyeb, or Render. Do not connect or reference `buro.ss` as if it were already active.

Example staging shape:

- Frontend: `https://buro-frontend.vercel.app`
- Backend API: `https://buro-backend.onrender.com/api`
- WebSockets: `wss://buro-backend.onrender.com/ws/...`

Staging URLs may change between deploys. Environment variables should be updated to match the current staging hosts.

### Production (future)

Connect custom domains only after:

1. Staging smoke tests pass.
2. Auth, rooms, WebSockets, and audio are stable on temporary URLs.
3. `buro.ss` is registered.
4. DNS and TLS are configured.

Planned production routing:

- `https://buro.ss` or `https://app.buro.ss` for the frontend
- `https://api.buro.ss` for the backend API
- `wss://api.buro.ss/ws/...` for WebSockets

Do not register DNS records or configure production TLS for `buro.ss` before staging validation is complete.

## WebSocket Requirements

The backend host must support long-lived WebSocket connections for Django Channels.

Before choosing Koyeb or Render for staging and future production, verify:

- WebSocket support.
- Idle timeout behavior.
- Instance sleep behavior on free plans.
- Horizontal scaling limits.
- Redis channel layer connectivity.

If the free tier sleeps aggressively, expect first-join delays and document them for private testers.

## Audio Provider Requirements

Before public testing:

- Configure provider credentials per environment.
- Enable usage alerts.
- Confirm mobile browser support.
- Confirm token expiry behavior.
- Confirm mute, unmute, leave, remove, and end-room behavior.
- Confirm that provider billing will not surprise the project during tests.

## Secrets Policy

Never commit:

- Django secret key.
- Database URL.
- Redis URL.
- Resend API key.
- Cloudinary credentials.
- Audio provider credentials.
- Production tokens.

Use provider environment variable dashboards for deployed secrets.

## Deployment Checklist

### Local

- Frontend runs on `localhost`.
- Backend runs on `localhost`.
- API and WebSocket URLs point to local backend.
- No dependency on `buro.ss` being registered or reachable.

### Staging

- Temporary Vercel frontend URL configured.
- Temporary Koyeb or Render backend URL configured.
- Staging API URL configured.
- Staging WebSocket URL configured.
- `DJANGO_ALLOWED_HOSTS` and CORS origins match staging hosts.
- PWA manifest configured.
- Build command works.
- Installable behavior tested where supported.
- Authenticated API calls work from staging frontend URL.
- Smoke test passes on staging before any production domain work begins.

### Production domain (future — after staging is stable)

- `buro.ss` is registered.
- DNS records point to Vercel and Koyeb or Render.
- TLS certificates are active for `buro.ss`, `app.buro.ss`, and `api.buro.ss`.
- Production API URL configured.
- Production WebSocket URL configured.
- Authenticated API calls work from production domain.
- Full smoke test passes on production URLs.

### Backend (staging and production)

- `DJANGO_DEBUG=false`.
- Allowed hosts configured.
- CORS origins configured.
- Database migrations applied.
- Redis connection verified.
- WebSocket endpoint verified.
- Audio provider token generation verified.
- Resend connection verified if email is enabled.
- Static files strategy confirmed if Django serves any admin/static assets.

### Data

- Production database is separate from local development.
- Migrations are repeatable.
- Seed data is optional and not required for the MVP.
- Backups or restore expectations are understood.

### Safety

- Reports can be stored.
- Host moderation works.
- Blocked users cannot rejoin a room.
- Ended rooms cannot be joined.
- Basic rate limits are enabled.

## Smoke Test

Run on `localhost` during development. Run on temporary staging URLs before connecting production domains. Do not treat `buro.ss` as reachable until registration and DNS are complete.

Before considering a deploy usable:

1. Sign up.
2. Sign in.
3. Update display name.
4. Start a room with no title or category.
5. Confirm default title and category.
6. Join the room from a second account.
7. Confirm second account joins muted.
8. Unmute and mute.
9. Send chat.
10. Send reaction.
11. Host mutes participant.
12. Host removes participant.
13. Host blocks participant.
14. Host ends room.
15. Confirm ended room disappears from live list.

## Staging Runtime Configuration

This section documents the concrete staging setup implemented for blockers B1–B4. Use temporary host URLs only; do not reference `buro.ss`.

### Backend settings module

Set on the web service **and** the scheduled cleanup job:

```text
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_DEBUG=False
```

The same `config.settings.production` module is used for staging and future production; only the env-var values differ.

### Backend build command

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
```

### Backend start command (ASGI — required for WebSockets)

Buro uses Django Channels, so it must run under an ASGI server. Do **not** use plain Gunicorn (sync WSGI) — it cannot serve WebSockets.

```bash
daphne -b 0.0.0.0 -p $PORT config.asgi:application
```

### Channel layer (WebSockets) — staging vs production

Django Channels needs a channel layer to broadcast room events between connections. It is selected with `CHANNEL_LAYER_BACKEND` (production settings):

- `CHANNEL_LAYER_BACKEND=memory` — `InMemoryChannelLayer`. Use for **free Render staging**, which runs a single Daphne process. This avoids the free Upstash Redis `TimeoutError`s seen during room WebSocket activity.
- `CHANNEL_LAYER_BACKEND=redis` — `channels_redis` using `REDIS_URL`. Use for **production / paid hosting** with multiple processes or instances.

Default: `redis` when `REDIS_URL` is set, otherwise `memory`. When `redis` is selected, `REDIS_URL` is required.

Memory is acceptable for staging because:

- Render free runs exactly one Daphne process, so all WebSocket connections share the same in-process layer.
- It is **not** suitable for multi-instance/multi-worker production — each process would have an isolated layer and room events would not broadcast across them. Use Redis/Valkey there.

Redis support is kept intact; switching back is just `CHANNEL_LAYER_BACKEND=redis` with a working `REDIS_URL`.

### Frontend build command (Cloudflare Pages)

Vite env vars (`VITE_API_BASE_URL`, `VITE_WS_BASE_URL`) are **build-time** — they are baked into the bundle when `vite build` runs. If they are missing or still point to `localhost` at build time, the deployed app silently connects to `ws://localhost:8000` and live rooms break.

Use this build command so the build **fails loudly** when env vars are missing/wrong:

```bash
npm ci && npm run verify:env && npm run build
```

`verify:env` (runs `frontend/scripts/verify-env.mjs`) enforces:

- `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` must be set.
- Neither may contain `localhost`.
- `VITE_API_BASE_URL` must start with `https://`.
- `VITE_WS_BASE_URL` must start with `wss://`.

Cloudflare Pages settings:

- Build command: `npm ci && npm run verify:env && npm run build`
- Build output directory: `frontend/dist`
- Root directory: `frontend`
- Production environment variables:
  - `VITE_API_BASE_URL=https://<your-backend-host>/api`
  - `VITE_WS_BASE_URL=wss://<your-backend-host>`

Important:

- Vite env vars are build-time, not runtime — changing them in the dashboard does **not** affect an existing deployment.
- After changing variables, **trigger a fresh deploy/rebuild** so the bundle picks them up.
- Set the variables under the **Production** environment (Preview deployments use their own env).
- Hard-refresh the browser after deploy to clear the old cached bundle.

### B1 — Static files (admin assets)

- WhiteNoise serves static files when `DEBUG=False`.
- `whitenoise.middleware.WhiteNoiseMiddleware` runs immediately after `SecurityMiddleware`.
- `STATIC_ROOT = backend/staticfiles`.
- Production uses `STORAGES["staticfiles"] = whitenoise.storage.CompressedManifestStaticFilesStorage`.
- Run `python manage.py collectstatic --noinput` during the build so Django admin renders correctly.

### B2 — HTTPS proxy + CSRF for admin

`config/settings/production.py` sets:

- `SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")` so Django trusts the proxy's forwarded scheme.
- `CSRF_TRUSTED_ORIGINS` parsed from `DJANGO_CSRF_TRUSTED_ORIGINS`.
- `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` are parsed with empty entries stripped (no invalid `[""]`).

Required env vars:

```text
DJANGO_ALLOWED_HOSTS=<your-backend-host>
DJANGO_CORS_ALLOWED_ORIGINS=https://<your-frontend-host>
DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-backend-host>,https://<your-frontend-host>
```

### B3 — SPA deep-link fallback

The frontend uses `BrowserRouter`, so deep links like `/rooms/123` and `/profile/edit` must serve `index.html` (otherwise refresh/direct-open returns 404). Static asset requests must NOT be rewritten.

Configure on the chosen static host:

- **Render Static Site:** add a Redirect/Rewrite rule in the dashboard:
  - Source: `/*`
  - Destination: `/index.html`
  - Action: `Rewrite`
  Render serves existing static files first, so hashed assets in `/assets/*` keep working.
- **Vercel:** add `frontend/vercel.json`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- **Netlify:** add `frontend/public/_redirects`:
  ```text
  /*  /index.html  200
  ```

A generic config file is intentionally NOT committed because the rewrite format depends on the host; pick the one matching your target. Frontend publish directory: `frontend/dist`.

### B4 — Room cleanup scheduler

`python manage.py cleanup_rooms` ends expired and empty rooms (idempotent). It must **not** run inside the Daphne web process.

Recommended staging schedule: **every 5 minutes**.

#### Option A — HTTP endpoint (free schedulers, e.g. cron-job.org)

Set `INTERNAL_CLEANUP_TOKEN` on the Render web service to a strong random value, then configure an external scheduler to call:

```text
POST https://<your-backend-host>/api/internal/cleanup-rooms/
Header: X-Buro-Cleanup-Token: <INTERNAL_CLEANUP_TOKEN>
```

If the scheduler cannot send custom headers, use a query param fallback:

```text
GET https://<your-backend-host>/api/internal/cleanup-rooms/?token=<INTERNAL_CLEANUP_TOKEN>
```

POST is preferred; GET is supported for simple cron compatibility.

Response on success:

```json
{ "status": "ok", "ended_rooms": 0 }
```

Security:

- Missing or invalid token → `403 Forbidden`
- `INTERNAL_CLEANUP_TOKEN` not configured → `503 Service Unavailable` (cleanup does not run)
- Cleanup exception → `500` with a safe message (details logged server-side)

Suggested cron-job.org settings:

- URL: `https://<your-backend-host>/api/internal/cleanup-rooms/`
- Method: `POST`
- Header: `X-Buro-Cleanup-Token: <INTERNAL_CLEANUP_TOKEN>`
- Schedule: every 5 minutes

After deploy: test wrong token → `403`, correct token → `200`.

#### Option B — Render Cron Job (paid / if available)

```bash
python manage.py cleanup_rooms
```

- Add a Cron Job service with schedule `*/5 * * * *` and the cleanup command, sharing the web service's env group.
- Generic cron: `*/5 * * * * cd /app/backend && python manage.py cleanup_rooms`

Both options call the same shared cleanup logic in `rooms.cleanup.cleanup_live_rooms`.

## Known MVP Tradeoffs

- `buro.ss` is planned but not registered; staging uses temporary host URLs first.
- Free tiers may sleep or throttle.
- Audio provider choice may change after testing.
- Realtime scaling should remain simple until usage requires more.
- Admin tooling can stay manual in MVP.
- Operational dashboards should be minimal but enough to catch failures and runaway cost.
