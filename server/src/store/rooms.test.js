const test = require("node:test");
const assert = require("node:assert/strict");
const {
  ROOM_TTL_MS,
  createRoom,
  getRoom,
  deleteRoom,
  getRoomStats,
  cleanupStaleRooms,
  rooms,
} = require("./rooms");

function clearRooms() {
  for (const code of Object.keys(rooms)) {
    deleteRoom(code);
  }
}

test("tracks room/player counts and removes stale rooms", () => {
  clearRooms();

  const staleRoom = createRoom("STALE1", {
    players: [{ id: "p1" }],
    roundEnded: true,
  });
  staleRoom.lastActivityAt = Date.now() - ROOM_TTL_MS - 1;

  assert.equal(getRoomStats().rooms, 1);
  assert.equal(getRoomStats().players, 1);

  cleanupStaleRooms(Date.now());

  assert.equal(getRoom("STALE1"), undefined);
  clearRooms();
});

test("touches room activity when accessed", () => {
  clearRooms();

  createRoom("LIVE01", {
    players: [],
    lastActivityAt: Date.now() - 1000,
  });

  const before = getRoom("LIVE01").lastActivityAt;
  const room = getRoom("LIVE01");

  assert.ok(room.lastActivityAt >= before);
  clearRooms();
});
