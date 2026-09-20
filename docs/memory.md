# Project Memory — Alphabet Rush

This is the fast onboarding reference for a developer who needs the codebase map before reading implementation details.

## 1. Project in One Sentence

Alphabet Rush is a Socket.IO multiplayer Name–Place–Thing style game where players enter five answers for a random letter and receive AI-validated scores.

## 2. Must-Know Frontend Files

| File | Why it matters |
| --- | --- |
| client/src/app/App.jsx | Routes and global theme control |
| client/src/pages/Game.jsx | Main gameplay screen |
| client/src/pages/WaitingRoom.jsx | Room/player synchronization |
| client/src/pages/RoundResult.jsx | Round result and next-round action |
| client/src/pages/Leaderboard.jsx | Final results and rematch |
| client/src/components/game/AnswerField.jsx | Reusable answer input |
| client/src/components/rooms/PlayerList.jsx | Reusable player/score list |
| client/src/services/socket.js | Socket.IO client |
| client/src/hooks/useTheme.js | Theme state |
| client/src/constants/game.js | Shared game configuration |
| client/src/styles/ | Complete style system |

## 3. Must-Know Backend Files

| File | Why it matters |
| --- | --- |
| server/index.js | Process entry point |
| server/src/app.js | Express + Socket.IO composition |
| server/src/socket/registerHandlers.js | Realtime event handlers |
| server/src/game/gameEngine.js | Round lifecycle and timers |
| server/src/services/answerValidator.js | OpenAI validation |
| server/src/store/rooms.js | Active room state |
| server/src/utils/roomCode.js | Room code generation |
| server/src/utils/randomLetter.js | Random letter generation |

## 4. Runtime Facts

- Default frontend Socket.IO URL: https://alphabet-rush-server.onrender.com
- Override with VITE_SOCKET_URL.
- Backend default port: 5000.
- Backend requires OPENAI_API_KEY.
- Active room state is in memory.
- Default round duration is 60 seconds.
- Maximum players per room is 10.
- Current round options are 5, 10, 15 and 20.
- Five categories are validated each round.

## 5. Socket Event Names

### Client → Server

~~~text
createRoom
joinRoom
startGame
submitAnswers
nextRound
rematch
~~~

### Server → Client

~~~text
roomCreated
roomJoined
joinError
roomUpdated
gameStarted
playerSubmitted
roundEnded
gameOver
~~~

## 6. Where to Put New Code

Reusable UI → client/src/components/

Reusable React behavior → client/src/hooks/

New route screen → client/src/pages/

External client integration → client/src/services/

Static gameplay config → client/src/constants/

Game lifecycle logic → server/src/game/

Socket event logic → server/src/socket/

AI integration → server/src/services/

Room state → server/src/store/

Shared visual tokens → client/src/styles/tokens.css

## 7. Important Debug Paths

### Game does not start

WaitingRoom.jsx → startGame → registerHandlers.js → gameEngine.js

### Answers are invalid

Game.jsx → submitAnswers → answerValidator.js

### Scores are wrong

registerHandlers.js → validation result → score update → roundEnded

### Round does not advance

RoundResult.jsx → nextRound → host authorization → gameEngine.js

### Socket connection fails

client/src/services/socket.js → VITE_SOCKET_URL → server CORS

### Theme is wrong

useTheme.js → document dataset → tokens.css

## 8. Architectural Warning

The frontend is a client, not the authority.

The server owns room membership, host identity, round number, current letter, round completion state, player scores and submission state.

## 9. Known Technical Debt

- No complete automated test suite.
- AI failures are treated as invalid answers.
- Room state is not persistent.
- Host-only action UX needs improvement.
- Socket connection/reconnection UX needs improvement.
- Server payload validation needs strengthening.
- Stale submissions need round identifiers.

## 10. Reading Order

Recommended onboarding:

1. README.md
2. docs/architecture.md
3. docs/prd.md
4. docs/design.md
5. docs/rules.md
6. docs/tasks.md
7. docs/memory.md
