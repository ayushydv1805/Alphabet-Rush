const { Pool } = require("pg");

let pool = null;
let connected = false;

function normalizeLimit(value, fallback = 10) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), 50);
}

function calculatePlacement(players, playerId) {
  const ranked = [...(players || [])].sort(
    (first, second) => (second.score || 0) - (first.score || 0)
  );

  const index = ranked.findIndex((player) => player.playerId === playerId);
  return index >= 0 ? index + 1 : null;
}

function calculateMatchDuration(startedAt, endedAt) {
  if (!startedAt || !endedAt) return null;

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.round((end - start) / 1000);
}

function buildMatchRecord({ room, endedAt = new Date().toISOString() }) {
  const players = Array.isArray(room?.players) ? room.players : [];
  const rankedPlayers = [...players].sort(
    (first, second) => (second.score || 0) - (first.score || 0)
  );
  const topScore = rankedPlayers.length ? rankedPlayers[0].score || 0 : 0;

  return {
    gameId: room.gameId,
    roomCode: room.roomCode,
    gameMode: room.gameMode || "classic",
    categoryPack: room.categoryPack || "classic",
    rounds: Number(room.rounds) || 0,
    winningScore: topScore,
    winnerPlayerIds: rankedPlayers
      .filter((player) => (player.score || 0) === topScore)
      .map((player) => player.playerId)
      .filter(Boolean),
    startedAt: room.matchStartedAt
      ? new Date(room.matchStartedAt).toISOString()
      : room.createdAt
        ? new Date(room.createdAt).toISOString()
        : null,
    endedAt,
    durationSeconds: calculateMatchDuration(
      room.matchStartedAt
        ? new Date(room.matchStartedAt).toISOString()
        : room.createdAt
          ? new Date(room.createdAt).toISOString()
          : null,
      endedAt
    ),
    players: players
      .filter((player) => player.playerId)
      .map((player) => ({
        playerId: player.playerId,
        playerName: player.name || "Player",
        avatar: player.avatar || "⚡",
        title: player.title || "Rush Rookie",
        finalScore: Number(player.score) || 0,
        placement: calculatePlacement(players, player.playerId),
        roundsPlayed: Number(room.currentRound) || 0,
        correctAnswers: Number(player.totalCorrectAnswers) || 0,
        perfectRounds: Number(player.perfectRounds) || 0,
        bestStreak: Number(player.bestStreak) || 0,
      })),
  };
}

async function initMatchHistoryStore() {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });

  pool.on("error", (error) => {
    connected = false;
    console.error(
      JSON.stringify({
        event: "match_history_database_error",
        message: error.message,
      })
    );
  });

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS alphabet_rush_matches (
        game_id TEXT PRIMARY KEY,
        room_code TEXT NOT NULL,
        game_mode TEXT NOT NULL,
        category_pack TEXT NOT NULL,
        rounds INTEGER NOT NULL DEFAULT 0,
        winning_score INTEGER NOT NULL DEFAULT 0,
        winner_player_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        started_at TIMESTAMPTZ,
        ended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        duration_seconds INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS alphabet_rush_match_players (
        game_id TEXT NOT NULL REFERENCES alphabet_rush_matches(game_id) ON DELETE CASCADE,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        title TEXT NOT NULL,
        final_score INTEGER NOT NULL DEFAULT 0,
        placement INTEGER,
        rounds_played INTEGER NOT NULL DEFAULT 0,
        correct_answers INTEGER NOT NULL DEFAULT 0,
        perfect_rounds INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (game_id, player_id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS alphabet_rush_match_players_player_idx
      ON alphabet_rush_match_players (player_id, game_id DESC)
    `);

    connected = true;
  } finally {
    client.release();
  }

  return true;
}

async function recordCompletedMatch(record) {
  if (!connected || !pool || !record?.gameId) return false;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO alphabet_rush_matches (
          game_id,
          room_code,
          game_mode,
          category_pack,
          rounds,
          winning_score,
          winner_player_ids,
          started_at,
          ended_at,
          duration_seconds
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb,
          $8, $9, $10
        )
        ON CONFLICT (game_id) DO NOTHING
      `,
      [
        record.gameId,
        record.roomCode,
        record.gameMode,
        record.categoryPack,
        record.rounds,
        record.winningScore,
        JSON.stringify(record.winnerPlayerIds || []),
        record.startedAt,
        record.endedAt,
        record.durationSeconds,
      ]
    );

    for (const player of record.players || []) {
      await client.query(
        `
          INSERT INTO alphabet_rush_match_players (
            game_id,
            player_id,
            player_name,
            avatar,
            title,
            final_score,
            placement,
            rounds_played,
            correct_answers,
            perfect_rounds,
            best_streak
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (game_id, player_id)
          DO UPDATE SET
            player_name = EXCLUDED.player_name,
            avatar = EXCLUDED.avatar,
            title = EXCLUDED.title,
            final_score = EXCLUDED.final_score,
            placement = EXCLUDED.placement,
            rounds_played = EXCLUDED.rounds_played,
            correct_answers = EXCLUDED.correct_answers,
            perfect_rounds = EXCLUDED.perfect_rounds,
            best_streak = EXCLUDED.best_streak
        `,
        [
          record.gameId,
          player.playerId,
          player.playerName,
          player.avatar,
          player.title,
          player.finalScore,
          player.placement,
          player.roundsPlayed,
          player.correctAnswers,
          player.perfectRounds,
          player.bestStreak,
        ]
      );
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function getPlayerMatchHistory(playerId, limit = 10) {
  if (!connected || !pool || !playerId) return [];

  const safeLimit = normalizeLimit(limit);

  const result = await pool.query(
    `
      SELECT
        m.game_id,
        m.room_code,
        m.game_mode,
        m.category_pack,
        m.rounds,
        m.winning_score,
        m.winner_player_ids,
        m.ended_at,
        m.duration_seconds,
        p.player_name,
        p.final_score,
        p.placement,
        p.rounds_played,
        p.correct_answers,
        p.perfect_rounds,
        p.best_streak
      FROM alphabet_rush_match_players p
      JOIN alphabet_rush_matches m ON m.game_id = p.game_id
      WHERE p.player_id = $1
      ORDER BY m.ended_at DESC
      LIMIT $2
    `,
    [playerId, safeLimit]
  );

  return result.rows.map((row) => {
    const winners = Array.isArray(row.winner_player_ids)
      ? row.winner_player_ids
      : [];

    return {
      gameId: row.game_id,
      roomCode: row.room_code,
      gameMode: row.game_mode,
      categoryPack: row.category_pack,
      rounds: Number(row.rounds) || 0,
      winningScore: Number(row.winning_score) || 0,
      playerName: row.player_name,
      finalScore: Number(row.final_score) || 0,
      placement: row.placement == null ? null : Number(row.placement),
      roundsPlayed: Number(row.rounds_played) || 0,
      correctAnswers: Number(row.correct_answers) || 0,
      perfectRounds: Number(row.perfect_rounds) || 0,
      bestStreak: Number(row.best_streak) || 0,
      won: winners.includes(playerId),
      endedAt: row.ended_at,
      durationSeconds:
        row.duration_seconds == null ? null : Number(row.duration_seconds),
    };
  });
}

async function getPlayerLifetimeStats(playerId) {
  if (!connected || !pool || !playerId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS games_played,
        COUNT(*) FILTER (WHERE placement = 1)::int AS wins,
        COALESCE(SUM(final_score), 0)::int AS total_points,
        COALESCE(SUM(correct_answers), 0)::int AS total_correct_answers,
        COALESCE(SUM(perfect_rounds), 0)::int AS perfect_rounds,
        COALESCE(MAX(best_streak), 0)::int AS best_streak,
        COALESCE(SUM(rounds_played), 0)::int AS total_rounds,
        COALESCE(AVG(final_score), 0)::numeric(10,2) AS average_score
      FROM alphabet_rush_match_players
      WHERE player_id = $1
    `,
    [playerId]
  );

  const row = result.rows[0];

  if (!row) return null;

  const gamesPlayed = Number(row.games_played) || 0;

  return {
    gamesPlayed,
    wins: Number(row.wins) || 0,
    winRate: gamesPlayed
      ? Math.round(((Number(row.wins) || 0) / gamesPlayed) * 100)
      : 0,
    totalPoints: Number(row.total_points) || 0,
    totalCorrectAnswers: Number(row.total_correct_answers) || 0,
    perfectRounds: Number(row.perfect_rounds) || 0,
    bestStreak: Number(row.best_streak) || 0,
    totalRounds: Number(row.total_rounds) || 0,
    averageScore: Number(row.average_score) || 0,
  };
}

async function closeMatchHistoryStore() {
  connected = false;

  if (pool) {
    await pool.end();
  }

  pool = null;
}

function getMatchHistoryStatus() {
  return {
    enabled: connected,
  };
}

module.exports = {
  initMatchHistoryStore,
  recordCompletedMatch,
  getPlayerMatchHistory,
  getPlayerLifetimeStats,
  closeMatchHistoryStore,
  getMatchHistoryStatus,
  buildMatchRecord,
  calculatePlacement,
  calculateMatchDuration,
};
