const { getRoom } = require("../store/rooms");
const { getRandomLetter } = require("../utils/randomLetter");

function createGameEngine({ io }) {
  function sendRoundResult(roomCode) {
    const room = getRoom(roomCode);
    if (!room) return;

    const winner = room.players.find((player) => player.id === room.winnerId);

    io.to(roomCode).emit("roundEnded", {
      roomCode,
      currentRound: room.currentRound,
      totalRounds: room.rounds,
      winnerId: room.winnerId,
      winnerName: winner?.name || "No winner",
      letter: room.currentLetter,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
      })),
    });
  }

  function endRound(roomCode) {
    const room = getRoom(roomCode);
    if (!room || room.roundEnded) return;

    room.roundEnded = true;

    if (room.roundTimer) {
      clearTimeout(room.roundTimer);
      room.roundTimer = null;
    }

    console.log("Round " + room.currentRound + " ended in room " + roomCode);
    sendRoundResult(roomCode);
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
    room.roundEnded = false;

    room.players.forEach((player) => {
      player.answers = {};
      player.validation = {};
      player.submittedAt = null;
      player.submitted = false;
      player.allCorrect = false;
    });

    console.log(
      "Round " + room.currentRound +
      " started in room " + roomCode +
      " with letter " + room.currentLetter
    );

    io.to(roomCode).emit("gameStarted", {
      roomCode,
      rounds: room.rounds,
      currentRound: room.currentRound,
      totalRounds: room.rounds,
      letter: room.currentLetter,
      timeLimit: 60,
    });

    room.roundTimer = setTimeout(() => {
      if (getRoom(roomCode)) {
        endRound(roomCode);
      }
    }, 60000);
  }

  return { startRound, endRound, sendRoundResult };
}

module.exports = { createGameEngine };
