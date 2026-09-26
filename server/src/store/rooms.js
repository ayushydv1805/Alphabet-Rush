const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const rooms = {};

function touchRoom(roomCode) {
  const room = rooms[roomCode];
  if (room) room.lastActivityAt = Date.now();
  return room;
}

function getRoom(roomCode) {
  return touchRoom(roomCode);
}

function hasRoom(roomCode) {
  return Boolean(rooms[roomCode]);
}

function createRoom(roomCode, room) {
  const now = Date.now();

  rooms[roomCode] = {
    ...room,
    createdAt: room.createdAt || now,
    lastActivityAt: now,
  };

  return rooms[roomCode];
}

function deleteRoom(roomCode) {
  delete rooms[roomCode];
}

function getRoomStats() {
  const roomList = Object.values(rooms);

  return {
    rooms: roomList.length,
    players: roomList.reduce(
      (total, room) =>
        total + (Array.isArray(room.players) ? room.players.length : 0),
      0
    ),
  };
}

function cleanupStaleRooms(now = Date.now()) {
  for (const [roomCode, room] of Object.entries(rooms)) {
    const lastActivity = room.lastActivityAt || room.createdAt || now;

    if (now - lastActivity < ROOM_TTL_MS) continue;

    if (room.roundTimer) clearTimeout(room.roundTimer);
    delete rooms[roomCode];
  }
}

const cleanupTimer = setInterval(cleanupStaleRooms, CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();

function stopRoomCleanup() {
  clearInterval(cleanupTimer);
}

module.exports = {
  ROOM_TTL_MS,
  rooms,
  getRoom,
  hasRoom,
  createRoom,
  deleteRoom,
  touchRoom,
  getRoomStats,
  cleanupStaleRooms,
  stopRoomCleanup,
};
