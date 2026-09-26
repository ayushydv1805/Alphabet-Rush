# Architecture — Alphabet Rush

## 1. Overview

Alphabet Rush contains two runtime applications:

- client/ — React + Vite browser application.
- server/ — Node.js + Express + Socket.IO backend.

The browser communicates with the server through Socket.IO. The server owns room membership, host identity, round state, timers, score changes and answer-validation calls.

## 2. High-Level Architecture

~~~mermaid
flowchart TB
    Browser[Browser]
    Frontend[React + Vite]
    Router[React Router]
    UI[Reusable Components]
    Theme[Theme Hook]
    Profile[Profile + Progression]
    SocketClient[Socket Service]

    Server[Node + Express + Socket.IO]
    Handlers[Socket Handlers]
    Engine[Game Engine]
    Store[Room Store]
    Redis[Redis Persistence + Adapter]
    Identity[Signed Player Identity]
    Validator[AI Validator]
    OpenAI[OpenAI API]
    Profile[Browser Profile Store]

    Browser --> Frontend
    Frontend --> Router
    Frontend --> UI
    Frontend --> Theme
    Frontend --> SocketClient
    Frontend --> Profile
    SocketClient <--> Server
    Server --> Handlers
    Handlers --> Engine
    Engine --> Store
    Store --> Redis
    SocketClient --> Identity
    Engine --> Validator
    Validator --> OpenAI
~~~

## 3. Client Architecture

### app/

Application shell and route definitions.

### pages/

Route-level screens: Home, CreateRoom, JoinRoom, WaitingRoom, Game, RoundResult, Leaderboard and NotFound.

### components/

Reusable UI grouped into common, game and rooms areas.

### hooks/

Reusable React behavior, currently including the theme hook.

### services/

External integrations. Socket.IO is isolated here.

### constants/

Shared gameplay configuration.

### styles/

| File | Responsibility |
| --- | --- |
| tokens.css | Theme variables and design tokens |
| base.css | Global font, reset and focus behavior |
| layout.css | Page and card geometry |
| components.css | Shared buttons, forms and widgets |
| pages.css | Route-specific styling |
| index.css | CSS import entry point |

## 4. Server Architecture

### server/index.js

Minimal process entry point.

### server/src/app.js

Builds the Express and Socket.IO application and composes the game dependencies.

### server/src/socket/registerHandlers.js

Owns Socket.IO events for room creation, room joining, game start, answer submission, next round, rematch and disconnects. It also carries player cosmetics and authoritative per-game streak/perfect-round counters.

### server/src/game/gameEngine.js

Owns starting rounds, resetting per-round data, timers, ending rounds, broadcasting results, and exposing per-player streak/progression fields.

### server/src/services/answerValidator.js

Keeps OpenAI-specific validation code outside the socket event layer. The validator performs an authoritative starting-letter check first, accepts known unambiguous answers from a small deterministic safety dictionary, then uses OpenAI Structured Outputs for unknown answers. A second, more permissive AI review runs only when the first AI pass rejects an unknown answer, reducing false negatives while keeping the common path fast. Positive validations are cached in memory.

### server/src/store/rooms.js

Owns the active in-memory room map.

### server/src/store/roomPersistence.js

Snapshots active room/session state into Render Key Value and restores sessions on process startup. In-flight rounds are closed safely after a restart instead of resuming an old timer.

### server/src/realtime/redisAdapter.js

Connects Socket.IO to the Render Key Value instance so Socket.IO broadcasts can coordinate across multiple server instances.

### server/src/auth/identity.js

Issues and verifies signed long-lived anonymous player identity tokens used for durable player sessions and reconnect/resume.

### server/src/utils/

Contains room-code and random-letter utilities.

## 5. Round Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> Waiting
    Waiting --> Active: startGame
    Active --> Result: timer
    Active --> Result: complete valid submission
    Result --> Active: nextRound
    Result --> Finished: final round
    Finished --> Active: rematch
    Finished --> [*]
~~~

## 6. Submission Flow

~~~mermaid
sequenceDiagram
    participant P as Player
    participant S as Server
    participant AI as OpenAI

    P->>S: submitAnswers
    S->>S: Lock submission
    S->>AI: Validate Name, Place, Thing, Animal and Food together
    AI-->>S: Structured JSON results
    S->>S: Calculate score
    S-->>P: Result events
~~~

## 7. Deployment

~~~mermaid
flowchart LR
    GitHub[GitHub] --> Vercel[Vercel]
    GitHub --> Render[Render]
    Vercel <--> Render
    Render --> OpenAI[OpenAI]
~~~

## 8. Architecture Principles

- The server is authoritative for game state.
- Socket.IO is the synchronization layer.
- Room state remains simple and in memory for the prototype.
- External integrations stay behind services.
- UI concerns stay separate from gameplay/domain concerns.

## 9. Scaling Path

For larger production deployments:

1. Persist game/session state.
2. Introduce Redis or equivalent for distributed realtime coordination.
3. Add a Socket.IO adapter.
4. Add database-backed durable room history with Render Postgres.
5. Add structured logging and monitoring.
6. Add automated integration and browser E2E tests.
