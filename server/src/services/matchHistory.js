const { Pool } = require("pg");
const { createClient } = require("redis");

let pool = null;
let redis = null;
let connected = false;
let storageMode = "disabled";

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
  // Prefer Postgres when it is connected. Redis is a reliable fallback for
  // the existing Render deployment, so player history still works even when
  // the Postgres environment variable has not been linked to the web service.
  if (process.env.DATABASE_URL) {
    try {
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
        storageMode = "postgres";
      } finally {
        client.release();
      }

      return true;
    } catch (error) {
      connected = false;
      await pool?.end().catch(() => {});
      pool = null;

      console.error(
        JSON.stringify({
          event: "match_history_postgres_unavailable",
          message: error.message,
        })
      );
    }
  }

  if (process.env.REDIS_URL) {
    redis = createClient({ url: process.env.REDIS_URL });

    redis.on("error", (error) => {
      connected = false;
      console.error(
        JSON.stringify({
          event: "match_history_redis_error",
          message: error.message,
        })
      );
    });

    try {
      await redis.connect();
      connected = true;
      storageMode = "redis";
      return true;
    } catch (error) {
      await redis.disconnect().catch(() => {});
      redis = null;

      console.error(
        JSON.stringify({
          event: "match_history_redis_startup_error",
          message: error.message,
        })
      );
    }
  }

  return false;
}

async function recordCompletedMatch(record) {
  if (!connected || !record?.gameId) return false;

  if (storageMode === "redis" && redis) {
    for (const player of record.players || []) {
      const idempotencyKey =
        "alphabet-rush:match-recorded:" +
        record.gameId +
        ":" +
        player.playerId;

      const inserted = await redis.set(idempotencyKey, "1", { NX: true });

      if (inserted !== "OK") {
        continue;
      }

      const historyEntry = {
        gameId: record.gameId,
        roomCode: record.roomCode,
        gameMode: record.gameMode,
        categoryPack: record.categoryPack,
        rounds: record.rounds,
        winningScore: record.winningScore,
        winnerPlayerIds: record.winnerPlayerIds || [],
        startedAt: record.startedAt,
        endedAt: record.endedAt,
        durationSeconds: record.durationSeconds,
        playerName: player.playerName,
        finalScore: player.finalScore,
        placement: player.placement,
        roundsPlayed: player.roundsPlayed,
        correctAnswers: player.correctAnswers,
        perfectRounds: player.perfectRounds,
        bestStreak: player.bestStreak,
        won: (record.winnerPlayerIds || []).includes(player.playerId),
      };

      const historyKey = "alphabet-rush:player-history:" + player.playerId;
      const statsKey = "alphabet-rush:player-stats:" + player.playerId;

      const multi = redis.multi();
      multi.lPush(historyKey, JSON.stringify(historyEntry));
      multi.lTrim(historyKey, 0, 49);
      multi.hIncrBy(statsKey, "gamesPlayed", 1);
      multi.hIncrBy(
        statsKey,
        "wins",
        historyEntry.won ? 1 : 0
      );
      multi.hIncrBy(
        statsKey,
        "totalPoints",
        player.finalScore
      );
      multi.hIncrBy(
        statsKey,
        "totalCorrectAnswers",
        player.correctAnswers
      );
      multi.hIncrBy(
        statsKey,
        "perfectRounds",
        player.perfectRounds
      );
      multi.hIncrBy(
        statsKey,
        "totalRounds",
        player.roundsPlayed
      );
      multi.hIncrBy(
        statsKey,
        "totalScore",
        player.finalScore
      );

      await multi.exec();

      const existingBestStreak = Number(
        await redis.hGet(statsKey, "bestStreak")
      ) || 0;

      if (player.bestStreak > existingBestStreak) {
        await redis.hSet(
          statsKey,
          "bestStreak",
          String(player.bestStreak)
        );
      }
    }

    return true;
  }

  if (storageMode !== "postgres" || !pool) return false;

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
  if (!connected || !playerId) return [];

  const safeLimit = normalizeLimit(limit);

  if (storageMode === "redis" && redis) {
    const rawEntries = await redis.lRange(
      "alphabet-rush:player-history:" + playerId,
      0,
      safeLimit - 1
    );

    return rawEntries
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  if (storageMode !== "postgres" || !pool) return [];

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
  if (!connected || !playerId) {
    return null;
  }

  if (storageMode === "redis" && redis) {
    const row = await redis.hGetAll(
      "alphabet-rush:player-stats:" + playerId
    );

    const gamesPlayed = Number(row.gamesPlayed) || 0;

    return {
      gamesPlayed,
      wins: Number(row.wins) || 0,
      winRate: gamesPlayed
        ? Math.round(((Number(row.wins) || 0) / gamesPlayed) * 100)
        : 0,
      totalPoints: Number(row.totalPoints) || 0,
      totalCorrectAnswers: Number(row.totalCorrectAnswers) || 0,
      perfectRounds: Number(row.perfectRounds) || 0,
      bestStreak: Number(row.bestStreak) || 0,
      totalRounds: Number(row.totalRounds) || 0,
      averageScore: gamesPlayed
        ? Number((Number(row.totalScore || 0) / gamesPlayed).toFixed(2))
        : 0,
    };
  }

  if (storageMode !== "postgres" || !pool) return null;

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

  await Promise.allSettled([
    pool?.end(),
    redis?.quit(),
  ]);

  pool = null;
  redis = null;
  storageMode = "disabled";
}

function getMatchHistoryStatus() {
  return {
    enabled: connected,
    storage: storageMode,
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
