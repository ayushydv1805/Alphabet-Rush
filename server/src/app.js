require("dotenv").config();

const OpenAI = require("openai");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { createCorsOptions } = require("./config/cors");
const { rooms } = require("./store/rooms");
const { createAnswerValidator } = require("./services/answerValidator");
const { createGameEngine } = require("./game/gameEngine");
const { registerSocketHandlers } = require("./socket/registerHandlers");

function createApp() {
  const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("Alphabet Rush Server is running!");
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      validator: openai ? "ai" : "fallback",
      model: openai ? process.env.OPENAI_MODEL || "gpt-5.6-luna" : null,
    });
  });

  const server = http.createServer(app);
  const io = new Server(server, { cors: createCorsOptions() });

  const { startRound, endRound } = createGameEngine({ io, rooms });
  const { validateAnswers } = createAnswerValidator(openai);

  registerSocketHandlers({
    io,
    rooms,
    validateAnswers,
    startRound,
    endRound,
  });

  return { app, server, io };
}

module.exports = { createApp };
