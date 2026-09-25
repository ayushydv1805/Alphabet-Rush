const { getRoom } = require("../store/rooms");
const { getGameModeConfig, getRoundLetter } = require("./gameModes");

const ROUND_TIME_LIMIT = 60_000;

function createGameEngine({ io }) {
  function getRoundWinners(room) {
    const maxRoundPoints = Math.max(
      0,
      ...room.players.map((player) => player.roundPoints || 0)
    );

    if (maxRoundPoints === 0) {
      return { winnerIds: [], winnerNames: [], maxRoundPoints: 0 };
    }

    const winners = room.players.filter(
      (player) => (player.roundPoints || 0) === maxRoundPoints
    );

    return {
      winnerIds: winners.map((player) => player.id),
      winnerNames: winners.map((player) => player.name),
      maxRoundPoints,
    };
  }

  function toRoundPlayer(player) {
    return {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      title: player.title,
      score: player.score,
      roundPoints: player.roundPoints || 0,
      correctCount: player.correctCount || 0,
      currentStreak: player.currentStreak || 0,
      bestStreak: player.bestStreak || 0,
      perfectRounds: player.perfectRounds || 0,
      submitted: player.submitted,
      submittedAt: player.submittedAt,
      answers: player.answers,
      validation: player.validation,
    };
  }

  function toFinalPlayer(player) {
    return {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      title: player.title,
      score: player.score,
      currentStreak: player.currentStreak || 0,
      bestStreak: player.bestStreak || 0,
      perfectRounds: player.perfectRounds || 0,
    };
  }

  function sendRoundResult(roomCode, endReason = "time-up") {
    const room = getRoom(roomCode);
    if (!room) return;

    const roundWinners = getRoundWinners(room);

    room.winnerIds = roundWinners.winnerIds;
    room.winnerNames = roundWinners.winnerNames;
    room.winnerId = room.winnerIds[0] || null;
    const mode = getGameModeConfig(room.gameMode);

    io.to(roomCode).emit("roundEnded", {
      roomCode,
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
      gameMode: room.gameMode,
      roundMode: getGameModeConfig(room.gameMode),
      roundStartedAt: room.roundStartedAt,
      endReason,
      winnerIds: room.winnerIds,
      winnerNames: room.winnerNames,
      winnerId: room.winnerId,
      winnerName: room.winnerNames[0] || "No scored winner",
      winningRoundPoints: roundWinners.maxRoundPoints,
      players: room.players.map(toRoundPlayer),
    });
  }

  function endRound(roomCode, endReason = "time-up") {
    const room = getRoom(roomCode);
    if (!room || room.roundEnded) return;

    room.roundEnded = true;

    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    sendRoundResult(roomCode, endReason);

    console.log(
      "Round " +
        room.currentRound +
        " ended in room " +
        roomCode +
        " (" +
        endReason +
        ")"
    );
  }

  function markRoundExpired(roomCode) {
    const room = getRoom(roomCode);
    if (!room || room.roundEnded) return;

    room.roundExpired = true;
    room.roundTimer = null;

    if (room.pendingValidations === 0) {
      endRound(roomCode, "time-up");
    }
  }

  function startRound(roomCode, roundNumber) {
    const room = getRoom(roomCode);
    if (!room) return;

    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    room.currentRound = roundNumber;
    const mode = getGameModeConfig(room.gameMode);
    room.roundId = require("node:crypto").randomUUID();
    room.currentLetter = getRoundLetter(room.gameMode);
    room.roundStartedAt = Date.now();
    room.winnerId = null;
    room.winnerIds = [];
    room.winnerNames = [];
    room.roundEnded = false;
    room.roundExpired = false;
    room.pendingValidations = 0;

    room.players.forEach((player) => {
      player.answers = {};
      player.validation = {};
      player.submittedAt = null;
      player.submitted = false;
      player.allCorrect = false;
      player.roundPoints = 0;
      player.correctCount = 0;
    });

    io.to(roomCode).emit("gameStarted", {
      roomCode,
      gameId: room.gameId,
      hostId: room.hostId,
      rounds: room.rounds,
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
    });

    room.roundTimer = setTimeout(() => {
      if (getRoom(roomCode)) {
        markRoundExpired(roomCode);
      }
    }, mode.timeLimit);
  }

  return {
    startRound,
    endRound,
    markRoundExpired,
    sendRoundResult,
  };
}

module.exports = { createGameEngine, ROUND_TIME_LIMIT };
