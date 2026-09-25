const test = require("node:test");
const assert = require("node:assert/strict");
const { createGameEngine } = require("./gameEngine");
const { createRoom, getRoom, deleteRoom } = require("../store/rooms");

function ioSpy() {
  const events = [];
  return {
    events,
    to(roomCode) {
      return {
        emit(event, payload) {
          events.push({ roomCode, event, payload });
        },
      };
    },
  };
}

function addRoom(code, mode = "classic") {
  createRoom(code, {
    gameId: "game-" + code,
    hostId: "host",
    rounds: 5,
    gameMode: mode,
    currentRound: 0,
    currentLetter: null,
    roundId: null,
    roundStartedAt: null,
    winnerId: null,
    winnerIds: [],
    winnerNames: [],
    roundEnded: true,
    roundExpired: false,
    pendingValidations: 0,
    roundTimer: null,
    players: [{
      id: "host",
      name: "Host",
      score: 0,
      roundPoints: 0,
      correctCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      perfectRounds: 0,
      answers: {},
      validation: {},
      submittedAt: null,
      submitted: false,
    }],
  });
}

test("startRound creates an authoritative round id", () => {
  const io = ioSpy();
  const engine = createGameEngine({ io });
  addRoom("TEST01");

  engine.startRound("TEST01", 1);
  const current = getRoom("TEST01");
  const started = io.events.find((event) => event.event === "gameStarted");

  assert.match(current.roundId, /^[0-9a-f-]{36}$/);
  assert.equal(started.payload.roundId, current.roundId);

  clearTimeout(current.roundTimer);
  deleteRoom("TEST01");
});

test("round result includes mode metadata without throwing", () => {
  const io = ioSpy();
  const engine = createGameEngine({ io });
  addRoom("TEST02", "double");
  const current = getRoom("TEST02");
  current.currentRound = 1;
  current.currentLetter = "N";
  current.roundId = "round-1";
  current.roundStartedAt = Date.now();
  current.players[0].roundPoints = 2;
  current.players[0].submitted = true;
  current.roundEnded = false;

  assert.doesNotThrow(() => engine.sendRoundResult("TEST02", "time-up"));
  const ended = io.events.find((event) => event.event === "roundEnded");

  assert.equal(ended.payload.modeName, "Double Points");
  assert.equal(ended.payload.roundId, "round-1");
  deleteRoom("TEST02");
});
