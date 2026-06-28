# Buro API Contract

## Purpose

This document defines the initial HTTP API contract for the Buro MVP. It is intentionally small and should not grow to include non-MVP social features.

Frontend: React PWA  
Backend: Django + Django REST Framework  
Database: Neon Postgres

## Conventions

- Base URL path: `/api`
- Full base URL varies by environment:
  - **Local:** `http://localhost:8000/api`
  - **Staging:** temporary backend URL from Koyeb or Render (for example `https://buro-backend.onrender.com/api`)
  - **Production (future):** `https://api.buro.ss/api` — only after `buro.ss` is registered, DNS is configured, and staging validation passes
- Do not hardcode `buro.ss` or `api.buro.ss` during local development or staging
- Format: JSON
- Authentication: session auth or token auth, to be finalized during backend setup
- Authenticated room participation is required
- Timestamps should use ISO 8601 UTC strings
- IDs should be opaque to the frontend
- Error responses should use predictable machine-readable codes

## Standard Error Shape

```json
{
  "error": {
    "code": "room_not_found",
    "message": "Room not found."
  }
}
```

## Core Objects

### User

```json
{
  "id": "usr_123",
  "email": "person@example.com",
  "display_name": "Amina",
  "created_at": "2026-06-28T09:00:00Z"
}
```

### Room

```json
{
  "id": "room_123",
  "title": "Amina's Jazz Room",
  "category": "Random Jazz",
  "mode": "Open Mic",
  "status": "live",
  "host": {
    "id": "usr_123",
    "display_name": "Amina"
  },
  "participant_count": 8,
  "created_at": "2026-06-28T09:00:00Z",
  "ended_at": null
}
```

### Participant

```json
{
  "id": "usr_456",
  "display_name": "Deng",
  "role": "participant",
  "muted": true,
  "joined_at": "2026-06-28T09:02:00Z"
}
```

### Report

```json
{
  "id": "rep_123",
  "target_type": "user",
  "target_id": "usr_456",
  "reason": "harassment",
  "details": "Optional details from reporter.",
  "created_at": "2026-06-28T09:05:00Z"
}
```

## Authentication Endpoints

### `POST /api/auth/signup`

Creates a user account.

Request:

```json
{
  "email": "person@example.com",
  "password": "minimum-accepted-password",
  "display_name": "Amina"
}
```

Response `201`:

```json
{
  "user": {
    "id": "usr_123",
    "email": "person@example.com",
    "display_name": "Amina",
    "created_at": "2026-06-28T09:00:00Z"
  }
}
```

### `POST /api/auth/login`

Starts an authenticated session.

Request:

```json
{
  "email": "person@example.com",
  "password": "minimum-accepted-password"
}
```

Response `200`:

```json
{
  "user": {
    "id": "usr_123",
    "email": "person@example.com",
    "display_name": "Amina",
    "created_at": "2026-06-28T09:00:00Z"
  }
}
```

### `POST /api/auth/logout`

Ends the current session.

Response `204`: no body.

### `GET /api/me`

Returns the current authenticated user.

Response `200`:

```json
{
  "user": {
    "id": "usr_123",
    "email": "person@example.com",
    "display_name": "Amina",
    "created_at": "2026-06-28T09:00:00Z"
  }
}
```

### `PATCH /api/me`

Updates basic profile fields.

Request:

```json
{
  "display_name": "Amina"
}
```

Response `200`:

```json
{
  "user": {
    "id": "usr_123",
    "email": "person@example.com",
    "display_name": "Amina",
    "created_at": "2026-06-28T09:00:00Z"
  }
}
```

## Room Endpoints

### `GET /api/rooms`

Lists live rooms only.

Query parameters:

- `category`: optional category filter
- `limit`: optional page size
- `cursor`: optional pagination cursor

Response `200`:

```json
{
  "rooms": [
    {
      "id": "room_123",
      "title": "Amina's Jazz Room",
      "category": "Random Jazz",
      "mode": "Open Mic",
      "status": "live",
      "host": {
        "id": "usr_123",
        "display_name": "Amina"
      },
      "participant_count": 8,
      "created_at": "2026-06-28T09:00:00Z",
      "ended_at": null
    }
  ],
  "next_cursor": null
}
```

### `POST /api/rooms`

Creates and starts a live room.

`title` and `category` are optional. Blank values should receive defaults.

Request:

```json
{
  "title": "",
  "category": ""
}
```

Response `201`:

```json
{
  "room": {
    "id": "room_123",
    "title": "Amina's Jazz Room",
    "category": "Random Jazz",
    "mode": "Open Mic",
    "status": "live",
    "host": {
      "id": "usr_123",
      "display_name": "Amina"
    },
    "participant_count": 1,
    "created_at": "2026-06-28T09:00:00Z",
    "ended_at": null
  }
}
```

### `GET /api/rooms/{room_id}`

Returns room details.

Response `200`:

```json
{
  "room": {
    "id": "room_123",
    "title": "Amina's Jazz Room",
    "category": "Random Jazz",
    "mode": "Open Mic",
    "status": "live",
    "host": {
      "id": "usr_123",
      "display_name": "Amina"
    },
    "participant_count": 8,
    "created_at": "2026-06-28T09:00:00Z",
    "ended_at": null
  }
}
```

### `POST /api/rooms/{room_id}/join`

Creates or refreshes the user's participant state and returns audio join information.

Response `200`:

```json
{
  "participant": {
    "id": "usr_456",
    "display_name": "Deng",
    "role": "participant",
    "muted": true,
    "joined_at": "2026-06-28T09:02:00Z"
  },
  "audio": {
    "provider": "abstract",
    "room_ref": "provider-room-id",
    "token": "provider-token",
    "expires_at": "2026-06-28T10:02:00Z"
  },
  "websocket_url": "ws://localhost:8000/ws/rooms/room_123"
}
```

The `websocket_url` value is environment-specific. The backend returns the correct host for the current deploy:

- **Local:** `ws://localhost:8000/ws/rooms/{room_id}`
- **Staging:** `wss://{koyeb-or-render-host}/ws/rooms/{room_id}`
- **Production (future):** `wss://api.buro.ss/ws/rooms/{room_id}` — only after the production domain is registered and connected

### `POST /api/rooms/{room_id}/leave`

Leaves a room.

Response `204`: no body.

### `POST /api/rooms/{room_id}/end`

Host-only endpoint to end a room.

Response `200`:

```json
{
  "room": {
    "id": "room_123",
    "status": "ended",
    "ended_at": "2026-06-28T09:30:00Z"
  }
}
```

## Moderation Endpoints

### `POST /api/rooms/{room_id}/participants/{user_id}/mute`

Host-only endpoint to mute a participant.

Response `200`:

```json
{
  "participant": {
    "id": "usr_456",
    "muted": true
  }
}
```

### `POST /api/rooms/{room_id}/participants/{user_id}/remove`

Host-only endpoint to remove a participant.

Response `204`: no body.

### `POST /api/rooms/{room_id}/participants/{user_id}/block`

Host-only endpoint to block a user from rejoining the room.

Response `204`: no body.

### `POST /api/reports`

Creates a report for manual review.

Request:

```json
{
  "target_type": "user",
  "target_id": "usr_456",
  "room_id": "room_123",
  "reason": "harassment",
  "details": "Optional details."
}
```

Response `201`:

```json
{
  "report": {
    "id": "rep_123",
    "target_type": "user",
    "target_id": "usr_456",
    "reason": "harassment",
    "details": "Optional details.",
    "created_at": "2026-06-28T09:05:00Z"
  }
}
```

## Out Of Scope API

Do not add MVP endpoints for:

- Followers.
- Feeds.
- Posts.
- Private messages.
- Stories.
- Gifts.
- Wallets.
- Recordings.
- Video.
- Request-to-speak.
