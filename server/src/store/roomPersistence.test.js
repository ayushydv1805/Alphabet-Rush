const test = require("node:test");
const assert = require("node:assert/strict");
const {
  serializeRoom,
  restoreRoom,
} = require("./roomPersistence");

test("serializes rooms without ephemeral timer state", () => {
  const serialized = serializeRoom({
    roomCode: "ABC123",
    gameId: "game-1",
    roundTimer: { fake: true },
    players: [
      {
        id: "socket-1",
        playerId: "player-1",
        name: "Ayush",
      },
    ],
  });

  assert.equal(serialized.roundTimer, null);
  assert.equal(serialized.players[0].id, "player-1");
  assert.equal(serialized.players[0].playerId, "player-1");
  assert.ok(Number.isFinite(serialized.updatedAt));
});

test("restores durable player ids and closes an interrupted round safely", () => {
  const room = restoreRoom({
    roomCode: "ABC123",
    gameId: "game-2",
    currentRound: 2,
    roundEnded: false,
    players: [{ id: "socket-old", playerId: "player-2", name: "Player" }],
  });

  assert.equal(room.roundEnded, true);
  assert.equal(room.roundExpired, true);
  assert.equal(room.recoveredFromRestart, true);
  assert.equal(room.players[0].id, "player-2");
  assert.equal(room.players[0].playerId, "player-2");
});
