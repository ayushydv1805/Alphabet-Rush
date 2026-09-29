require("dotenv").config();

const OpenAI = require("openai");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { createCorsOptions } = require("./config/cors");
const { rooms, getRoomStats } = require("./store/rooms");
const { createAnswerValidator } = require("./services/answerValidator");
const { createGameEngine } = require("./game/gameEngine");
const { registerSocketHandlers } = require("./socket/registerHandlers");
const { configureRedisAdapter } = require("./realtime/redisAdapter");
const { getPersistenceStatus } = require("./store/roomPersistence");
const { logEvent } = require("./utils/logger");
const { verifyIdentityToken } = require("./auth/identity");
const {
  getPlayerMatchHistory,
  getPlayerLifetimeStats,
  getMatchHistoryStatus,
} = require("./services/matchHistory");

function createApp() {
  const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
  const app = express();

  app.use(cors(createCorsOptions()));
  app.use(express.json({ limit: "32kb" }));

  app.get("/", (_req, res) => {
    res.send("Alphabet Rush Server is running!");
  });

  app.get("/health", (_req, res) => {
    const roomStats = getRoomStats();
    const aiConfigured = Boolean(openai);

    res.json({
      ok: true,
      release: "phase-7-match-history",
      status: aiConfigured ? "healthy" : "degraded",
      validator: aiConfigured ? "ai" : "fallback",
      model: aiConfigured
        ? process.env.OPENAI_MODEL || "gpt-5.6-luna"
        : null,
      persistence: getPersistenceStatus(),
      rooms: roomStats.rooms,
      players: roomStats.players,
      matchHistory: getMatchHistoryStatus(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  function authenticatePlayer(request, response) {
    const header = request.get("authorization") || "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7).trim()
      : request.get("x-player-token") || "";

    const verified = verifyIdentityToken(token);

    if (!verified?.playerId) {
      response.status(401).json({
        ok: false,
        error: "A valid player session is required.",
      });
      return null;
    }

    return verified.playerId;
  }

  app.get("/api/player/history", async (req, res) => {
    const playerId = authenticatePlayer(req, res);
    if (!playerId) return;

    try {
      const history = await getPlayerMatchHistory(
        playerId,
        req.query.limit
      );

      res.json({
        ok: true,
        history,
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "player_history_request_error",
          message: error.message,
        })
      );

      res.status(503).json({
        ok: false,
        error: "Match history is temporarily unavailable.",
      });
    }
  });

  app.get("/api/player/stats", async (req, res) => {
    const playerId = authenticatePlayer(req, res);
    if (!playerId) return;

    try {
      const stats = await getPlayerLifetimeStats(playerId);

      res.json({
        ok: true,
        stats,
      });
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "player_stats_request_error",
          message: error.message,
        })
      );

      res.status(503).json({
        ok: false,
        error: "Player analytics are temporarily unavailable.",
      });
    }
  });

  const server = http.createServer(app);
  const io = new Server(server, { cors: createCorsOptions() });

  const { startRound, endRound } = createGameEngine({ io });
  const redisReady = configureRedisAdapter(io).catch((error) => {
    console.error(
      JSON.stringify({
        event: "redis_adapter_start_error",
        message: error.message,
      })
    );

    return { enabled: false, close: async () => {} };
  });
  const { validateAnswers } = createAnswerValidator(openai);

  logEvent("app_initialized", {
    validator: openai ? "ai" : "fallback",
    model: openai ? process.env.OPENAI_MODEL || "gpt-5.6-luna" : null,
  });

  registerSocketHandlers({
    io,
    rooms,
    validateAnswers,
    startRound,
    endRound,
  });

  return { app, server, io, redisReady };
}

module.exports = { createApp };
