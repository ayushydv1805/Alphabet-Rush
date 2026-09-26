const crypto = require("node:crypto");
const { createUniqueRoomCode } = require("../utils/roomCode");
const { getRoom, createRoom, deleteRoom, rooms } = require("../store/rooms");
const { getGameModeConfig } = require("../game/gameModes");
const {
  normalizeRoomCode,
  isValidRoomCode,
  normalizeName,
  normalizeCosmetic,
  normalizeGameMode,
  normalizeAnswers,
  isValidAnswerPayload,
} = require("../utils/payload");
const { createRateLimiter } = require("../utils/rateLimiter");
const { logEvent, logError } = require("../utils/logger");
const { createIdentityToken, verifyIdentityToken } = require("../auth/identity");
const { persistRoom, deletePersistedRoom } = require("../store/roomPersistence");

const MAX_PLAYERS = 10;
const ALLOWED_ROUNDS = [5, 10, 15, 20];
const DEFAULT_AVATAR = "⚡";
const DEFAULT_TITLE = "Rush Rookie";
const actionLimiter = createRateLimiter({ windowMs: 3000, max: 8 });
const submissionLimiter = createRateLimiter({ windowMs: 2500, max: 2 });

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

function makePlayer(socket, name, profile, playerId) {
  const safeProfile =
    profile && typeof profile === "object" && !Array.isArray(profile)
      ? profile
      : {};

  return {
    id: socket.id,
    playerId,
    name,
    avatar: normalizeCosmetic(safeProfile.avatar, DEFAULT_AVATAR),
    title: normalizeCosmetic(safeProfile.title, DEFAULT_TITLE),
    score: 0,
    roundPoints: 0,
    correctCount: 0,
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
    logEvent("socket_connected", { socketId: socket.id });

    socket.on("createRoom", (payload) => {
      if (!actionLimiter.isAllowed(socket.id + ":create")) {
        socket.emit("createError", "Too many requests. Please wait a moment.");
        return;
      }

      const { playerName, rounds, gameMode, profile, identityToken } = payload || {};
      const name = normalizeName(playerName);

      if (!name) {
        socket.emit("createError", "Please enter your name");
        return;
      }

      const roomCode = createUniqueRoomCode(rooms);
      const selectedRounds = ALLOWED_ROUNDS.includes(Number(rounds))
        ? Number(rounds)
        : 10;
      const selectedMode = normalizeGameMode(gameMode);

      const verifiedIdentity = verifyIdentityToken(identityToken);
      const playerId = verifiedIdentity?.playerId || crypto.randomUUID();
      const player = makePlayer(socket, name, profile, playerId);
      const freshIdentityToken = createIdentityToken(playerId);

      const room = createRoom(roomCode, {
        gameId: crypto.randomUUID(),
        hostId: socket.id,
        rounds: selectedRounds,
        gameMode: selectedMode,
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
      persistRoom(room);

      logEvent("room_created", { roomCode, playerId: socket.id, rounds: room.rounds, gameMode: room.gameMode });
      socket.emit("roomCreated", {
        roomCode,
        gameId: room.gameId,
        identityToken: freshIdentityToken,
        playerId: player.playerId,
        playerName: player.name,
        avatar: player.avatar,
        title: player.title,
        rounds: room.rounds,
        gameMode: room.gameMode,
        hostId: room.hostId,
        players: room.players.map(toPlayerSummary),
      });
    });

    socket.on("joinRoom", (payload) => {
      if (!actionLimiter.isAllowed(socket.id + ":join")) {
        socket.emit("joinError", "Too many requests. Please wait a moment.");
        return;
      }

      const { roomCode, playerName, profile, identityToken } = payload || {};
      const code = normalizeRoomCode(roomCode);
      const name = normalizeName(playerName);
      const room = getRoom(code);

      if (!isValidRoomCode(code)) {
        socket.emit("joinError", "Room code must be exactly 6 characters.");
        return;
      }

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

      const verifiedIdentity = verifyIdentityToken(identityToken);
      const playerId = verifiedIdentity?.playerId || crypto.randomUUID();
      const existingPlayer = room.players.find(
        (item) => item.playerId === playerId
      );

      if (existingPlayer) {
        existingPlayer.id = socket.id;
        existingPlayer.name = name;
        existingPlayer.avatar = normalizeCosmetic(
          profile?.avatar,
          existingPlayer.avatar || DEFAULT_AVATAR
        );
        existingPlayer.title = normalizeCosmetic(
          profile?.title,
          existingPlayer.title || DEFAULT_TITLE
        );

        socket.join(code);
        persistRoom(room);

        socket.emit("roomJoined", {
          roomCode: code,
          gameId: room.gameId,
          identityToken: createIdentityToken(playerId),
          playerId,
          playerName: existingPlayer.name,
          avatar: existingPlayer.avatar,
          title: existingPlayer.title,
          rounds: room.rounds,
          gameMode: room.gameMode,
          hostId: room.hostId,
          players: room.players.map(toPlayerSummary),
        });
        return;
      }

      const freshIdentityToken = createIdentityToken(playerId);
      const player = makePlayer(socket, name, profile, playerId);
      room.players.push(player);
      socket.join(code);
      persistRoom(room);

      logEvent("room_joined", { roomCode: code, playerId: socket.id, players: room.players.length });
      socket.emit("roomJoined", {
        roomCode: code,
        gameId: room.gameId,
        identityToken: freshIdentityToken,
        playerId: player.playerId,
        playerName: player.name,
        avatar: player.avatar,
        title: player.title,
        rounds: room.rounds,
        hostId: room.hostId,
        players: room.players.map(toPlayerSummary),
      });

      io.to(code).emit("roomUpdated", {
        roomCode: code,
        gameId: room.gameId,
        rounds: room.rounds,
        gameMode: room.gameMode,
        hostId: room.hostId,
        players: room.players.map(toPlayerSummary),
      });
    });

    socket.on("resumeRoom", (payload = {}) => {
      const { roomCode, identityToken } = payload;
      const code = normalizeRoomCode(roomCode);
      const verified = verifyIdentityToken(identityToken);

      if (!isValidRoomCode(code) || !verified?.playerId) {
        socket.emit("actionError", "Your player session could not be restored.");
        return;
      }

      const room = getRoom(code);
      if (!room) {
        socket.emit("actionError", "That room is no longer available.");
        return;
      }

      const player = room.players.find(
        (item) => item.playerId === verified.playerId
      );

      if (!player) {
        socket.emit("actionError", "Your player session is not part of this room.");
        return;
      }

      player.id = socket.id;
      socket.join(code);
      persistRoom(room);

      if (room.currentRound === 0) {
        socket.emit("roomResumed", {
          status: "waiting",
          roomCode: code,
          gameId: room.gameId,
          identityToken: createIdentityToken(player.playerId),
          playerId: player.playerId,
          playerName: player.name,
          avatar: player.avatar,
          title: player.title,
          rounds: room.rounds,
          gameMode: room.gameMode,
          hostId: room.hostId,
          players: room.players.map(toPlayerSummary),
        });
        return;
      }

      const mode = getGameModeConfig(room.gameMode);
      const base = {
        roomCode: code,
        gameId: room.gameId,
        hostId: room.hostId,
        currentRound: room.currentRound,
        totalRounds: room.rounds,
        totalPlayers: room.players.length,
        gameMode: room.gameMode,
        roundId: room.roundId,
        modeName: mode.name,
        modeIcon: mode.icon,
        scoreMultiplier: mode.scoreMultiplier,
        letter: room.currentLetter,
        roundStartedAt: room.roundStartedAt,
        timeLimit: mode.timeLimit / 1000,
        playerId: player.playerId,
        playerName: player.name,
        avatar: player.avatar,
        title: player.title,
        players: room.players.map((item) => ({
          id: item.id,
          playerId: item.playerId,
          name: item.name,
          avatar: item.avatar,
          title: item.title,
          score: item.score,
          roundPoints: item.roundPoints || 0,
          correctCount: item.correctCount || 0,
          currentStreak: item.currentStreak || 0,
          bestStreak: item.bestStreak || 0,
          perfectRounds: item.perfectRounds || 0,
          submitted: item.submitted,
          submittedAt: item.submittedAt,
          answers: item.answers,
          validation: item.validation,
        })),
      };

      if (!room.roundEnded && !room.roundExpired) {
        socket.emit("roomResumed", { status: "active", ...base });
        return;
      }

      if (room.currentRound >= room.rounds) {
        const ranked = [...room.players].sort((a, b) => b.score - a.score);
        const maxScore = ranked.length ? ranked[0].score : 0;
        const winners = ranked.filter((item) => item.score === maxScore);

        socket.emit("roomResumed", {
          status: "finished",
          roomCode: code,
          gameId: room.gameId,
          hostId: room.hostId,
          totalRounds: room.rounds,
          winnerIds: winners.map((item) => item.id),
          winnerNames: winners.map((item) => item.name),
          winnerId: winners[0]?.id || null,
          winnerName: winners[0]?.name || "No winner",
          winningScore: maxScore,
          gameMode: room.gameMode,
          players: ranked.map(toPlayerSummary),
        });
        return;
      }

      const maxRoundPoints = Math.max(
        0,
        ...room.players.map((item) => item.roundPoints || 0)
      );
      const winners = room.players.filter(
        (item) => (item.roundPoints || 0) === maxRoundPoints && maxRoundPoints > 0
      );

      socket.emit("roomResumed", {
        status: "result",
        ...base,
        endReason: room.roundExpired ? "time-up" : "all-submitted",
        winnerIds: winners.map((item) => item.id),
        winnerNames: winners.map((item) => item.name),
        winnerId: winners[0]?.id || null,
        winnerName: winners[0]?.name || "No scored winner",
        winningRoundPoints: maxRoundPoints,
      });
    });

    socket.on("startGame", ({ roomCode } = {}) => {
      if (!actionLimiter.isAllowed(socket.id + ":start")) return;

      const code = normalizeRoomCode(roomCode);
      const room = getRoom(code);

      if (!room) {
        socket.emit("actionError", "Room not found.");
        return;
      }

      if (room.hostId !== socket.id) {
        socket.emit("actionError", "Only the host can start the game.");
        return;
      }

      if (room.currentRound > 0 && !room.roundEnded) return;
      startRound(code, 1);
      persistRoom(getRoom(code));
      persistRoom(getRoom(code));
    });

    socket.on("submitAnswers", async (payload) => {
      if (!submissionLimiter.isAllowed(socket.id + ":submit")) {
        socket.emit("actionError", "Submission rate limit reached. Please wait.");
        return;
      }

      const { roomCode, answers, roundId } = payload || {};
      const code = normalizeRoomCode(roomCode);
      const room = getRoom(code);
      if (!room || room.roundEnded || room.roundExpired) return;

      if (!roundId || roundId !== room.roundId) {
        socket.emit("actionError", "This round is no longer active. Please use the current round.");
        return;
      }

      if (!isValidAnswerPayload(answers)) {
        socket.emit("actionError", "Invalid answer payload.");
        return;
      }

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
        logError("answer_validation_error", error, { roomCode: code, playerId: socket.id });
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

      const currentRoom = getRoom(code);
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
        persistRoom(currentRoom);
        }
        return;
      }

      currentPlayer.validation = validation;

      const values = Object.values(validation);
      const correctCount = values.filter(Boolean).length;
      const mode = getGameModeConfig(currentRoom.gameMode);
      currentPlayer.correctCount = correctCount;
      currentPlayer.roundPoints = correctCount * mode.scoreMultiplier;
      currentPlayer.allCorrect = correctCount === 5;

      currentPlayer.score += currentPlayer.roundPoints;
      persistRoom(currentRoom);

      if (correctCount === 5) {
        currentPlayer.currentStreak += 1;
        currentPlayer.bestStreak = Math.max(
          currentPlayer.bestStreak,
          currentPlayer.currentStreak
        );
        currentPlayer.perfectRounds += 1;
      } else {
        currentPlayer.currentStreak = 0;
      }

      logEvent("answer_validation_completed", { roomCode: code, playerId: currentPlayer.id, roundId: currentRoom.roundId, correctCount, points: currentPlayer.roundPoints });
      socket.emit("submissionValidated", {
        roundId: currentRoom.roundId,
        validation,
        correctCount,
        roundPoints: currentPlayer.roundPoints,
        currentStreak: currentPlayer.currentStreak,
      });

      io.to(code).emit("playerSubmitted", {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        roundPoints: currentPlayer.roundPoints,
        correctCount,
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
        persistRoom(currentRoom);
      } else if (
        !currentRoom.roundEnded &&
        currentRoom.roundExpired &&
        currentRoom.pendingValidations === 0
      ) {
        endRound(roomCode, "time-up");
      }
    });

    socket.on("nextRound", ({ roomCode, roundId, gameId } = {}) => {
      const code = normalizeRoomCode(roomCode);
      const room = getRoom(code);

      if (!room) {
        socket.emit("actionError", "Room not found.");
        return;
      }

      if (room.hostId !== socket.id) {
        socket.emit("actionError", "Only the host can advance the round.");
        return;
      }

      if (!room.roundEnded) return;

      if (!roundId || !room.roundId || roundId !== room.roundId) {
        socket.emit("actionError", "This result screen is outdated.");
        return;
      }

      if (!gameId || gameId !== room.gameId) {
        socket.emit("actionError", "This game session is outdated.");
        return;
      }

      if (room.currentRound >= room.rounds) {
        const players = [...room.players].sort((a, b) => b.score - a.score);
        const maxScore = players.length ? players[0].score : 0;
        const winners = players.filter((player) => player.score === maxScore);

        io.to(code).emit("gameOver", {
          roomCode,
          gameId: room.gameId,
          hostId: room.hostId,
          totalRounds: room.rounds,
          winnerIds: winners.map((player) => player.id),
          winnerNames: winners.map((player) => player.name),
          winnerId: winners[0]?.id || null,
          winnerName: winners[0]?.name || "No winner",
          winningScore: maxScore,
          gameMode: room.gameMode,
          players: players.map(toPlayerSummary),
        });

        return;
      }

      startRound(code, room.currentRound + 1);
      persistRoom(getRoom(code));
    });

    socket.on("rematch", ({ roomCode, gameId } = {}) => {
      const code = normalizeRoomCode(roomCode);
      const room = getRoom(code);

      if (!room) {
        socket.emit("actionError", "Room not found.");
        return;
      }

      if (room.hostId !== socket.id) {
        socket.emit("actionError", "Only the host can start a rematch.");
        return;
      }

      if (!room.roundEnded) return;

      if (gameId && gameId !== room.gameId) {
        socket.emit("actionError", "This game session is outdated.");
        return;
      }

      room.currentRound = 0;
      room.gameId = crypto.randomUUID();
      room.winnerId = null;
      room.winnerIds = [];
      room.winnerNames = [];
      room.roundEnded = true;
      room.roundExpired = false;
      room.pendingValidations = 0;

      room.players.forEach((player) => resetPlayerRound(player, true));
      startRound(code, 1);
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
          deletePersistedRoom(roomCode);
          continue;
        }

        logEvent("socket_player_disconnected", { roomCode, playerId: socket.id, remainingPlayers: room.players.length });
        persistRoom(room);

        if (room.hostId === socket.id) {
          room.hostId = room.players[0].id;
        }

        io.to(roomCode).emit("roomUpdated", {
          roomCode,
          gameId: room.gameId,
          rounds: room.rounds,
          gameMode: room.gameMode,
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
