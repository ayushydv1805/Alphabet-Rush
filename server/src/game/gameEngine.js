const { getRoom } = require("../store/rooms");
const { getRandomLetter } = require("../utils/randomLetter");

const ROUND_TIME_LIMIT = 60_000;

function createGameEngine({ io }) {
  function getRoundWinners(room) {
    const maxRoundPoints = Math.max(
      0,
      ...room.players.map((player) => player.roundPoints || 0)
    );

    if (maxRoundPoints === 0) {
      return {
        winnerIds: [],
        winnerNames: [],
        maxRoundPoints: 0,
      };
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
      score: player.score,
      roundPoints: player.roundPoints || 0,
      submitted: player.submitted,
      answers: player.answers,
      validation: player.validation,
    };
  }

  function sendRoundResult(roomCode, endReason = "time-up") {
    const room = getRoom(roomCode);
    if (!room) return;

    const roundWinners = getRoundWinners(room);

    room.winnerIds = roundWinners.winnerIds;
    room.winnerNames = roundWinners.winnerNames;

    io.to(roomCode).emit("roundEnded", {
      roomCode,
      hostId: room.hostId,
      currentRound: room.currentRound,
      totalRounds: room.rounds,
      letter: room.currentLetter,
      endReason,
      winnerIds: room.winnerIds,
      winnerNames: room.winnerNames,
      winnerId: room.winnerIds[0] || null,
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

  function startRound(roomCode, roundNumber) {
    const room = getRoom(roomCode);
    if (!room) return;

    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    room.currentRound = roundNumber;
    room.currentLetter = getRandomLetter();
    room.winnerId = null;
    room.winnerIds = [];
    room.winnerNames = [];
    room.roundEnded = false;

    room.players.forEach((player) => {
      player.answers = {};
      player.validation = {};
      player.submittedAt = null;
      player.submitted = false;
      player.allCorrect = false;
      player.roundPoints = 0;
    });

    io.to(roomCode).emit("gameStarted", {
      roomCode,
      hostId: room.hostId,
      rounds: room.rounds,
      currentRound: room.currentRound,
      totalRounds: room.rounds,
      letter: room.currentLetter,
      timeLimit: ROUND_TIME_LIMIT / 1000,
    });

    room.roundTimer = setTimeout(() => {
      if (getRoom(roomCode)) {
        endRound(roomCode, "time-up");
      }
    }, ROUND_TIME_LIMIT);
  }

  return { startRound, endRound, sendRoundResult };
}

module.exports = { createGameEngine, ROUND_TIME_LIMIT };
