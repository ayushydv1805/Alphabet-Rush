require("dotenv").config();

const OpenAI = require("openai");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5175"],
    methods: ["GET", "POST"],
  },
});

// =========================
// ACTIVE ROOMS
// =========================

const rooms = {};

// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {
  res.send("Alphabet Rush Server is running!");
});

// =========================
// ROOM CODE
// =========================

function generateRoomCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return code;
}

// =========================
// RANDOM LETTER
// =========================

function getRandomLetter() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return letters[
    Math.floor(Math.random() * letters.length)
  ];
}

// =========================
// AI ANSWER VALIDATION
// =========================

async function validateAnswer(answer, category, letter) {
  // Empty answer = automatically wrong
  if (!answer || !answer.trim()) {
    return false;
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      input: `You are validating a word game answer.

Category: ${category}
Required starting letter: ${letter}
Answer: ${answer.trim()}

Return ONLY one number:

1 = The answer is a genuine and commonly understandable example of the category AND starts with the required letter.

0 = The answer is not a genuine example of the category OR does not start with the required letter.

Examples:

Animal + A + Ant = 1
Animal + A + Apple = 0
Food + A + Apple = 1
Place + A + Agra = 1
Food + A + Agra = 0
Name + A + Amit = 1
Thing + A + Apple = 1
Thing + A + Ant = 0`
    });

    const result = response.output_text.trim();

    return result === "1";
  } catch (error) {
    console.error(
      `AI validation error for ${category}:`,
      error.message
    );

    return false;
  }
}

// =========================
// SEND ROUND RESULT
// =========================

function sendRoundResult(roomCode) {
  const room = rooms[roomCode];

  if (!room) {
    return;
  }

  const winner = room.players.find(
    (player) => player.id === room.winnerId
  );

  io.to(roomCode).emit("roundEnded", {
    roomCode: roomCode,
    currentRound: room.currentRound,
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

// =========================
// END CURRENT ROUND
// =========================

function endRound(roomCode) {
  const room = rooms[roomCode];

  if (!room) {
    return;
  }

  // Prevent the same round from ending multiple times
  if (room.roundEnded) {
    return;
  }

  room.roundEnded = true;

  // Clear active timer
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }

  console.log(
    `Round ${room.currentRound} ended in room ${roomCode}`
  );

  sendRoundResult(roomCode);
}

// =========================
// START A ROUND
// =========================

function startRound(roomCode, roundNumber) {
  const room = rooms[roomCode];

  if (!room) {
    return;
  }

  // Clear previous timer
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }

  room.currentRound = roundNumber;
  room.currentLetter = getRandomLetter();
  room.winnerId = null;
  room.roundEnded = false;

  // Reset every player's round data
  room.players.forEach((player) => {
    player.answers = {};
    player.validation = {};
    player.submittedAt = null;
    player.submitted = false;
    player.allCorrect = false;
  });

  console.log(
    `Round ${room.currentRound} started in room ${roomCode} with letter ${room.currentLetter}`
  );

  // Send game data to everyone
  io.to(roomCode).emit("gameStarted", {
    roomCode: roomCode,
    rounds: room.rounds,
    currentRound: room.currentRound,
    totalRounds: room.rounds,
    letter: room.currentLetter,
    timeLimit: 60,
  });

  // Server-side 60 second timer
  room.roundTimer = setTimeout(() => {
    const currentRoom = rooms[roomCode];

    if (!currentRoom) {
      return;
    }

    endRound(roomCode);
  }, 60000);
}

// =========================
// SOCKET CONNECTION
// =========================

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // =========================
  // CREATE ROOM
  // =========================

  socket.on("createRoom", ({ playerName, rounds }) => {
    let roomCode = generateRoomCode();

    while (rooms[roomCode]) {
      roomCode = generateRoomCode();
    }

    rooms[roomCode] = {
      hostId: socket.id,

      rounds: Number(rounds) || 10,

      currentRound: 0,

      currentLetter: null,

      winnerId: null,

      roundEnded: true,

      roundTimer: null,

      players: [
        {
          id: socket.id,
          name: playerName.trim(),
          score: 0,
          answers: {},
          validation: {},
          submittedAt: null,
          submitted: false,
          allCorrect: false,
        },
      ],
    };

    socket.join(roomCode);

    console.log(`Room created: ${roomCode}`);

    socket.emit("roomCreated", {
      roomCode: roomCode,
      rounds: rooms[roomCode].rounds,
      players: rooms[roomCode].players.map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
      })),
    });
  });

  // =========================
  // JOIN ROOM
  // =========================

  socket.on("joinRoom", ({ roomCode, playerName }) => {
    const room = rooms[roomCode];

    if (!room) {
      socket.emit("joinError", "Room not found");
      return;
    }

    if (room.players.length >= 10) {
      socket.emit("joinError", "Room is full");
      return;
    }

    // Don't allow joining after game has started
    if (room.currentRound > 0) {
      socket.emit(
        "joinError",
        "Game has already started"
      );
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

    console.log(
      `${player.name} joined room ${roomCode}`
    );

    socket.emit("roomJoined", {
      roomCode: roomCode,
      rounds: room.rounds,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
      })),
    });

    io.to(roomCode).emit("roomUpdated", {
      roomCode: roomCode,
      rounds: room.rounds,

      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
      })),
    });
  });

  // =========================
  // START GAME
  // =========================

  socket.on("startGame", ({ roomCode }) => {
    const room = rooms[roomCode];

    if (!room) {
      return;
    }

    // Only host can start
    if (room.hostId !== socket.id) {
      return;
    }

    if (room.players.length < 1) {
      return;
    }

    startRound(roomCode, 1);
  });

  // =========================
  // SUBMIT ANSWERS
  // =========================

  socket.on(
    "submitAnswers",
    async ({ roomCode, answers, submittedAt }) => {
      const room = rooms[roomCode];

      if (!room) {
        return;
      }

      // Ignore submissions after round ended
      if (room.roundEnded) {
        return;
      }

      const player = room.players.find(
        (player) => player.id === socket.id
      );

      if (!player) {
        return;
      }

      // Prevent double submission
      if (player.submitted) {
        return;
      }

      // Lock submission immediately
      player.submitted = true;

      const letter = room.currentLetter;

      // =========================
      // AI VALIDATION
      // ALL 5 AT SAME TIME
      // =========================

      const [
        nameValid,
        placeValid,
        thingValid,
        animalValid,
        foodValid,
      ] = await Promise.all([
        validateAnswer(
          answers.name,
          "Name",
          letter
        ),

        validateAnswer(
          answers.place,
          "Place",
          letter
        ),

        validateAnswer(
          answers.thing,
          "Thing",
          letter
        ),

        validateAnswer(
          answers.animal,
          "Animal",
          letter
        ),

        validateAnswer(
          answers.food,
          "Food",
          letter
        ),
      ]);

      // If round ended while AI was checking,
      // don't process this submission further.
      if (room.roundEnded) {
        return;
      }

      const validation = {
        name: nameValid,
        place: placeValid,
        thing: thingValid,
        animal: animalValid,
        food: foodValid,
      };

      const allCorrect =
        validation.name &&
        validation.place &&
        validation.thing &&
        validation.animal &&
        validation.food;

        const correctCount = Object.values(validation).filter(
  (value) => value === true
).length;
      console.log(
        "Current Letter:",
        letter
      );

      console.log(
        "Validation:",
        validation
      );

      console.log(
        "All Correct:",
        allCorrect
      );

      // Store submission
      player.answers = answers;

      player.validation = validation;

      player.submittedAt =
        submittedAt || Date.now();

      player.allCorrect = allCorrect;

      // =========================
      // CORRECT ANSWERS
      // =========================

      if (allCorrect && !room.winnerId) {
        room.winnerId = player.id;

        player.score += correctCount;

        console.log(
          `${player.name} won round ${room.currentRound} in room ${roomCode}`
        );

        // End round immediately
        endRound(roomCode);

        return;
      }

      // =========================
      // WRONG ANSWERS
      // =========================

     if (!allCorrect) {
  player.score += correctCount;

  console.log(
    `${player.name} got ${correctCount} points in round ${room.currentRound}`
  );

  socket.emit("roundEnded", {
          roomCode: roomCode,

          currentRound: room.currentRound,

          winnerId: room.winnerId,

          winnerName:
            room.players.find(
              (player) =>
                player.id === room.winnerId
            )?.name || "No winner",

          letter: letter,

          players: room.players.map(
            (player) => ({
              id: player.id,
              name: player.name,
              score: player.score,
            })
          ),
        });
      }

      // Tell everyone this player submitted
      io.to(roomCode).emit(
        "playerSubmitted",
        {
          playerId: player.id,
          playerName: player.name,
        }
      );
    }
  );

  // =========================
  // NEXT ROUND
  // =========================

  socket.on(
    "nextRound",
    ({ roomCode }) => {
      const room = rooms[roomCode];

      if (!room) {
        return;
      }

      // Only host can start next round
      if (room.hostId !== socket.id) {
        return;
      }

      // Don't go beyond total rounds
      if (room.currentRound >= room.rounds) {
        io.to(roomCode).emit("gameOver", {
          roomCode: roomCode,

          players: room.players.map(
            (player) => ({
              id: player.id,
              name: player.name,
              score: player.score,
            })
          ),
        });

        return;
      }

      startRound(
        roomCode,
        room.currentRound + 1
      );
    }
  );

  socket.on("rematch", ({ roomCode }) => {
    console.log("REMATCH RECEIVED:", roomCode);
  const room = rooms[roomCode];

  if (!room) {
    return;
  }

  room.currentRound = 0;
  room.winnerId = null;
  room.roundEnded = false;

  room.players.forEach((player) => {
    player.score = 0;
    player.answers = {};
    player.validation = {};
    player.submittedAt = null;
    player.submitted = false;
    player.allCorrect = false;
  });
startRound(roomCode, 1);
});
  // =========================
  // DISCONNECT
  // =========================

  socket.on("disconnect", () => {
    console.log(
      "Player disconnected:",
      socket.id
    );

    for (const roomCode in rooms) {
      const room = rooms[roomCode];

      const wasPlayer = room.players.some(
        (player) =>
          player.id === socket.id
      );

      if (!wasPlayer) {
        continue;
      }

      room.players =
        room.players.filter(
          (player) =>
            player.id !== socket.id
        );

      // Room empty
      if (room.players.length === 0) {
        if (room.roundTimer) {
          clearTimeout(
            room.roundTimer
          );
        }

        delete rooms[roomCode];

        console.log(
          `Room deleted: ${roomCode}`
        );

        continue;
      }

      // Host left
      if (room.hostId === socket.id) {
        room.hostId =
          room.players[0].id;

        console.log(
          `New host for ${roomCode}: ${room.players[0].name}`
        );
      }

      io.to(roomCode).emit(
        "roomUpdated",
        {
          roomCode: roomCode,

          rounds: room.rounds,

          players:
            room.players.map(
              (player) => ({
                id: player.id,
                name: player.name,
                score: player.score,
              })
            ),
        }
      );
    }
  });
});

// =========================
// START SERVER
// =========================

const PORT = 5000;

server.listen(PORT, () => {
  console.log(
    `Alphabet Rush server running on http://localhost:${PORT}`
  );
});