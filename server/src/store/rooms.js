const rooms = {};

function getRoom(roomCode) {
  return rooms[roomCode];
}

function hasRoom(roomCode) {
  return Boolean(rooms[roomCode]);
}

function createRoom(roomCode, room) {
  rooms[roomCode] = room;
  return room;
}

function deleteRoom(roomCode) {
  delete rooms[roomCode];
}

module.exports = {
  rooms,
  getRoom,
  hasRoom,
  createRoom,
  deleteRoom,
};
