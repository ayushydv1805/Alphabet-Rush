const { createClient } = require("redis");
const { ROOM_TTL_MS, rooms } = require("./rooms");

const PREFIX = "alphabet-rush:room:";
const TTL_SECONDS = Math.ceil(ROOM_TTL_MS / 1000);
let client = null;
let connected = false;

function key(roomCode) {
  return PREFIX + roomCode;
}

function serializeRoom(room) {
  return {
    ...room,
    roundTimer: null,
    players: (room.players || []).map((player) => ({
      ...player,
      id: player.playerId || player.id,
    })),
  };
}

function restoreRoom(rawRoom) {
  const room = {
    ...rawRoom,
    roundTimer: null,
    pendingValidations: 0,
    lastActivityAt: Date.now(),
    recoveredFromRestart: false,
  };

  room.players = (rawRoom.players || []).map((player) => ({
    ...player,
    id: player.playerId || player.id,
    playerId: player.playerId || player.id,
  }));

  // An in-flight round cannot safely resume its old timer after a process
  // restart. Preserve the session and scores and close that stale round.
  if (room.currentRound > 0 && !room.roundEnded) {
    room.roundEnded = true;
    room.roundExpired = true;
    room.recoveredFromRestart = true;
  }

  return room;
}

async function initRoomPersistence() {
  if (!process.env.REDIS_URL) return false;

  client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (error) => {
    connected = false;
    console.error(
      JSON.stringify({
        event: "redis_persistence_error",
        message: error.message,
      })
    );
  });

  await client.connect();
  connected = true;
  return true;
}

async function hydrateRooms() {
  if (!connected || !client) return 0;

  let restored = 0;

  for await (const scanKey of client.scanIterator({
    MATCH: PREFIX + "*",
    COUNT: 100,
  })) {
    const raw = await client.get(scanKey);
    if (!raw) continue;

    try {
      const room = restoreRoom(JSON.parse(raw));
      const roomCode = scanKey.slice(PREFIX.length);
      room.roomCode = roomCode;
      rooms[roomCode] = room;
      restored += 1;
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "redis_room_restore_error",
          key: scanKey,
          message: error.message,
        })
      );
    }
  }

  return restored;
}

async function persistRoom(room) {
  if (!connected || !client || !room) return false;
  const roomCode = room.roomCode;
  if (!roomCode) return false;

  try {
    await client.set(key(roomCode), JSON.stringify(serializeRoom(room)), {
      EX: TTL_SECONDS,
    });
    return true;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "redis_room_save_error",
        roomCode,
        message: error.message,
      })
    );
    return false;
  }
}

async function deletePersistedRoom(roomCode) {
  if (!connected || !client || !roomCode) return;
  try {
    await client.del(key(roomCode));
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "redis_room_delete_error",
        roomCode,
        message: error.message,
      })
    );
  }
}

async function closeRoomPersistence() {
  connected = false;
  if (client) {
    await client.quit().catch(() => {});
    client = null;
  }
}

module.exports = {
  initRoomPersistence,
  hydrateRooms,
  persistRoom,
  deletePersistedRoom,
  closeRoomPersistence,
};
