# Tasks, Status & Roadmap — Alphabet Rush

## 1. Completed

### Product
- [x] Multiplayer room creation.
- [x] Room join flow.
- [x] 5/10/15/20 round choices.
- [x] Random letter generation.
- [x] Five answer categories.
- [x] 60-second server timer.
- [x] AI answer validation.
- [x] Round result screen.
- [x] Final leaderboard.
- [x] Rematch flow.

### Frontend
- [x] React Router route map.
- [x] Custom React 404.
- [x] Vercel SPA rewrite.
- [x] Light/dark theme.
- [x] Theme persistence.
- [x] Reusable answer field.
- [x] Reusable player list.
- [x] Reusable room-code component.
- [x] Modular CSS structure.
- [x] Responsive UI.

### Backend
- [x] Express server.
- [x] Socket.IO realtime layer.
- [x] Modular game engine.
- [x] Modular room store.
- [x] Isolated OpenAI validator.
- [x] Room-code utility.
- [x] Random-letter utility.
- [x] Explicit start/dev scripts.

## Phase 2 — Progression & Replayability

Completed:
- [x] Persistent browser player profile.
- [x] XP and level progression.
- [x] Unlockable avatars and titles.
- [x] Lifetime profile statistics.
- [x] Round streak tracking.
- [x] Round awards.
- [x] Final-match XP reward.
- [x] Profile/cosmetic data synchronized into multiplayer rooms.

## Phase 3 — Game Modes & Variety

Completed:
- [x] Classic mode.
- [x] Blitz 30-second mode.
- [x] Double Points mode.
- [x] Hard Letters mode.
- [x] Host selects the mode when creating a room.
- [x] Server-authoritative timer, scoring multiplier and letter pool.
- [x] Mode displayed in lobby, gameplay and round results.
- [x] Automated game-mode tests.

## Phase 4 — Reliability & Production Hardening

Completed:
- [x] Answer-validator unit tests.
- [x] Game-engine unit tests.
- [x] Socket.IO handler-flow tests.
- [x] Host-only rematch and next-round authorization.
- [x] Ended-round and round-ID stale-event protection.
- [x] Server payload validation and bounded input.
- [x] Room/action and answer-submission rate limiting.
- [x] Socket connection/reconnection status UI.
- [x] In-app socket error feedback.
- [x] AI validation loading feedback.
- [x] Structured JSON server logs.
- [x] Health diagnostics with validator status and active room/player counts.
- [x] Graceful server shutdown.
- [x] Automatic cleanup of stale inactive rooms.
- [x] Reduced-motion support for game feedback.

Phase 5 — Persistent Multiplayer:
- [ ] Database-backed room/session state.
- [ ] Redis or equivalent multi-instance Socket.IO coordination.
- [ ] Production authentication and durable player identity.
- [ ] Full browser E2E multiplayer test suite.

## 4. Roadmap

~~~mermaid
flowchart LR
    A[Prototype] --> B[Test Coverage]
    B --> C[Realtime Reliability]
    C --> D[Production Hardening]
    D --> E[Persistent Multiplayer]
    E --> F[Product Expansion]
~~~

## 5. Definition of Done

A task is complete when:

- The intended flow works.
- Both themes remain usable.
- Mobile layout remains usable.
- Socket listeners are cleaned up.
- Errors are handled.
- Code is placed in the correct module.
- Relevant checks have been run.
- Documentation is updated when necessary.

## 6. Testing Status

The backend now has automated coverage for answer validation, game modes, game-engine lifecycle behavior, payload normalization, rate limiting, structured logging, room cleanup and Socket.IO handler flows.

The remaining production test gap is full browser-based end-to-end multiplayer testing with real deployed services.

Phase 2 progression work is deployed to the current production frontend/backend commits.


## Phase 2 — Progression & Replayability

Completed:
- Persistent browser player profile.
- XP and level progression.
- Unlockable avatars and titles.
- Lifetime profile statistics.
- Round streak tracking.
- Round awards.
- Final-match XP reward.
- Profile/cosmetic data synchronized into multiplayer rooms.
