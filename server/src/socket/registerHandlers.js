const { createUniqueRoomCode } = require("../utils/roomCode");
const { getRoom, createRoom, deleteRoom, rooms } = require("../store/rooms");

const MAX_PLAYERS = 10;
const ALLOWED_ROUNDS = [5, 10, 15, 20];

function toPlayerSummary(player) {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
  };
}

function resetPlayerRound(player, resetScore = false) {
  if (resetScore) player.score = 0;
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

function registerSocketHandlers({ io, validateAnswer, startRound, endRound }) {
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("createRoom", ({ playerName, rounds }) => {
      const name = normalizeName(playerName);

      if (!name) {
        socket.emit("createError", "Please enter your name");
        return;
      }

      const roomCode = createUniqueRoomCode(rooms);
      const selectedRounds = ALLOWED_ROUNDS.includes(Number(rounds))
        ? Number(rounds)
        : 10;

      const room = createRoom(roomCode, {
        hostId: socket.id,
        rounds: selectedRounds,
        currentRound: 0,
        currentLetter: null,
        winnerId: null,
        winnerIds: [],
        winnerNames: [],
        roundEnded: true,
        roundExpired: false,
        pendingValidations: 0,
        roundTimer: null,
        players: [
          {
            id: socket.id,
            name,
            score: 0,
            roundPoints: 0,
            answers: {},
            validation: {},
            submittedAt: null,
            submitted: false,
            allCorrect: false,
          },
        ],
      });

      socket.join(roomCode);

      socket.emit("roomCreated", {
        roomCode,
        rounds: room.rounds,
        hostId: room.hostId,
        players: room.players.map(toPlayerSummary),
      });
    });

    socket.on("joinRoom", ({ roomCode, playerName }) => {
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

      const player = {
        id: socket.id,
        name,
        score: 0,
        roundPoints: 0,
        answers: {},
        validation: {},
        submittedAt: null,
        submitted: false,
        allCorrect: false,
      };

      room.players.push(player);
      socket.join(code);

      socket.emit("roomJoined", {
        roomCode: code,
        rounds: room.rounds,
        hostId: room.hostId,
        players: room.players.map(toPlayerSummary),
      });

      io.to(code).emit("roomUpdated", {
        roomCode: code,
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

    socket.on("submitAnswers", async ({ roomCode, answers, submittedAt }) => {
      const room = getRoom(roomCode);
      if (!room || room.roundEnded || room.roundExpired) return;

      const player = room.players.find((item) => item.id === socket.id);
      if (!player || player.submitted) return;

      const safeAnswers = normalizeAnswers(answers);
      const letter = room.currentLetter;

      player.submitted = true;
      player.answers = safeAnswers;
      player.submittedAt = submittedAt || Date.now();
      room.pendingValidations += 1;

      let validation;
      try {
        const [nameValid, placeValid, thingValid, animalValid, foodValid] =
          await Promise.all([
            validateAnswer(safeAnswers.name, "Name", letter),
            validateAnswer(safeAnswers.place, "Place", letter),
            validateAnswer(safeAnswers.thing, "Thing", letter),
            validateAnswer(safeAnswers.animal, "Animal", letter),
            validateAnswer(safeAnswers.food, "Food", letter),
          ]);

        validation = {
          name: nameValid,
          place: placeValid,
          thing: thingValid,
          animal: animalValid,
          food: foodValid,
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
        return;
      }

      currentPlayer.validation = validation;

      const values = Object.values(validation);
      currentPlayer.roundPoints = values.filter(Boolean).length;
      currentPlayer.allCorrect = currentPlayer.roundPoints === values.length;
      currentPlayer.score += currentPlayer.roundPoints;

      io.to(roomCode).emit("playerSubmitted", {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        roundPoints: currentPlayer.roundPoints,
        submittedCount: currentRoom.players.filter((item) => item.submitted).length,
        totalPlayers: currentRoom.players.length,
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
