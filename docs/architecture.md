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
    SocketClient[Socket Service]

    Server[Node + Express + Socket.IO]
    Handlers[Socket Handlers]
    Engine[Game Engine]
    Store[Room Store]
    Validator[AI Validator]
    OpenAI[OpenAI API]

    Browser --> Frontend
    Frontend --> Router
    Frontend --> UI
    Frontend --> Theme
    Frontend --> SocketClient
    SocketClient <--> Server
    Server --> Handlers
    Handlers --> Engine
    Engine --> Store
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

Owns Socket.IO events for room creation, room joining, game start, answer submission, next round, rematch and disconnects.

### server/src/game/gameEngine.js

Owns starting rounds, resetting per-round data, timers, ending rounds and broadcasting results.

### server/src/services/answerValidator.js

Keeps OpenAI-specific validation code outside the socket event layer.

### server/src/store/rooms.js

Owns the active in-memory room map.

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
    par Name
        S->>AI: Validate Name
    and Place
        S->>AI: Validate Place
    and Thing
        S->>AI: Validate Thing
    and Animal
        S->>AI: Validate Animal
    and Food
        S->>AI: Validate Food
    end
    AI-->>S: Results
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
4. Add authentication and stronger authorization.
5. Add structured logging and monitoring.
6. Add automated integration tests.
