# Buro Audio Provider Strategy

## Purpose

Buro is audio-first, but the MVP should not be permanently tied to one audio vendor. The app should abstract provider-specific behavior so Agora, 100ms, or LiveKit can be tested without rewriting room logic.

## MVP Audio Requirements

- Audio rooms only.
- No video.
- No recording.
- Everyone joins muted by default.
- Everyone can unmute and mute freely.
- No request-to-speak.
- Host can mute a participant.
- Host can remove a participant.
- Host can end the room.
- Audio connection failures should be visible and recoverable.

## Provider Candidates

### Agora

Potential strengths:

- Mature realtime audio infrastructure.
- Broad SDK support.
- Good for fast prototyping.

Watch points:

- Pricing can grow with usage.
- Provider concepts may shape the app if not abstracted carefully.

### 100ms

Potential strengths:

- Room-oriented APIs.
- Useful dashboard and templates.
- Good developer ergonomics.

Watch points:

- Template and role concepts may exceed the MVP's simple open mic model.
- Cost should be monitored during live testing.

### LiveKit

Potential strengths:

- Open-source option.
- Can be self-hosted later if needed.
- Strong realtime media primitives.

Watch points:

- Self-hosting increases operational responsibility.
- Managed LiveKit still needs cost monitoring.

## Abstraction Goals

The core Buro backend should own:

- User identity.
- Room identity.
- Host and participant roles.
- Room lifecycle.
- Moderation permissions.
- Reports and blocks.

The audio provider should own:

- Audio transport.
- Provider room/session connection.
- Provider access token generation.
- Provider-specific SDK initialization.
- Audio mute state at the media layer.

## Backend Interface

The backend should expose a provider-neutral service interface similar to:

```text
AudioProvider
- create_room(room) -> ProviderRoom
- end_room(room) -> None
- create_participant_token(room, user, role) -> ProviderToken
- remove_participant(room, user) -> None
- mute_participant(room, user) -> None
```

The exact implementation should be written in application code later. This document defines the required boundary, not the code.

## Frontend Interface

The frontend should use a provider-neutral audio client boundary similar to:

```text
AudioClient
- join(audioJoinPayload) -> None
- leave() -> None
- mute() -> None
- unmute() -> None
- onConnectionStateChange(callback) -> unsubscribe
- onParticipantAudioStateChange(callback) -> unsubscribe
```

UI components should not call Agora, 100ms, or LiveKit SDKs directly. They should call the Buro audio client wrapper.

## Join Flow

1. User joins a Buro room through `POST /api/rooms/{room_id}/join`.
2. Backend validates that:
   - User is authenticated.
   - Room is live.
   - User is not blocked from the room.
3. Backend creates or refreshes provider access.
4. Backend returns provider-neutral audio join payload.
5. Frontend connects to the provider through the audio client wrapper.
6. Frontend starts the user muted.
7. WebSocket presence connects separately through Django Channels.

## Audio Join Payload

The HTTP join endpoint should return:

```json
{
  "audio": {
    "provider": "livekit",
    "room_ref": "provider-room-id",
    "token": "provider-token",
    "expires_at": "2026-06-28T10:02:00Z"
  }
}
```

The frontend should treat this payload as opaque except for provider selection and expiry handling.

## Mute State

Buro has two related mute states:

- **Application mute state:** what Buro displays and broadcasts through WebSockets.
- **Provider mute state:** what the audio SDK enforces.

Rules:

- Users join muted by default.
- Self mute and unmute should update both provider state and Buro realtime state.
- Host mute should update backend state, notify the target user, and enforce provider mute where supported.
- If provider and Buro state disagree, server state should be treated as authoritative by the UI.

## Moderation Behavior

### Host Mutes Participant

- Backend validates host permission.
- Backend updates participant state.
- Backend calls provider mute if supported.
- WebSocket broadcasts participant update.

### Host Removes Participant

- Backend validates host permission.
- Backend removes participant from Buro room state.
- Backend calls provider remove or revoke behavior if supported.
- WebSocket broadcasts removal.
- Frontend disconnects audio for removed user.

### Host Ends Room

- Backend marks room ended.
- Backend calls provider end/delete room if supported.
- WebSocket broadcasts room ended.
- All clients leave audio.

## Provider Selection Criteria

Choose the first MVP provider based on:

- Fastest working React integration.
- Reliable audio quality on mobile browsers.
- Simple token generation from Django.
- Free tier or low-cost testing.
- Good WebSocket coexistence with Buro room state.
- Clean support for mute, leave, remove, and end room.

Do not choose based on advanced features like recording, livestreaming, video layouts, stage roles, or monetization.

## Switching Providers Later

Provider-specific code should be isolated to:

- Backend provider adapter.
- Frontend audio client adapter.
- Environment variables.
- Deployment configuration.

Provider-specific code should not leak into:

- Room models.
- Public API response shapes beyond the `provider` value.
- Chat events.
- Reaction events.
- Moderation permission logic.
- Visual design.

## Cost Controls

Audio can become the largest operating cost. Before public testing:

- Set provider usage alerts.
- Prefer free-tier limits while validating.
- Limit maximum room duration if needed.
- Limit maximum participants per room if needed.
- Track concurrent rooms.
- Track participant minutes.

## Out Of Scope For MVP

- Video tracks.
- Recording.
- Replay.
- Transcription.
- Spatial audio.
- Paid rooms.
- Request-to-speak.
- Multi-host role systems.
- Advanced speaker queues.
