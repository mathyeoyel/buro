# Buro

Live audio rooms for casual conversation, jokes, stories, and everyday jazzing.

**Tagline:** Start jazzing.

Planning docs live in [`docs/`](docs/). This repo is scaffolded for phased MVP development — no full product features yet.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite (PWA later) |
| Backend | Django + Django REST Framework |
| Realtime | Django Channels (minimal setup) |
| Database | Postgres (local via Docker) or SQLite fallback |
| Cache / Channels | Redis (local via Docker) or in-memory fallback |

**Domain note:** `buro.ss` is the planned production domain. It is not registered yet. Use `localhost` locally and temporary staging URLs until the app is stable.

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **Docker** (optional, for local Postgres and Redis)

## Quick start

### 1. Environment

```bash
cp .env.example .env
```

Edit `.env` if needed. Defaults target local development on `localhost`.

### 2. Optional — start Postgres and Redis

```bash
docker compose up -d
```

If Docker is not running, the backend falls back to SQLite and an in-memory channel layer.

### 3. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

API: `http://localhost:8000/api/`  
Health check: `http://localhost:8000/api/health/`

For WebSocket support later, use Daphne:

```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

The placeholder page calls the backend health endpoint to confirm connectivity.

## Project structure

```
buro/
├── backend/          Django API and Channels
├── frontend/         React PWA (scaffold)
├── docs/             Product and technical planning
├── .env.example      Environment template
├── docker-compose.yml
└── README.md
```

## Development phases

See [`docs/DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md) for the phased build plan:

1. Authentication and profiles
2. Room directory and creation
3. Realtime room presence
4. Audio provider abstraction
5. Chat and reactions
6. Host moderation and reporting
7. PWA polish and deployment

## What is not implemented yet

- User auth and profiles
- Live rooms
- WebSocket room events
- Audio provider integration
- Chat, reactions, and moderation UI

The scaffold provides app boundaries, settings, routing, and a health check only.
