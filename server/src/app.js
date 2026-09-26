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
const { logEvent } = require("./utils/logger");

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
      status: aiConfigured ? "healthy" : "degraded",
      validator: aiConfigured ? "ai" : "fallback",
      model: aiConfigured
        ? process.env.OPENAI_MODEL || "gpt-5.6-luna"
        : null,
      rooms: roomStats.rooms,
      players: roomStats.players,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
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
