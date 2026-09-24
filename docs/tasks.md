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

## 3. Current Priorities

### Reliability
- [x] Add answer-validator unit tests.
- [ ] Add game-engine unit tests.
- [ ] Add Socket.IO integration tests.
- [ ] Authorize host-only rematch.
- [ ] Restrict next-round execution to ended rounds.
- [ ] Add server payload validation.
- [ ] Add round IDs for stale-event protection.

### UX
- [ ] Add Socket connection status UI.
- [ ] Replace browser alerts with reusable in-app messages.
- [ ] Show clear feedback for host-only actions.
- [ ] Improve AI validation loading/error state.
- [ ] Add reconnect messaging.

### Production
- [ ] Rate-limit answer submission.
- [ ] Add input/payload size limits.
- [ ] Add structured logs and monitoring.
- [ ] Persist or distribute room state.
- [ ] Add production authentication.

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

## 6. Testing Gap

The answer validator now has automated unit coverage. Game-engine and Socket.IO integration coverage remain technical debt.

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
