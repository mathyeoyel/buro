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

## Known MVP Tradeoffs

- `buro.ss` is planned but not registered; staging uses temporary host URLs first.
- Free tiers may sleep or throttle.
- Audio provider choice may change after testing.
- Realtime scaling should remain simple until usage requires more.
- Admin tooling can stay manual in MVP.
- Operational dashboards should be minimal but enough to catch failures and runaway cost.
