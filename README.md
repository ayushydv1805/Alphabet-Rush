# 🔤 Alphabet Rush

> **A real-time multiplayer word challenge where players race against the clock to find valid Name, Place, Thing, Animal, and Food answers for a randomly selected letter.**

Alphabet Rush is a full-stack multiplayer game built with **React + Vite** on the frontend and **Node.js + Express + Socket.IO** on the backend. Answer validation is performed through the **OpenAI API**, while active rooms and scores are kept in server memory.

[![Live App](https://img.shields.io/badge/Live%20App-Vercel-black?logo=vercel)](https://alphabet-rush.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js)](https://nodejs.org/)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io)](https://socket.io/)
[![AI](https://img.shields.io/badge/Validation-OpenAI-412991?logo=openai)](https://platform.openai.com/)

---

## 🌐 Live

| Service | Link |
| --- | --- |
| 🎮 Web Application | https://alphabet-rush.vercel.app/ |
| ⚙️ Socket.IO Server | https://alphabet-rush-server.onrender.com/ |
| 💻 GitHub Repository | https://github.com/ayushydv1805/Alphabet-Rush |

---

## 📚 Project Documentation

The repository includes focused documentation for product requirements, architecture, engineering rules, UI/UX decisions, roadmap and onboarding.

| **File** | **What it explains** |
| --- | --- |
| [docs/prd.md](docs/prd.md) | Product goal, players, gameplay, features, inputs, outputs, scope and non-goals |
| [docs/architecture.md](docs/architecture.md) | Frontend, Socket.IO backend, AI validation, room state, data flow and deployment |
| [docs/rules.md](docs/rules.md) | Coding, Git, security, realtime-game and validation rules |
| [docs/design.md](docs/design.md) | UI hierarchy, responsive behavior, light/dark theme and UX principles |
| [docs/tasks.md](docs/tasks.md) | Completed work, priorities, roadmap and definition of done |
| [docs/memory.md](docs/memory.md) | Quick project memory, important files, commands and debugging notes |

**New to the codebase? Start with docs/architecture.md.**

---

## 🎯 What Alphabet Rush Solves

Alphabet Rush turns the classic Name–Place–Thing style game into a synchronized browser multiplayer experience.

A typical match works like this:

1. A host creates a private room.
2. Friends join using a six-character room code.
3. The server starts a round and selects a random uppercase letter.
4. Everyone gets the same letter and a 60-second round.
5. Each player enters answers for five categories.
6. The server validates the answers through the AI validation service.
7. Scores are updated and round results are broadcast.
8. The host advances the game until the final leaderboard.

---

## ✨ Core Features

### 🎮 Multiplayer Rooms
- Private rooms with six-character codes.
- Up to **10 players** per room.
- Host-controlled start and round progression.
- Host transfer when the current host disconnects.

### 🔤 Five Word Categories

Every round asks for:
- Name
- Place
- Thing
- Animal
- Food

### ⏱️ Timed Gameplay
- Default round duration: **60 seconds**.
- Client countdown for player feedback.
- Server-side round timer for authoritative round completion.

### 🤖 AI Answer Validation

Each answer is checked for:
- Required starting letter on the server.
- Known, unambiguous answers through deterministic validation.
- Unknown answers through OpenAI Structured Outputs.
- A second permissive AI review for first-pass false negatives.
- Optional web-backed factual confirmation during the second review.

The server first checks the starting letter deterministically, then accepts common unambiguous answers from a trusted built-in dictionary. Answers outside that dictionary go through OpenAI Structured Outputs, with a second permissive review only when the first AI pass rejects an answer. This is designed to reduce false negatives while keeping common answers fast.

### 🏆 Scoring

Each valid category answer contributes **1 point**, so a player can earn up to **5 points per round**.


### 🧬 Player Progression
- Persistent browser-based player profiles.
- XP and level progression.
- Lifetime games, rounds, points, wins, perfect rounds and streak statistics.
- Unlockable avatars and player titles.
- Round awards such as Perfect Round, Word Machine, On Fire, Round Winner and Quick Thinker.

### 🌓 Light / Dark Mode
- Global theme control in the top-right.
- Theme stored in browser localStorage.
- Shared CSS design tokens keep the themes consistent.

### 📱 Responsive UI
The interface adapts to desktop, tablet and mobile widths.

### 🚫 Custom 404
Unknown frontend routes use a dedicated React 404 page. Vercel rewrites direct browser requests to the SPA entry point so React Router can handle the route.

---

## 🧠 System Architecture

~~~mermaid
flowchart TD
    U[Player Browser] --> R[React + Vite]
    R --> P[React Router]
    R --> S[Socket.IO Client]
    R --> T[Theme Hook]
    T --> L[localStorage]

    S <--> W[Socket.IO Server]
    W --> H[Socket Event Handlers]
    H --> G[Game Engine]
    G --> M[In-Memory Room Store]
    G --> V[Answer Validator]
    V --> O[OpenAI API]
~~~

### Responsibilities

| Layer | Responsibility |
| --- | --- |
| Pages | Route-level screens and orchestration |
| Components | Reusable visual building blocks |
| Hooks | Reusable client-side behavior |
| Services | External integrations |
| Constants | Shared game configuration |
| Styles | Theme tokens, layout, components and page styling |
| Socket handlers | Realtime event orchestration |
| Game engine | Round lifecycle and timers |
| Room store | Active room state |
| Validator | OpenAI-backed answer validation |

---

## 🔄 Gameplay Flow

~~~mermaid
sequenceDiagram
    participant Host as Host
    participant Players as Players
    participant UI as React Client
    participant Server as Socket.IO Server
    participant AI as OpenAI

    Host->>UI: Create room
    UI->>Server: createRoom
    Server-->>UI: roomCreated

    Players->>UI: Enter room code
    UI->>Server: joinRoom
    Server-->>UI: roomJoined
    Server-->>UI: roomUpdated

    Host->>UI: Start game
    UI->>Server: startGame
    Server-->>UI: gameStarted

    Players->>UI: Enter five answers
    UI->>Server: submitAnswers
    Server->>AI: Validate five answers
    AI-->>Server: Validation results

    Server-->>UI: playerSubmitted
    Server-->>UI: roundEnded

    Host->>UI: Next round
    UI->>Server: nextRound
    Server-->>UI: gameStarted

    Host->>UI: Finish final round
    UI->>Server: nextRound
    Server-->>UI: gameOver
~~~

---

## 📡 Socket Event Contract

### Client → Server

| Event | Purpose |
| --- | --- |
| createRoom | Create a new room |
| joinRoom | Join an existing room |
| startGame | Start the first round |
| submitAnswers | Submit the five answers |
| nextRound | Advance to another round |
| rematch | Restart the room |

### Server → Client

| Event | Purpose |
| --- | --- |
| roomCreated | Returns newly created room data |
| roomJoined | Confirms successful join |
| joinError | Reports an unsuccessful join |
| roomUpdated | Synchronizes room players |
| gameStarted | Starts a round |
| playerSubmitted | Announces a player's submission |
| roundEnded | Returns round results |
| gameOver | Returns final leaderboard data |

---

## 🧮 Scoring Model

| Category | Example for A | Valid | Points |
| --- | --- | :---: | ---: |
| Name | Amit | ✅ | 1 |
| Place | Agra | ✅ | 1 |
| Thing | Apple | ✅ | 1 |
| Animal | Ant | ✅ | 1 |
| Food | Aloo | ✅ | 1 |
| **Total** | | | **5** |

The score is cumulative for the lifetime of the room.

---

## 🗂️ Project Structure

~~~text
Alphabet-Rush/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   └── App.jsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── ThemeToggle.jsx
│   │   │   ├── game/
│   │   │   │   ├── AnswerField.jsx
│   │   │   │   └── PlayerSubmissionStatus.jsx
│   │   │   └── rooms/
│   │   │       ├── PlayerList.jsx
│   │   │       └── RoomCode.jsx
│   │   ├── constants/
│   │   │   └── game.js
│   │   ├── hooks/
│   │   │   └── useTheme.js
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── CreateRoom.jsx
│   │   │   ├── JoinRoom.jsx
│   │   │   ├── WaitingRoom.jsx
│   │   │   ├── Game.jsx
│   │   │   ├── RoundResult.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/
│   │   │   └── socket.js
│   │   ├── styles/
│   │   │   ├── tokens.css
│   │   │   ├── base.css
│   │   │   ├── layout.css
│   │   │   ├── components.css
│   │   │   ├── pages.css
│   │   │   └── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── cors.js
│   │   ├── game/
│   │   │   └── gameEngine.js
│   │   ├── services/
│   │   │   └── answerValidator.js
│   │   ├── socket/
│   │   │   └── registerHandlers.js
│   │   ├── store/
│   │   │   └── rooms.js
│   │   └── utils/
│   │       ├── randomLetter.js
│   │       └── roomCode.js
│   ├── index.js
│   └── package.json
│
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   ├── rules.md
│   ├── design.md
│   ├── tasks.md
│   └── memory.md
│
├── package.json
├── package-lock.json
└── README.md
~~~

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 |
| Build tool | Vite |
| Routing | React Router |
| Realtime | Socket.IO Client |
| Backend | Node.js + Express |
| Realtime server | Socket.IO |
| AI validation | OpenAI API |
| Styling | CSS |
| Typography | Inter |
| Frontend deployment | Vercel |
| Backend deployment | Render |
| Version control | GitHub |

---

## 🚀 Run Locally

### 1. Clone

~~~bash
git clone https://github.com/ayushydv1805/Alphabet-Rush.git
cd Alphabet-Rush
~~~

### 2. Frontend

~~~bash
cd client
npm install
~~~

Optional local Socket.IO override:

~~~env
VITE_SOCKET_URL=http://localhost:5000
~~~

Start the frontend:

~~~bash
npm run dev
~~~

### 3. Backend

In another terminal:

~~~bash
cd server
npm install
~~~

Create server environment variables:

~~~env
OPENAI_API_KEY=your_openai_api_key
PORT=5000
~~~

Start the backend:

~~~bash
npm run dev
~~~

The backend test route is:

~~~text
http://localhost:5000/
~~~

---

## 🧪 Available Commands

### Frontend

~~~bash
cd client
npm run dev
npm run build
npm run lint
npm run preview
~~~

### Backend

~~~bash
cd server
npm run dev
npm start
npm test
~~~

The repository currently has **no automated test suite**. The backend test command is a placeholder.

---

## 🔐 Environment Variables

### Client

| Variable | Required | Purpose |
| --- | :---: | --- |
| VITE_SOCKET_URL | No | Overrides the Socket.IO server URL |

Default:

~~~text
https://alphabet-rush-server.onrender.com
~~~

### Server

| Variable | Required | Purpose |
| --- | :---: | --- |
| OPENAI_API_KEY | Yes | OpenAI answer validation |
| PORT | No | HTTP/Socket.IO server port |

**Never commit API keys or environment files.**

---

## ☁️ Deployment

~~~mermaid
flowchart LR
    G[GitHub main] --> V[Vercel]
    G --> R[Render]

    V --> F[React + Vite]
    R --> B[Node + Express + Socket.IO]

    F <--> B
    B --> O[OpenAI API]
~~~

### Vercel

The frontend is deployed from the client project. The Vercel configuration rewrites browser routes to the SPA entry point so React Router can handle direct navigation.

### Render

The backend starts from server/index.js.

Recommended Render start command:

~~~bash
npm start
~~~

Set OPENAI_API_KEY in the Render environment.

---

## ⚠️ Current Limitations

The current implementation is intentionally prototype-oriented:

- Active rooms are stored in server memory.
- Rooms disappear if the backend process restarts.
- There is no database persistence.
- There is no user authentication system.
- Answer validation depends on the OpenAI service.
- If the AI service is unavailable, only answers covered by the trusted deterministic dictionary can be accepted; unknown answers are not awarded automatically.
- The validator caches successful category results only for the lifetime of the server process.
- The design is not currently configured for multiple Socket.IO server instances.
- There is no complete automated test suite.
- CORS is explicitly configured for the current frontend origins.
- Route navigation uses browser history state for game-session data, so refreshing some game/result pages can lose that state.

---

## 🔮 Roadmap

### Reliability
- [ ] Automated game-engine unit tests.
- [ ] Socket.IO integration tests.
- [ ] Round identifiers for stale-event protection.
- [ ] Stronger payload validation.
- [ ] Better disconnect/reconnect handling.
- [ ] Connection status UI.

### UX
- [ ] Replace browser alerts with reusable in-app messages.
- [ ] Clear host-only controls in the UI.
- [ ] Better loading/error state during AI validation.
- [ ] More accessibility and keyboard-flow testing.

### Production
- [ ] Persistent game/session storage.
- [ ] Redis or equivalent realtime coordination.
- [ ] Authentication.
- [ ] Rate limiting.
- [ ] Structured logging and monitoring.

### Product
- [ ] Custom category sets.
- [ ] Player profiles and avatars.
- [ ] Match history and statistics.
- [ ] Sound effects and richer game feedback.
- [ ] Spectator mode.

---

## 🤝 Contributing

1. Create a feature branch.
2. Keep pages focused on page-level orchestration.
3. Reuse shared components.
4. Put reusable behavior in hooks.
5. Put external integrations in services.
6. Run frontend lint/build checks.
7. Update documentation when behavior or architecture changes.

Example:

~~~bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature
~~~

Read docs/rules.md before making larger changes.

---

## 📌 Definition of Done

A feature is complete when:

- The intended user flow works.
- Both light and dark themes remain usable.
- Desktop and mobile layouts remain usable.
- Socket listeners are cleaned up where applicable.
- Errors do not leave the interface in an unusable state.
- Logic is placed in the appropriate module.
- Relevant lint/build/tests have been run.
- Documentation is updated when necessary.

---

## 📜 Disclaimer

Alphabet Rush is a learning, experimentation and multiplayer gameplay project. AI validation can produce incorrect classifications, and multiplayer behavior depends on the availability of the deployed backend and external validation service.

---

## 👨‍💻 Alphabet Rush

**Real-time multiplayer word challenge built with React, Socket.IO and OpenAI.**

[Play Alphabet Rush →](https://alphabet-rush.vercel.app/)

[View Repository →](https://github.com/ayushydv1805/Alphabet-Rush)


> Validation note: answer submissions now perform a deterministic starting-letter check before AI validation and use a safe fallback for known valid answers when the validation service is unavailable.


> Deployment check refreshed: latest main-branch build is ready for the connected Vercel project.
