# Product Requirements Document — Alphabet Rush

## 1. Product Summary

Alphabet Rush is a real-time multiplayer browser game based on the Name–Place–Thing style word challenge.

Each round selects a shared alphabet letter. Players have a fixed time window to enter answers for Name, Place, Thing, Animal and Food.

The backend validates answers and maintains room and score state.

## 2. Product Goal

Build a multiplayer word game that is quick to start, easy to understand, fun with friends, synchronized in real time, and easy to maintain.

## 3. Users

### Host

The host creates a room, selects the number of rounds, starts the game and advances rounds.

### Player

A player joins through a room code, enters answers, submits them and views round/final results.

## 4. Core User Journey

~~~mermaid
flowchart TD
    A[Open game] --> B{Host or Player}
    B -->|Host| C[Create room]
    B -->|Player| D[Join room]
    C --> E[Waiting room]
    D --> E
    E --> F[Host starts game]
    F --> G[Timed round]
    G --> H[Enter 5 answers]
    H --> I[Server validation]
    I --> J[Round result]
    J --> K{More rounds?}
    K -->|Yes| G
    K -->|No| L[Final leaderboard]
~~~

## 5. Functional Requirements

### Room Management

- Generate a unique six-character code.
- Maximum 10 players.
- Prevent joining after the game has started.
- Synchronize player lists.

### Game Management

- Current frontend offers 5, 10, 15 and 20 rounds.
- Random uppercase letter per round.
- 60-second server-side round timer.
- Per-round submission state reset.
- Round results broadcast to the room.

### Answer Validation

Each answer should be non-empty, match the selected category, and begin with the required letter.

The server performs an authoritative starting-letter check and sends the submitted categories to the AI validator in one batched request. Successful validations are cached for the lifetime of the server process.

### Scoring

- One point per valid answer.
- Score is cumulative within a room.
- Each submitted player's round score is added to their cumulative score before the round result is broadcast.
- Round winner is determined by the highest number of valid answers in that round; ties are shown as co-winners.
- Round results expose both round points and cumulative scores.
- Each player can review which of their answers were right or wrong.
- Final leaderboard sorts players by score.

## 6. Inputs

### Create Room
- Player name.
- Number of rounds.

### Join Room
- Player name.
- Room code.

### Round
- Name answer.
- Place answer.
- Thing answer.
- Animal answer.
- Food answer.

## 7. Outputs

- Room creation/join confirmation.
- Player list synchronization.
- Round start data.
- Player submission notifications.
- Round results.
- Updated scores.
- Final leaderboard.

## 8. Non-Goals

The current product does not provide user accounts, persistent match history, ranked matchmaking, full anti-cheat infrastructure, multi-region room state, or guaranteed semantic correctness from AI validation.

## 9. Success Criteria

A basic multiplayer session is successful when multiple browser clients can join the same room, receive the same letter, submit answers, receive results, continue through the configured rounds and see a final leaderboard.
