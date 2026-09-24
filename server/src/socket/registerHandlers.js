const crypto = require("node:crypto");
const { createUniqueRoomCode } = require("../utils/roomCode");
const { getRoom, createRoom, deleteRoom, rooms } = require("../store/rooms");

const MAX_PLAYERS = 10;
const ALLOWED_ROUNDS = [5, 10, 15, 20];
const DEFAULT_AVATAR = "⚡";
const DEFAULT_TITLE = "Rush Rookie";

function toPlayerSummary(player) {
  return {
    id: player.id,
    name: player.name,
    avatar: player.avatar || DEFAULT_AVATAR,
    title: player.title || DEFAULT_TITLE,
    score: player.score,
    currentStreak: player.currentStreak || 0,
    bestStreak: player.bestStreak || 0,
    perfectRounds: player.perfectRounds || 0,
  };
}

function resetPlayerRound(player, resetScore = false) {
  if (resetScore) {
    player.score = 0;
    player.currentStreak = 0;
    player.bestStreak = 0;
    player.perfectRounds = 0;
  }

  player.answers = {};
  player.validation = {};
  player.submittedAt = null;
  player.submitted = false;
  player.allCorrect = false;
  player.roundPoints = 0;
}

function normalizeName(value) {
  return typeof value === "string" ? value.trim().slice(0, 20) : "";
}

function normalizeCosmetic(value, fallback, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) || fallback : fallback;
}

function normalizeAnswers(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    name: typeof source.name === "string" ? source.name.trim().slice(0, 80) : "",
    place: typeof source.place === "string" ? source.place.trim().slice(0, 80) : "",
    thing: typeof source.thing === "string" ? source.thing.trim().slice(0, 80) : "",
    animal: typeof source.animal === "string" ? source.animal.trim().slice(0, 80) : "",
    food: typeof source.food === "string" ? source.food.trim().slice(0, 80) : "",
  };
}

function makePlayer(socket, name, profile) {
  return {
    id: socket.id,
    name,
    avatar: normalizeCosmetic(profile?.avatar, DEFAULT_AVATAR, 12),
    title: normalizeCosmetic(profile?.title, DEFAULT_TITLE, 28),
    score: 0,
    roundPoints: 0,
    currentStreak: 0,
    bestStreak: 0,
    perfectRounds: 0,
    answers: {},
    validation: {},
    submittedAt: null,
    submitted: false,
    allCorrect: false,
  };
}

function registerSocketHandlers({ io, validateAnswers, startRound, endRound }) {
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("createRoom", ({ playerName, rounds, profile }) => {
      const name = normalizeName(playerName);

      if (!name) {
        socket.emit("createError", "Please enter your name");
        return;
      }

      const roomCode = createUniqueRoomCode(rooms);
      const selectedRounds = ALLOWED_ROUNDS.includes(Number(rounds))
        ? Number(rounds)
        : 10;

      const player = makePlayer(socket, name, profile);

      const room = createRoom(roomCode, {
        gameId: crypto.randomUUID(),
        hostId: socket.id,
        rounds: selectedRounds,
        currentRound: 0,
        currentLetter: null,
        roundStartedAt: null,
        winnerId: null,
        winnerIds: [],
        winnerNames: [],
        roundEnded: true,
        roundExpired: false,
        pendingValidations: 0,
        roundTimer: null,
        players: [player],
      });

      socket.join(roomCode);

      socket.emit("roomCreated", {
        roomCode,
        gameId: room.gameId,
        rounds: room.rounds,
        hostId: room.hostId,
        players: room.players.map(toPlayerSummary),
      });
    });

    socket.on("joinRoom", ({ roomCode, playerName, profile }) => {
      const code =
        typeof roomCode === "string" ? roomCode.trim().toUpperCase() : "";
      const name = normalizeName(playerName);
      const room = getRoom(code);

      if (!room) {
        socket.emit("joinError", "Room not found");
        return;
      }

      if (!name) {
        socket.emit("joinError", "Please enter your name");
        return;
      }

      if (room.players.length >= MAX_PLAYERS) {
        socket.emit("joinError", "Room is full");
        return;
      }

      if (room.currentRound > 0) {
        socket.emit("joinError", "Game has already started");
        return;
      }

      const player = makePlayer(socket, name, profile);
      room.players.push(player);
      socket.join(code);

      socket.emit("roomJoined", {
        roomCode: code,
        gameId: room.gameId,
        rounds: room.rounds,
        hostId: room.hostId,
        players: room.players.map(toPlayerSummary),
      });

      io.to(code).emit("roomUpdated", {
        roomCode: code,
        gameId: room.gameId,
        rounds: room.rounds,
        hostId: room.hostId,
        players: room.players.map(toPlayerSummary),
      });
    });

    socket.on("startGame", ({ roomCode }) => {
      const room = getRoom(roomCode);

      if (!room || room.hostId !== socket.id || room.players.length < 1) return;
      if (room.currentRound > 0 && !room.roundEnded) return;

      startRound(roomCode, 1);
    });

    socket.on("submitAnswers", async ({ roomCode, answers }) => {
      const room = getRoom(roomCode);
      if (!room || room.roundEnded || room.roundExpired) return;

      const player = room.players.find((item) => item.id === socket.id);
      if (!player || player.submitted) return;

      const safeAnswers = normalizeAnswers(answers);
      const letter = room.currentLetter;

      player.submitted = true;
      player.answers = safeAnswers;
      player.submittedAt = Date.now();
      room.pendingValidations += 1;

      let validation;

      try {
        validation = await validateAnswers(safeAnswers, letter);
      } catch (error) {
        console.error("Unexpected answer validator error:", error.message);
        validation = {
          name: false,
          place: false,
          thing: false,
          animal: false,
          food: false,
        };
      } finally {
        room.pendingValidations = Math.max(0, room.pendingValidations - 1);
      }

      const currentRoom = getRoom(roomCode);
      if (!currentRoom) return;

      const currentPlayer = currentRoom.players.find(
        (item) => item.id === socket.id
      );

      if (!currentPlayer) {
        if (
          currentRoom.roundExpired &&
          currentRoom.pendingValidations === 0 &&
          !currentRoom.roundEnded
        ) {
          endRound(roomCode, "time-up");
        }
        return;
      }

      currentPlayer.validation = validation;

      const values = Object.values(validation);
      currentPlayer.roundPoints = values.filter(Boolean).length;
      currentPlayer.allCorrect =
        currentPlayer.roundPoints === 5;

      currentPlayer.score += currentPlayer.roundPoints;

      if (currentPlayer.roundPoints === 5) {
        currentPlayer.currentStreak += 1;
        currentPlayer.bestStreak = Math.max(
          currentPlayer.bestStreak,
          currentPlayer.currentStreak
        );
        currentPlayer.perfectRounds += 1;
      } else {
        currentPlayer.currentStreak = 0;
      }

      io.to(roomCode).emit("playerSubmitted", {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        roundPoints: currentPlayer.roundPoints,
        submittedCount: currentRoom.players.filter((item) => item.submitted).length,
        totalPlayers: currentRoom.players.length,
        currentStreak: currentPlayer.currentStreak,
      });

      const everyoneSubmitted =
        currentRoom.players.length > 0 &&
        currentRoom.players.every((item) => item.submitted);

      if (
        !currentRoom.roundEnded &&
        !currentRoom.roundExpired &&
        everyoneSubmitted &&
        currentRoom.pendingValidations === 0
      ) {
        endRound(roomCode, "all-submitted");
      } else if (
        !currentRoom.roundEnded &&
        currentRoom.roundExpired &&
        currentRoom.pendingValidations === 0
      ) {
        endRound(roomCode, "time-up");
      }
    });

    socket.on("nextRound", ({ roomCode }) => {
      const room = getRoom(roomCode);

      if (!room || room.hostId !== socket.id || !room.roundEnded) return;

      if (room.currentRound >= room.rounds) {
        const players = [...room.players].sort((a, b) => b.score - a.score);
        const maxScore = players.length ? players[0].score : 0;
        const winners = players.filter((player) => player.score === maxScore);

        io.to(roomCode).emit("gameOver", {
          roomCode,
          gameId: room.gameId,
          hostId: room.hostId,
          totalRounds: room.rounds,
          winnerIds: winners.map((player) => player.id),
          winnerNames: winners.map((player) => player.name),
          winnerId: winners[0]?.id || null,
          winnerName: winners[0]?.name || "No winner",
          winningScore: maxScore,
          players: players.map(toPlayerSummary),
        });

        return;
      }

      startRound(roomCode, room.currentRound + 1);
    });

    socket.on("rematch", ({ roomCode }) => {
      const room = getRoom(roomCode);

      if (!room || room.hostId !== socket.id || !room.roundEnded) return;

      room.currentRound = 0;
      room.gameId = crypto.randomUUID();
      room.winnerId = null;
      room.winnerIds = [];
      room.winnerNames = [];
      room.roundEnded = true;
      room.roundExpired = false;
      room.pendingValidations = 0;

      room.players.forEach((player) => resetPlayerRound(player, true));
      startRound(roomCode, 1);
    });

    socket.on("disconnect", () => {
      for (const roomCode in rooms) {
        const room = rooms[roomCode];
        const wasPlayer = room.players.some((player) => player.id === socket.id);
        if (!wasPlayer) continue;

        room.players = room.players.filter((player) => player.id !== socket.id);

        if (!room.players.length) {
          if (room.roundTimer) clearTimeout(room.roundTimer);
          deleteRoom(roomCode);
          continue;
        }

        if (room.hostId === socket.id) {
          room.hostId = room.players[0].id;
        }

        io.to(roomCode).emit("roomUpdated", {
          roomCode,
          gameId: room.gameId,
          rounds: room.rounds,
          hostId: room.hostId,
          players: room.players.map(toPlayerSummary),
        });

        const everyoneSubmitted =
          room.currentRound > 0 &&
          !room.roundEnded &&
          !room.roundExpired &&
          room.players.every((player) => player.submitted);

        if (everyoneSubmitted && room.pendingValidations === 0) {
          endRound(roomCode, "all-submitted");
        }
      }
    });
  });
}

module.exports = { registerSocketHandlers, toPlayerSummary };
