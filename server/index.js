require("dotenv").config();

const { createApp } = require("./src/app");
const { logEvent, logError } = require("./src/utils/logger");
const { stopRoomCleanup } = require("./src/store/rooms");
const {
  initRoomPersistence,
  hydrateRooms,
  closeRoomPersistence,
} = require("./src/store/roomPersistence");

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  const { server, redisReady } = createApp();

  let persistenceEnabled = false;
  let restoredRooms = 0;

  try {
    persistenceEnabled = await initRoomPersistence();
    restoredRooms = persistenceEnabled ? await hydrateRooms() : 0;
  } catch (error) {
    logError("room_persistence_startup_error", error);
    await closeRoomPersistence();
    persistenceEnabled = false;
  }

  const redis = await redisReady;

  server.listen(PORT, () => {
    logEvent("server_started", {
      port: PORT,
      node: process.version,
      environment: process.env.NODE_ENV || "development",
      redisAdapter: redis.enabled,
      roomPersistence: persistenceEnabled,
      restoredRooms,
    });
  });

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    logEvent("server_shutdown_started", { signal });
    stopRoomCleanup();

    const forceTimer = setTimeout(() => {
      logEvent("server_shutdown_forced");
      process.exit(1);
    }, 10_000);

    forceTimer.unref?.();

    server.close(async (error) => {
      clearTimeout(forceTimer);

      await Promise.allSettled([
        redis.close(),
        closeRoomPersistence(),
      ]);

      if (error) {
        logError("server_shutdown_error", error);
        process.exit(1);
        return;
      }

      logEvent("server_shutdown_complete");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  logError("server_startup_error", error);
  process.exit(1);
});
