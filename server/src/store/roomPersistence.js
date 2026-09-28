const { createClient } = require("redis");
const { Pool } = require("pg");
const { ROOM_TTL_MS, rooms } = require("./rooms");

const PREFIX = "alphabet-rush:room:";
const TTL_SECONDS = Math.ceil(ROOM_TTL_MS / 1000);

let redisClient = null;
let redisConnected = false;
let dbPool = null;
let dbConnected = false;

function key(roomCode) {
  return PREFIX + roomCode;
}

function serializeRoom(room) {
  return {
    ...room,
    updatedAt: Date.now(),
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
    lastActivityAt: rawRoom.lastActivityAt || Date.now(),
    updatedAt: rawRoom.updatedAt || Date.now(),
    recoveredFromRestart: false,
  };

  room.players = (rawRoom.players || []).map((player) => ({
    ...player,
    id: player.playerId || player.id,
    playerId: player.playerId || player.id,
  }));

  // A round in progress cannot safely resume its old timer after a process
  // restart. Preserve the room and scores, but close that stale round.
  if (room.currentRound > 0 && !room.roundEnded) {
    room.roundEnded = true;
    room.roundExpired = true;
    room.recoveredFromRestart = true;
  }

  return room;
}

async function initPostgresPersistence() {
  if (!process.env.DATABASE_URL) return false;

  dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });

  dbPool.on("error", (error) => {
    dbConnected = false;
    console.error(
      JSON.stringify({
        event: "postgres_persistence_error",
        message: error.message,
      })
    );
  });

  const client = await dbPool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS alphabet_rush_rooms (
        room_code TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS alphabet_rush_rooms_expires_idx
      ON alphabet_rush_rooms (expires_at)
    `);

    await client.query(
      "DELETE FROM alphabet_rush_rooms WHERE expires_at <= NOW()"
    );

    dbConnected = true;
  } finally {
    client.release();
  }

  return true;
}

async function initRedisPersistence() {
  if (!process.env.REDIS_URL) return false;

  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on("error", (error) => {
    redisConnected = false;
    console.error(
      JSON.stringify({
        event: "redis_persistence_error",
        message: error.message,
      })
    );
  });

  await redisClient.connect();
  redisConnected = true;
  return true;
}

async function initRoomPersistence() {
  const [dbResult, redisResult] = await Promise.allSettled([
    initPostgresPersistence(),
    initRedisPersistence(),
  ]);

  if (dbResult.status === "rejected") {
    console.error(
      JSON.stringify({
        event: "postgres_persistence_startup_error",
        message: dbResult.reason?.message || "Unknown error",
      })
    );
    dbConnected = false;
  }

  if (redisResult.status === "rejected") {
    console.error(
      JSON.stringify({
        event: "redis_persistence_startup_error",
        message: redisResult.reason?.message || "Unknown error",
      })
    );
    redisConnected = false;
  }

  return dbConnected || redisConnected;
}

async function hydrateFromPostgres() {
  if (!dbConnected || !dbPool) return 0;

  const result = await dbPool.query(
    "SELECT room_code, payload, EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_at_ms FROM alphabet_rush_rooms WHERE expires_at > NOW()"
  );

  let restored = 0;

  for (const row of result.rows) {
    try {
      const rawRoom = {
        ...row.payload,
        updatedAt: Number(row.updated_at_ms) || row.payload.updatedAt,
      };
      const room = restoreRoom(rawRoom);
      room.roomCode = row.room_code;
      rooms[row.room_code] = room;
      restored += 1;
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "postgres_room_restore_error",
          roomCode: row.room_code,
          message: error.message,
        })
      );
    }
  }

  return restored;
}

async function hydrateFromRedis() {
  if (!redisConnected || !redisClient) return 0;

  let restored = 0;
  const keys = await redisClient.keys(PREFIX + "*");

  for (const scanKey of keys) {
    const raw = await redisClient.get(scanKey);
    if (!raw) continue;

    const roomCode = scanKey.slice(PREFIX.length);

    try {
      const candidate = restoreRoom(JSON.parse(raw));
      candidate.roomCode = roomCode;

      const current = rooms[roomCode];
      const candidateUpdated = Number(candidate.updatedAt) || 0;
      const currentUpdated = Number(current?.updatedAt) || 0;

      if (!current || candidateUpdated >= currentUpdated) {
        rooms[roomCode] = candidate;
        restored += current ? 0 : 1;
      }
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

async function loadPersistedRoom(roomCode) {
  if (!roomCode) return null;

  const candidates = [];

  if (redisConnected && redisClient) {
    try {
      const raw = await redisClient.get(key(roomCode));
      if (raw) {
        candidates.push({
          source: "redis",
          room: restoreRoom(JSON.parse(raw)),
        });
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "redis_room_load_error",
          roomCode,
          message: error.message,
        })
      );
    }
  }

  if (dbConnected && dbPool) {
    try {
      const result = await dbPool.query(
        "SELECT room_code, payload, EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_at_ms FROM alphabet_rush_rooms WHERE room_code = $1 AND expires_at > NOW() LIMIT 1",
        [roomCode]
      );

      const row = result.rows[0];
      if (row) {
        candidates.push({
          source: "postgres",
          room: restoreRoom({
            ...row.payload,
            updatedAt: Number(row.updated_at_ms) || row.payload.updatedAt,
          }),
        });
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "postgres_room_load_error",
          roomCode,
          message: error.message,
        })
      );
    }
  }

  if (!candidates.length) return null;

  const selected = candidates.reduce((latest, candidate) => {
    if (!latest) return candidate;
    return (Number(candidate.room.updatedAt) || 0) >
      (Number(latest.room.updatedAt) || 0)
      ? candidate
      : latest;
  }, null);

  selected.room.roomCode = roomCode;
  rooms[roomCode] = selected.room;

  return selected.room;
}

async function hydrateRooms() {
  const [dbResult, redisResult] = await Promise.allSettled([
    hydrateFromPostgres(),
    hydrateFromRedis(),
  ]);

  if (dbResult.status === "rejected") {
    console.error(
      JSON.stringify({
        event: "postgres_room_hydration_error",
        message: dbResult.reason?.message || "Unknown error",
      })
    );
  }

  if (redisResult.status === "rejected") {
    console.error(
      JSON.stringify({
        event: "redis_room_hydration_error",
        message: redisResult.reason?.message || "Unknown error",
      })
    );
  }

  return (dbResult.status === "fulfilled" ? dbResult.value : 0) +
    (redisResult.status === "fulfilled" ? redisResult.value : 0);
}

async function persistToPostgres(room) {
  if (!dbConnected || !dbPool || !room?.roomCode) return false;

  const serialized = serializeRoom(room);

  await dbPool.query(
    `
      INSERT INTO alphabet_rush_rooms (
        room_code,
        game_id,
        payload,
        updated_at,
        expires_at
      )
      VALUES (
        $1,
        $2,
        $3::jsonb,
        NOW(),
        NOW() + INTERVAL '2 hours'
      )
      ON CONFLICT (room_code)
      DO UPDATE SET
        game_id = EXCLUDED.game_id,
        payload = EXCLUDED.payload,
        updated_at = NOW(),
        expires_at = EXCLUDED.expires_at
    `,
    [room.roomCode, room.gameId || "", JSON.stringify(serialized)]
  );

  return true;
}

async function persistToRedis(room) {
  if (!redisConnected || !redisClient || !room?.roomCode) return false;

  await redisClient.setEx(
    key(room.roomCode),
    TTL_SECONDS,
    JSON.stringify(serializeRoom(room))
  );

  return true;
}

async function persistRoom(room) {
  if (!room?.roomCode) return false;

  const results = await Promise.allSettled([
    persistToPostgres(room),
    persistToRedis(room),
  ]);

  if (results.every((result) => result.status === "rejected")) {
    console.error(
      JSON.stringify({
        event: "room_persistence_failed",
        roomCode: room.roomCode,
        errors: results.map((result) => result.reason?.message || "Unknown error"),
      })
    );
    return false;
  }

  return results.some(
    (result) => result.status === "fulfilled" && result.value === true
  );
}

async function deletePersistedRoom(roomCode) {
  if (!roomCode) return;

  await Promise.allSettled([
    dbConnected && dbPool
      ? dbPool.query("DELETE FROM alphabet_rush_rooms WHERE room_code = $1", [
          roomCode,
        ])
      : Promise.resolve(),
    redisConnected && redisClient
      ? redisClient.del(key(roomCode))
      : Promise.resolve(),
  ]);
}

async function closeRoomPersistence() {
  redisConnected = false;
  dbConnected = false;

  await Promise.allSettled([
    redisClient?.quit(),
    dbPool?.end(),
  ]);

  redisClient = null;
  dbPool = null;
}

function getPersistenceStatus() {
  return {
    postgres: dbConnected,
    redis: redisConnected,
    durable: dbConnected || redisConnected,
  };
}

module.exports = {
  initRoomPersistence,
  hydrateRooms,
  loadPersistedRoom,
  persistRoom,
  deletePersistedRoom,
  closeRoomPersistence,
  getPersistenceStatus,
  serializeRoom,
  restoreRoom,
};
