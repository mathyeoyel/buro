# Buro Realtime Events

## Purpose

Buro uses WebSockets for room presence, chat, reactions, mute state, and moderation events. Audio packets should not flow through Django Channels; audio must be handled by the selected audio provider.

Backend realtime stack:

- Django Channels
- WebSockets
- Upstash Redis channel layer

## Connection Model

Room WebSocket URL pattern:

```text
{ws_base_url}/ws/rooms/{room_id}
```

Examples by environment:

- **Local:** `ws://localhost:8000/ws/rooms/{room_id}`
- **Staging:** `wss://{koyeb-or-render-host}/ws/rooms/{room_id}` (temporary Vercel/Koyeb/Render URLs)
- **Production (future):** `wss://api.buro.ss/ws/rooms/{room_id}` — only after `buro.ss` is registered, DNS is configured, and staging validation passes

`buro.ss` is the planned production domain. It is not registered yet and must not be treated as live during development or staging.

Rules:

- User must be authenticated.
- User must have joined the room through the HTTP join endpoint before connecting.
- Ended rooms reject new WebSocket connections.
- Blocked users reject new WebSocket connections.
- Server remains authoritative for room state.

## Event Envelope

All events should use a consistent envelope.

```json
{
  "type": "room.participant_joined",
  "event_id": "evt_123",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:00:00Z",
  "payload": {}
}
```

## Client-To-Server Events

### `participant.mute_self`

Sent when a user mutes themselves.

```json
{
  "type": "participant.mute_self",
  "payload": {
    "muted": true
  }
}
```

Server response broadcast:

- `room.participant_updated`

### `participant.unmute_self`

Sent when a user unmutes themselves.

```json
{
  "type": "participant.unmute_self",
  "payload": {
    "muted": false
  }
}
```

Server response broadcast:

- `room.participant_updated`

### `chat.message_send`

Sends a room chat message.

```json
{
  "type": "chat.message_send",
  "payload": {
    "body": "That story is wild"
  }
}
```

Validation:

- User must be in the room.
- Room must be live.
- Message body must not be empty.
- Message body should have a conservative length limit.
- Rate limits should apply.

Server response broadcast:

- `chat.message_created`

### `reaction.send`

Sends a lightweight room reaction.

```json
{
  "type": "reaction.send",
  "payload": {
    "reaction": "laugh"
  }
}
```

Allowed MVP reactions should be a small fixed set, for example:

- `laugh`
- `fire`
- `clap`
- `wow`

Server response broadcast:

- `reaction.created`

### `host.mute_participant`

Host-only event to mute another participant.

```json
{
  "type": "host.mute_participant",
  "payload": {
    "user_id": "usr_456"
  }
}
```

Server response broadcast:

- `room.participant_updated`
- `moderation.participant_muted`

### `host.remove_participant`

Host-only event to remove a participant.

```json
{
  "type": "host.remove_participant",
  "payload": {
    "user_id": "usr_456"
  }
}
```

Server response broadcast:

- `moderation.participant_removed`
- `room.participant_left`

### `host.block_participant`

Host-only event to block a participant from the room.

```json
{
  "type": "host.block_participant",
  "payload": {
    "user_id": "usr_456"
  }
}
```

Server response broadcast:

- `moderation.participant_blocked`
- `room.participant_left`

### `host.end_room`

Host-only event to end the room.

```json
{
  "type": "host.end_room",
  "payload": {}
}
```

Server response broadcast:

- `room.ended`

## Server-To-Client Events

### `room.snapshot`

Sent after WebSocket connection is accepted.

```json
{
  "type": "room.snapshot",
  "event_id": "evt_001",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:00:00Z",
  "payload": {
    "room": {
      "id": "room_123",
      "title": "Amina's Jazz Room",
      "category": "Random Jazz",
      "mode": "Open Mic",
      "status": "live"
    },
    "participants": [
      {
        "id": "usr_123",
        "display_name": "Amina",
        "role": "host",
        "muted": false
      }
    ]
  }
}
```

### `room.participant_joined`

Broadcast when a participant joins.

```json
{
  "type": "room.participant_joined",
  "event_id": "evt_123",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:02:00Z",
  "payload": {
    "participant": {
      "id": "usr_456",
      "display_name": "Deng",
      "role": "participant",
      "muted": true
    }
  }
}
```

### `room.participant_left`

Broadcast when a participant leaves.

```json
{
  "type": "room.participant_left",
  "event_id": "evt_124",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:03:00Z",
  "payload": {
    "user_id": "usr_456",
    "participant_count": 7
  }
}
```

### `room.participant_updated`

Broadcast when participant state changes.

```json
{
  "type": "room.participant_updated",
  "event_id": "evt_125",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:04:00Z",
  "payload": {
    "participant": {
      "id": "usr_456",
      "display_name": "Deng",
      "role": "participant",
      "muted": false
    }
  }
}
```

### `chat.message_created`

Broadcast when a chat message is accepted.

```json
{
  "type": "chat.message_created",
  "event_id": "evt_126",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:05:00Z",
  "payload": {
    "message": {
      "id": "msg_123",
      "user": {
        "id": "usr_456",
        "display_name": "Deng"
      },
      "body": "That story is wild",
      "created_at": "2026-06-28T09:05:00Z"
    }
  }
}
```

### `reaction.created`

Broadcast when a reaction is accepted.

```json
{
  "type": "reaction.created",
  "event_id": "evt_127",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:06:00Z",
  "payload": {
    "reaction": "laugh",
    "user": {
      "id": "usr_456",
      "display_name": "Deng"
    }
  }
}
```

### `moderation.participant_muted`

Sent when a host mutes a participant.

```json
{
  "type": "moderation.participant_muted",
  "event_id": "evt_128",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:07:00Z",
  "payload": {
    "user_id": "usr_456",
    "muted_by": "usr_123"
  }
}
```

### `moderation.participant_removed`

Sent when a host removes a participant.

```json
{
  "type": "moderation.participant_removed",
  "event_id": "evt_129",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:08:00Z",
  "payload": {
    "user_id": "usr_456",
    "removed_by": "usr_123"
  }
}
```

### `moderation.participant_blocked`

Sent when a host blocks a participant.

```json
{
  "type": "moderation.participant_blocked",
  "event_id": "evt_130",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:09:00Z",
  "payload": {
    "user_id": "usr_456",
    "blocked_by": "usr_123"
  }
}
```

### `room.ended`

Broadcast when a room ends.

```json
{
  "type": "room.ended",
  "event_id": "evt_131",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:30:00Z",
  "payload": {
    "ended_by": "usr_123",
    "ended_at": "2026-06-28T09:30:00Z"
  }
}
```

### `error`

Sent for rejected client events.

```json
{
  "type": "error",
  "event_id": "evt_132",
  "room_id": "room_123",
  "sent_at": "2026-06-28T09:10:00Z",
  "payload": {
    "code": "not_room_host",
    "message": "Only the host can perform this action."
  }
}
```

## Reliability Rules

- The server should validate every event.
- The client should treat server events as authoritative.
- Reconnect should fetch a fresh `room.snapshot`.
- Duplicate events should not break the UI.
- The room should end or become inactive when no participants remain, based on backend cleanup policy.

## Rate Limits

MVP rate limits should be simple:

- Chat messages per user per room.
- Reactions per user per room.
- Moderation actions per host per room.
- WebSocket connection attempts per user.

## Out Of Scope Events

Do not add MVP realtime events for:

- Video.
- Recording.
- Gifts.
- Wallet updates.
- Private messages.
- Follower activity.
- Feed activity.
- Request-to-speak.
