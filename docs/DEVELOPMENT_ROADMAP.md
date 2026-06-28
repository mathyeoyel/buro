# Buro Development Roadmap

## Roadmap Principles

Buro should be built in thin, testable slices. Each phase should leave the app usable and avoid adding non-MVP social features before live audio behavior is proven.

Primary constraints:

- Audio-first only.
- Public live rooms only.
- Everyone joins muted but can unmute freely.
- No request-to-speak in MVP.
- No recording.
- Free or low-cost infrastructure first.

## Phase 0: Project Foundations

Goal: establish the development baseline without product complexity.

Deliverables:

- Repository structure for React PWA frontend and Django backend.
- Environment variable conventions.
- Local development setup documentation.
- Basic CI checks for linting and tests.
- Shared API and realtime event documentation.
- Deployment target decisions for Vercel and Koyeb or Render.
- Domain plan documented: localhost for local dev, temporary staging URLs for deploys, `buro.ss` reserved for future production.

Exit criteria:

- Frontend and backend can run locally on `localhost`.
- Backend can connect to Neon Postgres and Upstash Redis.
- Deployment environments can be configured without secrets committed to git.
- No assumption that `buro.ss` is registered, owned, or connected.

## Phase 1: Authentication And Profiles

Goal: allow users to enter Buro with a stable identity.

Deliverables:

- Email-based sign-up and sign-in.
- Basic user model.
- Display name setup.
- Current user endpoint.
- Sign-out behavior.
- Minimal profile screen.
- Resend email integration if email verification or transactional email is enabled.

Exit criteria:

- A user can create an account, sign in, and update display name.
- Authenticated API requests work from the PWA.
- Unauthenticated users cannot join or create rooms.

## Phase 2: Room Directory And Creation

Goal: users can see live rooms and start jazzing instantly.

Deliverables:

- Room model.
- Room participant model.
- Create room endpoint.
- Live rooms list endpoint.
- Room detail endpoint.
- Default room title: `{display_name}'s Jazz Room`.
- Default category: `Random Jazz`.
- Default mode: `Open Mic`.
- Basic live room cards in the frontend.

Exit criteria:

- User can create a room with no title or category.
- Created room appears in the live rooms list.
- Ended rooms do not appear as live.

## Phase 3: Realtime Room Presence

Goal: users can join, leave, and see room presence updates in real time.

Deliverables:

- Django Channels setup.
- Upstash Redis channel layer.
- Room WebSocket authentication.
- Join and leave room events.
- Participant list updates.
- Host assignment.
- Empty-room cleanup policy.
- End room event.

Exit criteria:

- Multiple clients see participant changes without refreshing.
- Host can end a room.
- Leaving a room updates participant count.

## Phase 4: Audio Provider Abstraction

Goal: integrate audio without locking the product to one vendor.

Deliverables:

- Backend audio provider interface.
- Frontend audio client interface.
- Provider session/token endpoint.
- Initial provider implementation selected for testing.
- Provider-independent room join flow.
- Error states for audio connection failure.

Exit criteria:

- Users can join room audio muted by default.
- Users can mute and unmute themselves freely.
- Swapping Agora, 100ms, or LiveKit later does not require changing core room APIs.

## Phase 5: Chat And Reactions

Goal: support lightweight room interaction beyond voice.

Deliverables:

- Room chat WebSocket events.
- Optional chat persistence decision.
- Reaction WebSocket events.
- Basic chat UI.
- Basic reaction UI.
- Rate limits for chat and reactions.

Exit criteria:

- Users in a room can send and receive chat messages.
- Users in a room can send and see reactions.
- Spam controls exist at the event layer.

## Phase 6: Host Moderation And Reporting

Goal: give hosts enough control to keep rooms usable.

Deliverables:

- Host mute participant event.
- Remove participant event.
- Block participant from room.
- Report user endpoint.
- Report room endpoint.
- End room flow.
- Frontend moderation controls for host.

Exit criteria:

- Host can mute, remove, block, report, and end room.
- Removed users are disconnected from room realtime state.
- Blocked users cannot rejoin the same room.
- Reports are stored for manual review.

## Phase 7: PWA Polish And Deployment

Goal: make the MVP shippable for early testers.

Deliverables:

- Responsive mobile-first UI.
- PWA manifest.
- Installable app basics.
- Loading, empty, and error states.
- Staging environment configuration on temporary Vercel/Koyeb/Render URLs.
- Vercel frontend staging deployment.
- Koyeb or Render backend staging deployment.
- Smoke test checklist on staging.
- Production domain connection plan for `buro.ss` (deferred until staging is stable).

Exit criteria:

- A tester can use Buro from a mobile browser via staging URLs.
- Staging deploy supports auth, live rooms, WebSockets, and audio.
- Known limits are documented.
- `buro.ss`, `app.buro.ss`, and `api.buro.ss` are not connected until staging passes and the app is stable.

## Deferred Until After MVP

These items are intentionally out of scope:

- Video rooms.
- Recorded rooms.
- Posts or clips.
- Followers.
- Private messages.
- Gifts.
- Wallets.
- Stories.
- Request-to-speak.
- Heavy discovery or recommendations.
- Creator tools.
- Admin analytics beyond basic operational visibility.

## MVP Release Checklist

- Sign-up and sign-in work.
- Display names work.
- Live rooms list works.
- Room creation works with defaults.
- Room join and leave work.
- Audio join works.
- Users join muted by default.
- Users can unmute and mute freely.
- Chat works.
- Reactions work.
- Host moderation works.
- Reports are stored.
- Room ending works.
- Basic rate limits are enabled.
- Costs are protected by usage caps where possible.
- Deployment docs are current.
