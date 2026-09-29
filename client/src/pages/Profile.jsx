import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AVATARS,
  TITLES,
  getAvatar,
  getLevelProgress,
  getProfile,
  isAvatarUnlocked,
  isTitleUnlocked,
  saveProfile,
} from "../services/profile";
import { getIdentityToken } from "../services/identity";
import {
  fetchPlayerHistory,
  fetchPlayerStats,
} from "../services/matchHistory";

function formatMatchDate(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds) {
  if (seconds == null) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return minutes
    ? minutes + "m " + remaining + "s"
    : remaining + "s";
}

function Profile() {
  const [profile, setProfile] = useState(getProfile);
  const [matchHistory, setMatchHistory] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [historyState, setHistoryState] = useState("idle");

  const avatar = getAvatar(profile.avatarId);
  const title = TITLES.find((item) => item.id === profile.titleId) || TITLES[0];
  const progress = getLevelProgress(profile.xp);

  const displayStats = serverStats || {
    gamesPlayed: profile.totalGames,
    wins: profile.wins,
    winRate: profile.totalGames
      ? Math.round((profile.wins / profile.totalGames) * 100)
      : 0,
    totalPoints: profile.totalPoints,
    totalCorrectAnswers: 0,
    perfectRounds: profile.perfectRounds,
    bestStreak: profile.bestStreak,
    totalRounds: profile.totalRounds,
    averageScore: 0,
  };

  const milestones = useMemo(
    () => [
      {
        icon: "🎯",
        label: "Perfect Rounds",
        value: displayStats.perfectRounds,
      },
      {
        icon: "🔥",
        label: "Best Streak",
        value: displayStats.bestStreak,
      },
      {
        icon: "⚡",
        label: "Total Points",
        value: displayStats.totalPoints,
      },
      {
        icon: "🏆",
        label: "Win Rate",
        value: displayStats.winRate + "%",
      },
    ],
    [displayStats]
  );

  useEffect(() => {
    const token = getIdentityToken();

    if (!token) {
      setHistoryState("empty");
      return undefined;
    }

    let active = true;
    setHistoryState("loading");

    Promise.all([
      fetchPlayerHistory(token, 10),
      fetchPlayerStats(token),
    ])
      .then(([history, stats]) => {
        if (!active) return;
        setMatchHistory(history);
        setServerStats(stats);
        setHistoryState(history.length ? "ready" : "empty");
      })
      .catch(() => {
        if (!active) return;
        setHistoryState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const saveName = (event) => {
    event.preventDefault();
    const name = profile.name.trim();

    setProfile(
      saveProfile({
        ...profile,
        name,
      })
    );
  };

  return (
    <main className="room-container profile-page">
      <section className="waiting-card profile-card">
        <div className="profile-topbar">
          <Link className="profile-back" to="/">← HOME</Link>
          <span className="profile-top-label">PLAYER PROFILE</span>
        </div>

        <section className="profile-hero">
          <div className="profile-avatar-large" aria-hidden="true">
            {avatar.icon}
          </div>

          <div className="profile-identity">
            <p className="home-eyebrow">{title.name}</p>
            <h1>{profile.name || "Your Rush Profile"}</h1>
            <p className="room-subtitle">
              Level {profile.level} · {profile.xp} XP
            </p>

            <div
              className="xp-track"
              aria-label={profile.xp + " experience points"}
            >
              <span style={{ width: progress + "%" }} />
            </div>
            <small className="xp-copy">
              {progress}/100 XP to Level {profile.level + 1}
            </small>
          </div>
        </section>

        <form className="profile-name-form" onSubmit={saveName}>
          <label htmlFor="profile-name">DISPLAY NAME</label>
          <div className="profile-name-row">
            <input
              id="profile-name"
              value={profile.name}
              maxLength={20}
              placeholder="Enter your player name"
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <button className="profile-save-btn" type="submit">SAVE</button>
          </div>
        </form>

        <section className="profile-section">
          <div className="section-title">
            <h2>Choose your avatar</h2>
            <span>Unlocks by level</span>
          </div>

          <div className="avatar-picker">
            {AVATARS.map((item) => {
              const unlocked = isAvatarUnlocked(item, profile.level);
              const selected = item.id === profile.avatarId;

              return (
                <button
                  type="button"
                  className={
                    selected
                      ? "avatar-option selected"
                      : unlocked
                        ? "avatar-option"
                        : "avatar-option locked"
                  }
                  key={item.id}
                  disabled={!unlocked}
                  onClick={() =>
                    setProfile(
                      saveProfile({
                        ...profile,
                        avatarId: item.id,
                      })
                    )
                  }
                  title={
                    unlocked
                      ? item.name
                      : "Unlocks at level " + item.unlockLevel
                  }
                >
                  <span>{unlocked ? item.icon : "🔒"}</span>
                  <small>{item.name}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="profile-section">
          <div className="section-title">
            <h2>Choose your title</h2>
            <span>Unlocks by level</span>
          </div>

          <div className="title-picker">
            {TITLES.map((item) => {
              const unlocked = isTitleUnlocked(item, profile.level);
              const selected = item.id === profile.titleId;

              return (
                <button
                  type="button"
                  className={
                    selected
                      ? "title-option selected"
                      : unlocked
                        ? "title-option"
                        : "title-option locked"
                  }
                  key={item.id}
                  disabled={!unlocked}
                  onClick={() =>
                    setProfile(
                      saveProfile({
                        ...profile,
                        titleId: item.id,
                      })
                    )
                  }
                >
                  <strong>{unlocked ? "✦" : "🔒"}</strong>
                  <span>{item.name}</span>
                  <small>
                    {unlocked ? "Unlocked" : "Level " + item.unlockLevel}
                  </small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="profile-section">
          <div className="section-title">
            <h2>Your stats</h2>
            <span>{serverStats ? "Synced match history" : "Lifetime on this browser"}</span>
          </div>

          <div className="profile-stats-grid">
            {milestones.map((stat) => (
              <article className="profile-stat-card" key={stat.label}>
                <span aria-hidden="true">{stat.icon}</span>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </article>
            ))}
          </div>

          <div className="profile-stat-line">
            <span>Games played</span>
            <strong>{displayStats.gamesPlayed}</strong>
          </div>
          <div className="profile-stat-line">
            <span>Total rounds</span>
            <strong>{displayStats.totalRounds}</strong>
          </div>
          <div className="profile-stat-line">
            <span>Average score / game</span>
            <strong>{displayStats.averageScore}</strong>
          </div>
          <div className="profile-stat-line">
            <span>Correct answers</span>
            <strong>{displayStats.totalCorrectAnswers}</strong>
          </div>
        </section>

        <section className="profile-section">
          <div className="section-title">
            <h2>Recent matches</h2>
            <span>Last 10 completed games</span>
          </div>

          {historyState === "loading" ? (
            <div className="history-state">Loading your match history…</div>
          ) : historyState === "error" ? (
            <div className="history-state history-state-error">
              Match history is temporarily unavailable.
            </div>
          ) : matchHistory.length ? (
            <div className="match-history-list">
              {matchHistory.map((match) => (
                <article className="match-history-card" key={match.gameId}>
                  <div className="match-history-main">
                    <div className="match-history-icon">
                      {match.won ? "🏆" : "🎮"}
                    </div>
                    <div>
                      <strong>
                        {match.gameMode === "double"
                          ? "Double Points"
                          : match.gameMode.charAt(0).toUpperCase() + match.gameMode.slice(1)}
                      </strong>
                      <small>
                        {match.categoryPack.charAt(0).toUpperCase() +
                          match.categoryPack.slice(1)}{" "}
                        · {formatMatchDate(match.endedAt)}
                      </small>
                    </div>
                  </div>

                  <div className="match-history-score">
                    <strong>{match.finalScore}</strong>
                    <span>pts</span>
                  </div>

                  <div className="match-history-meta">
                    <span>
                      {match.placement ? "#" + match.placement : "—"} place
                    </span>
                    <span>{match.perfectRounds} perfect</span>
                    <span>{formatDuration(match.durationSeconds)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="history-state">
              Finish a match to build your durable match history.
            </div>
          )}
        </section>

        <Link className="profile-play-btn" to="/">PLAY A GAME →</Link>
      </section>
    </main>
  );
}

export default Profile;
