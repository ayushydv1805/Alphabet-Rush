const test = require("node:test");
const assert = require("node:assert/strict");
const {
  registerSocketHandlers,
  toPlayerSummary,
} = require("./registerHandlers");
const { rooms, getRoom, deleteRoom } = require("../store/rooms");

function createSocket(id) {
  const handlers = {};
  const emitted = [];
  const joined = [];

  return {
    id,
    handlers,
    emitted,
    joined,
    on(event, handler) {
      handlers[event] = handler;
    },
    emit(event, payload) {
      emitted.push({ event, payload });
    },
    join(roomCode) {
      joined.push(roomCode);
    },
  };
}

function createIo() {
  let connectionHandler;
  const broadcast = [];

  return {
    broadcast,
    on(event, handler) {
      if (event === "connection") connectionHandler = handler;
    },
    connect(socket) {
      connectionHandler(socket);
    },
    to(roomCode) {
      return {
        emit(event, payload) {
          broadcast.push({ roomCode, event, payload });
        },
      };
    },
  };
}

function clearRooms() {
  for (const roomCode of Object.keys(rooms)) {
    deleteRoom(roomCode);
  }
}

test("creates a room with sanitized profile cosmetics", () => {
  clearRooms();

  const io = createIo();

  registerSocketHandlers({
    io,
    validateAnswers: async () => ({}),
    startRound: () => {},
    endRound: () => {},
  });

  const socket = createSocket("host-1");
  io.connect(socket);

  socket.handlers.createRoom({
    playerName: "Ayush",
    rounds: 5,
    gameMode: "classic",
    profile: {
      avatar: "⚡",
      title: "Rush Rookie",
    },
  });

  const created = socket.emitted.find((item) => item.event === "roomCreated");
  assert.ok(created);

  const room = getRoom(created.payload.roomCode);
  assert.equal(room.players[0].name, "Ayush");
  assert.equal(room.players[0].avatar, "⚡");
  assert.equal(room.players[0].title, "Rush Rookie");
  assert.equal(toPlayerSummary(room.players[0]).avatar, "⚡");

  deleteRoom(created.payload.roomCode);
});

test("rejects next-round requests from a non-host", () => {
  clearRooms();

  const io = createIo();
  registerSocketHandlers({
    io,
    validateAnswers: async () => ({}),
    startRound: () => {},
    endRound: () => {},
  });

  const host = createSocket("host-2");
  const guest = createSocket("guest-2");
  io.connect(host);
  io.connect(guest);

  host.handlers.createRoom({
    playerName: "Host",
    rounds: 5,
    gameMode: "classic",
  });

  const created = host.emitted.find((item) => item.event === "roomCreated");
  const roomCode = created.payload.roomCode;
  const room = getRoom(roomCode);

  room.currentRound = 1;
  room.roundEnded = true;
  room.roundId = "round-1";
  room.gameId = "game-1";

  guest.handlers.nextRound({
    roomCode,
    roundId: "round-1",
    gameId: "game-1",
  });

  assert.equal(
    guest.emitted.at(-1).payload,
    "Only the host can advance the round."
  );

  deleteRoom(roomCode);
});

test("scores a validated socket submission and emits progress", async () => {
  clearRooms();

  const io = createIo();
  let ended = false;

  registerSocketHandlers({
    io,
    validateAnswers: async () => ({
      name: true,
      place: true,
      thing: true,
      animal: true,
      food: true,
    }),
    startRound: () => {},
    endRound: () => {
      ended = true;
    },
  });

  const host = createSocket("host-3");
  io.connect(host);

  host.handlers.createRoom({
    playerName: "Host",
    rounds: 5,
    gameMode: "classic",
  });

  const roomCode = host.emitted.find((item) => item.event === "roomCreated").payload.roomCode;
  const room = getRoom(roomCode);

  room.currentRound = 1;
  room.currentLetter = "N";
  room.roundId = "round-3";
  room.roundEnded = false;
  room.roundExpired = false;

  await host.handlers.submitAnswers({
    roomCode,
    roundId: "round-3",
    answers: {
      name: "Nitin",
      place: "Nagaland",
      thing: "Nail",
      animal: "Narwhal",
      food: "Noodles",
    },
  });

  assert.equal(room.players[0].roundPoints, 5);
  assert.equal(room.players[0].score, 5);
  assert.equal(room.players[0].currentStreak, 1);
  assert.equal(room.players[0].perfectRounds, 1);
  assert.ok(
    host.emitted.some((item) => item.event === "submissionValidated")
  );
  assert.equal(ended, true);

  deleteRoom(roomCode);
});
