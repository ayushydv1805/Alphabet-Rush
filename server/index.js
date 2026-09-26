require("dotenv").config();

const { createApp } = require("./src/app");
const { logEvent, logError } = require("./src/utils/logger");
const { stopRoomCleanup } = require("./src/store/rooms");

const PORT = Number(process.env.PORT) || 5000;
const { server } = createApp();

server.listen(PORT, () => {
  logEvent("server_started", {
    port: PORT,
    node: process.version,
    environment: process.env.NODE_ENV || "development",
  });
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logEvent("server_shutdown_started", { signal });
  stopRoomCleanup();

  const forceTimer = setTimeout(() => {
    logEvent("server_shutdown_forced");
    process.exit(1);
  }, 10_000);

  forceTimer.unref?.();

  server.close((error) => {
    clearTimeout(forceTimer);

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
