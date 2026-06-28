# Buro Cost Controls

## Purpose

Buro should start with free or low-cost infrastructure and avoid scaling costs before the core live audio experience is validated.

## Infrastructure Targets

- **Frontend:** Vercel
- **Backend:** Koyeb or Render
- **Database:** Neon Postgres
- **Redis:** Upstash
- **Media:** Cloudinary
- **Email:** Resend
- **Realtime:** Django Channels / WebSockets
- **Audio:** provider abstraction for Agora, 100ms, or LiveKit testing

## Cost Principles

- Prefer free tiers during development and private testing.
- Add usage limits before inviting broad public traffic.
- Track audio usage from the first provider test.
- Avoid always-on infrastructure where practical.
- Avoid background jobs unless they are required for room cleanup or email.
- Do not add non-MVP systems that create storage, bandwidth, or moderation cost.

## Primary Cost Risks

### Audio Participant Minutes

Audio is likely the biggest variable cost.

Controls:

- Track participant minutes by room and provider.
- Set provider billing alerts.
- Start with small private tests.
- Consider max participants per room during MVP.
- Consider max room duration during MVP.
- End empty rooms quickly.

### Backend WebSocket Connections

Live rooms require persistent connections.

Controls:

- Keep WebSocket payloads small.
- Rate-limit chat and reactions.
- Disconnect users from ended rooms.
- Reject unauthenticated or blocked connections.
- Avoid using WebSockets for audio transport.

### Redis Usage

Upstash Redis supports Channels and short-lived realtime state.

Controls:

- Store durable room state in Postgres.
- Use Redis for channel layer and short-lived coordination.
- Avoid storing large chat histories in Redis.
- Add TTLs for ephemeral keys.

### Database Usage

Neon Postgres should store durable product data.

Controls:

- Keep MVP schema small.
- Index only query-critical fields.
- Avoid storing high-volume reaction events permanently unless needed.
- Decide whether MVP chat is persisted before implementation.
- Archive or prune ended-room operational data if needed.

### Media Storage

Cloudinary is included for profile images or future lightweight media, but media-heavy features are not MVP.

Controls:

- Do not add room recordings.
- Do not add video uploads.
- Do not add stories or posts.
- Limit profile image size if profile images are added.

### Email

Resend should be used for essential transactional email only.

Controls:

- Send only auth and account emails in MVP.
- Avoid marketing campaigns.
- Avoid unnecessary notification email.

## MVP Usage Limits

Initial recommended limits for private testing:

- Maximum room duration: 2 hours.
- Maximum participants per room: start with a small provider-safe limit.
- Maximum chat message length: conservative short text limit.
- Maximum chat messages per user per minute.
- Maximum reactions per user per minute.
- Maximum active rooms per user: 1 hosted live room.

These values can be adjusted after real usage data, but the app should be built so limits are easy to enforce.

## Monitoring To Add Early

Track:

- Active rooms.
- Concurrent room participants.
- Room duration.
- Audio participant minutes.
- WebSocket connection count.
- Chat event rate.
- Reaction event rate.
- Backend error rate.
- Failed audio joins.
- Provider token generation failures.

## Feature Cost Policy

Any new feature should answer:

1. Does it help users start or join casual live audio rooms?
2. Does it increase persistent storage, bandwidth, or provider usage?
3. Can it be tested manually without paid infrastructure?
4. Does it create moderation load?
5. Does it belong after MVP?

If the feature does not directly improve the MVP room loop, defer it.

## Explicitly Deferred Cost Drivers

- Video.
- Recording.
- Transcription.
- Posts.
- Stories.
- Private messages.
- Gifts.
- Wallets.
- Heavy recommendations.
- Large media uploads.
- Push notification campaigns.
- Advanced analytics pipelines.

## Shutdown And Cleanup Rules

The backend should eventually enforce:

- End rooms when the host ends them.
- Mark rooms inactive when no participants remain.
- Disconnect WebSocket clients after room end.
- Expire provider tokens.
- Delete or expire ephemeral Redis state.
- Prevent users from creating many abandoned rooms.

## Launch Readiness

Before inviting testers:

- Billing alerts are enabled for the audio provider.
- Vercel spending controls are reviewed.
- Koyeb or Render plan limits are understood.
- Neon limits are understood.
- Upstash limits are understood.
- Cloudinary limits are understood.
- Resend limits are understood.
- MVP usage caps are configured.
