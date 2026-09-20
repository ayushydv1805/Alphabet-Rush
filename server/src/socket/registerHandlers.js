const { createUniqueRoomCode } = require("../utils/roomCode");
const { getRoom, createRoom, deleteRoom } = require("../store/rooms");

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
}

function registerSocketHandlers({ io, validateAnswer, startRound, endRound }) {
  io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("createRoom", ({ playerName, rounds }) => {
      const roomCode = createUniqueRoomCode(require("../store/rooms").rooms);

      const room = createRoom(roomCode, {
        hostId: socket.id,
        rounds: Number(rounds) || 10,
        currentRound: 0,
        currentLetter: null,
        winnerId: null,
        roundEnded: true,
        roundTimer: null,
        players: [{
          id: socket.id,
          name: playerName.trim(),
          score: 0,
          answers: {},
          validation: {},
          submittedAt: null,
          submitted: false,
          allCorrect: false,
        }],
      });

      socket.join(roomCode);
      console.log("Room created: " + roomCode);

      socket.emit("roomCreated", {
        roomCode,
        rounds: room.rounds,
        players: room.players.map(toPlayerSummary),
      });
    });

    socket.on("joinRoom", ({ roomCode, playerName }) => {
      const room = getRoom(roomCode);

      if (!room) {
        socket.emit("joinError", "Room not found");
        return;
      }

      if (room.players.length >= 10) {
        socket.emit("joinError", "Room is full");
        return;
      }

      if (room.currentRound > 0) {
        socket.emit("joinError", "Game has already started");
        return;
      }

      const player = {
        id: socket.id,
        name: playerName.trim(),
        score: 0,
        answers: {},
        validation: {},
        submittedAt: null,
        submitted: false,
        allCorrect: false,
      };

      room.players.push(player);
      socket.join(roomCode);

      console.log(player.name + " joined room " + roomCode);

      socket.emit("roomJoined", {
        roomCode,
        rounds: room.rounds,
        players: room.players.map(toPlayerSummary),
      });

      io.to(roomCode).emit("roomUpdated", {
        roomCode,
        rounds: room.rounds,
        players: room.players.map(toPlayerSummary),
      });
    });

    socket.on("startGame", ({ roomCode }) => {
      const room = getRoom(roomCode);
      if (!room || room.hostId !== socket.id || room.players.length < 1) return;
      startRound(roomCode, 1);
    });

    socket.on("submitAnswers", async ({ roomCode, answers, submittedAt }) => {
      const room = getRoom(roomCode);
      if (!room || room.roundEnded) return;

      const player = room.players.find((item) => item.id === socket.id);
      if (!player || player.submitted) return;

      player.submitted = true;
      const letter = room.currentLetter;

      const [nameValid, placeValid, thingValid, animalValid, foodValid] =
        await Promise.all([
          validateAnswer(answers.name, "Name", letter),
          validateAnswer(answers.place, "Place", letter),
          validateAnswer(answers.thing, "Thing", letter),
          validateAnswer(answers.animal, "Animal", letter),
          validateAnswer(answers.food, "Food", letter),
        ]);

      if (room.roundEnded) return;

      const validation = {
        name: nameValid,
        place: placeValid,
        thing: thingValid,
        animal: animalValid,
        food: foodValid,
      };

      const allCorrect = Object.values(validation).every(Boolean);
      const correctCount = Object.values(validation).filter(Boolean).length;

      player.answers = answers;
      player.validation = validation;
      player.submittedAt = submittedAt || Date.now();
      player.allCorrect = allCorrect;

      console.log("Current Letter:", letter);
      console.log("Validation:", validation);
      console.log("All Correct:", allCorrect);

      if (allCorrect && !room.winnerId) {
        room.winnerId = player.id;
        player.score += correctCount;
        console.log(player.name + " won round " + room.currentRound + " in room " + roomCode);
        endRound(roomCode);
        return;
      }

      if (!allCorrect) {
        player.score += correctCount;

        socket.emit("roundEnded", {
          roomCode,
          currentRound: room.currentRound,
          totalRounds: room.rounds,
          winnerId: room.winnerId,
          winnerName:
            room.players.find((item) => item.id === room.winnerId)?.name ||
            "No winner",
          letter,
          players: room.players.map(toPlayerSummary),
        });
      }

      io.to(roomCode).emit("playerSubmitted", {
        playerId: player.id,
        playerName: player.name,
      });
    });

    socket.on("nextRound", ({ roomCode }) => {
      const room = getRoom(roomCode);
      if (!room || room.hostId !== socket.id) return;

      if (room.currentRound >= room.rounds) {
        io.to(roomCode).emit("gameOver", {
          roomCode,
          players: room.players.map(toPlayerSummary),
        });
        return;
      }

      startRound(roomCode, room.currentRound + 1);
    });

    socket.on("rematch", ({ roomCode }) => {
      const room = getRoom(roomCode);
      if (!room) return;

      console.log("REMATCH RECEIVED:", roomCode);

      room.currentRound = 0;
      room.winnerId = null;
      room.roundEnded = false;

      room.players.forEach((player) => resetPlayerRound(player, true));
      startRound(roomCode, 1);
    });

    socket.on("disconnect", () => {
      console.log("Player disconnected:", socket.id);

      const store = require("../store/rooms");
      for (const roomCode in store.rooms) {
        const room = store.rooms[roomCode];
        const wasPlayer = room.players.some((player) => player.id === socket.id);
        if (!wasPlayer) continue;

        room.players = room.players.filter((player) => player.id !== socket.id);

        if (room.players.length === 0) {
          if (room.roundTimer) clearTimeout(room.roundTimer);
          deleteRoom(roomCode);
          console.log("Room deleted: " + roomCode);
          continue;
        }

        if (room.hostId === socket.id) {
          room.hostId = room.players[0].id;
          console.log("New host for " + roomCode + ": " + room.players[0].name);
        }

        io.to(roomCode).emit("roomUpdated", {
          roomCode,
          rounds: room.rounds,
          players: room.players.map(toPlayerSummary),
        });
      }
    });
  });
}

module.exports = { registerSocketHandlers };
