const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildMatchRecord,
  calculatePlacement,
  calculateMatchDuration,
  buildGlobalLeaderboardRows,
} = require("./matchHistory");

test("calculates placement with tied scores sharing rank order", () => {
  const players = [
    { playerId: "a", score: 12 },
    { playerId: "b", score: 8 },
    { playerId: "c", score: 12 },
  ];

  assert.equal(calculatePlacement(players, "a"), 1);
  assert.equal(calculatePlacement(players, "b"), 3);
  assert.equal(calculatePlacement(players, "c"), 1);
});

test("calculates match duration in seconds", () => {
  assert.equal(
    calculateMatchDuration(
      "2026-09-29T10:00:00.000Z",
      "2026-09-29T10:07:12.000Z"
    ),
    432
  );
});

test("builds a privacy-safe match summary", () => {
  const record = buildMatchRecord({
    room: {
      roomCode: "ABC123",
      gameId: "game-1",
      gameMode: "double",
      categoryPack: "india",
      rounds: 10,
      matchStartedAt: Date.parse("2026-09-29T10:00:00.000Z"),
      currentRound: 10,
      players: [
        {
          playerId: "p1",
          name: "Ayush",
          avatar: "⚡",
          title: "Rush Rookie",
          score: 18,
          totalCorrectAnswers: 14,
          perfectRounds: 2,
          bestStreak: 3,
        },
        {
          playerId: "p2",
          name: "Friend",
          avatar: "🦊",
          title: "Quick Thinker",
          score: 12,
          totalCorrectAnswers: 10,
          perfectRounds: 1,
          bestStreak: 2,
        },
      ],
    },
    endedAt: "2026-09-29T10:06:00.000Z",
  });

  assert.equal(record.gameId, "game-1");
  assert.equal(record.gameMode, "double");
  assert.equal(record.categoryPack, "india");
  assert.deepEqual(record.winnerPlayerIds, ["p1"]);
  assert.equal(record.players[0].placement, 1);
  assert.equal(record.players[0].correctAnswers, 14);
  assert.equal(record.players[1].placement, 2);
  assert.equal(record.durationSeconds, 360);
});


test("builds deterministic global leaderboard rows", () => {
  const rows = buildGlobalLeaderboardRows([
    {
      playerId: "p2",
      player_name: "Beta",
      games_played: 2,
      wins: 0,
      total_points: 18,
      total_correct_answers: 12,
      best_streak: 3,
    },
    {
      playerId: "p1",
      player_name: "Alpha",
      games_played: 3,
      wins: 2,
      total_points: 18,
      total_correct_answers: 15,
      best_streak: 5,
    },
  ]);

  assert.equal(rows[0].playerId, "p1");
  assert.equal(rows[0].averageScore, 6);
  assert.equal(rows[0].wins, 2);
  assert.equal(rows[1].playerId, "p2");
});
