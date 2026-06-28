# Buro MVP Spec

## Product Summary

Buro is a lightweight, audio-first live rooms app for casual conversation, jokes, stories, laughter, and everyday jazzing.

- **App name:** Buro
- **Meaning:** conversation
- **Planned production domain:** `buro.ss` (not registered yet)
- **Tagline:** Start jazzing.
- **Primary format:** live audio rooms
- **MVP principle:** make it easy to sign up, find a live room, start jazzing, chat, react, and leave

## MVP Goals

The MVP should prove that people can casually gather and talk with minimal friction.

1. Users can create an account and set a display name.
2. Users can see currently live rooms.
3. Users can start a room instantly.
4. Users can join a room muted by default.
5. Users can unmute and mute themselves freely.
6. Users can send chat messages while in a room.
7. Users can react with lightweight room reactions.
8. Hosts can moderate basic safety issues.
9. Users can leave rooms cleanly.

## Non-Goals

The MVP must avoid heavy social-network features until live room behavior is validated.

- No video.
- No recording.
- No posts.
- No followers.
- No private messages.
- No gifts.
- No wallet.
- No stories.
- No heavy discovery.
- No request-to-speak flow.
- No creator monetization.
- No complex recommendation system.
- No advanced analytics dashboard.

## Core User Roles

### Guest

Guests are not part of the MVP unless required for landing-page browsing. The product should assume authenticated users for room participation.

### User

A user can:

- Sign up and sign in.
- Set or update a display name.
- View live rooms.
- Start a room.
- Join an open room.
- Mute or unmute themselves.
- Send chat messages.
- Send reactions.
- Leave rooms.
- Report rooms or users.

### Host

The host is the user who starts a room.

A host can:

- Mute participants.
- Remove participants from the room.
- Block users from the room.
- Report users.
- End the room.

## Room Defaults

Room creation must be fast. Title, category, and mode should not block room creation.

- **Title:** optional
- **Default title:** `{display_name}'s Jazz Room`
- **Category:** optional
- **Default category:** `Random Jazz`
- **Default room mode:** `Open Mic`
- **MVP speaking model:** everyone joins muted, everyone can unmute freely

## Room Lifecycle

1. User taps start room.
2. Backend creates a live room with default values where omitted.
3. User becomes host.
4. Audio provider session is created or joined through an abstraction layer.
5. Room appears in the live rooms list.
6. Other users join muted by default.
7. Participants chat, react, mute, unmute, and talk freely.
8. Host may moderate participants.
9. Room ends when host ends it or when the system closes an empty room.

## Room Visibility

MVP rooms are public live rooms. Discovery should stay simple:

- Show live rooms sorted by recent activity, participant count, or creation time.
- Allow optional category display.
- Avoid personalized ranking in MVP.

## Moderation Requirements

Moderation is intentionally basic but must exist from day one.

Host actions:

- Mute participant.
- Remove participant.
- Block participant from rejoining the room.
- Report participant.
- End room.

User actions:

- Report a room.
- Report a participant.
- Leave immediately.

System behavior:

- Removed users leave the audio session and WebSocket room.
- Blocked users cannot rejoin the same room.
- Ended rooms are no longer joinable.

## MVP Screens

### Landing / Auth

- Brand, tagline, and sign-up/sign-in entry.
- Minimal explanation: live audio rooms for casual conversation.

### Live Rooms

- List live rooms.
- Show room title, category, host display name, participant count, and live status.
- Start room call to action.

### Create Room

- Optional title.
- Optional category.
- Start room button.
- Defaults apply when fields are blank.

### Room

- Room title.
- Category.
- Participant count.
- Audio connection status.
- Mute/unmute control.
- Chat panel.
- Reaction control.
- Leave room button.
- Host moderation controls for participants.
- End room button for host.

### Basic Profile

- Display name.
- Account email.
- Sign out.

## Success Criteria

The MVP is successful when:

- A new user can sign up and join or start a room without guidance.
- A room can support casual real-time audio, chat, and reactions.
- Users understand mute/unmute behavior.
- Hosts can handle obvious disruptive behavior.
- Infrastructure can run at low cost during early testing.

## Scope Guardrails

Any proposed feature should be rejected or deferred if it:

- Adds video, recording, or content publishing.
- Requires a feed, follower graph, or recommendation engine.
- Adds payments, gifts, wallets, or monetization.
- Makes room creation slower.
- Adds role complexity beyond host and participant.
- Requires a request-to-speak workflow.
- Increases infrastructure cost before validating live room usage.
