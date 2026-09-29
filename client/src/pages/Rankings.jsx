import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGlobalLeaderboard } from "../services/leaderboard";

function Rankings() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let active = true;

    fetchGlobalLeaderboard(50)
      .then((rows) => {
        if (!active) return;
        setLeaderboard(rows);
        setState("ready");
      })
      .catch(() => {
        if (!active) return;
        setState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="room-container rankings-page">
      <section className="waiting-card rankings-card">
        <div className="rankings-topbar">
          <Link className="profile-back" to="/">← HOME</Link>
          <span className="profile-top-label">GLOBAL RANKINGS</span>
        </div>

        <div className="rankings-hero">
          <div className="rankings-icon" aria-hidden="true">🏆</div>
          <div>
            <p className="home-eyebrow">ALL-TIME LEADERBOARD</p>
            <h1>Rush Rankings</h1>
            <p className="room-subtitle">
              Long-term competition tracked across completed matches.
            </p>
          </div>
        </div>

        {state === "loading" ? (
          <div className="history-state">Loading global rankings…</div>
        ) : state === "error" ? (
          <div className="history-state history-state-error">
            Global rankings are temporarily unavailable.
          </div>
        ) : leaderboard.length ? (
          <section className="rankings-table" aria-label="Global rankings">
            <div className="rankings-table-head">
              <span>RANK</span>
              <span>PLAYER</span>
              <span>GAMES</span>
              <span>WINS</span>
              <span>POINTS</span>
            </div>

            {leaderboard.map((player, index) => (
              <article
                className={
                  index < 3
                    ? "ranking-row ranking-row-top"
                    : "ranking-row"
                }
                key={player.playerId}
              >
                <div className="ranking-place">
                  {index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : index + 1}
                </div>

                <div className="ranking-player">
                  <span>{player.avatar}</span>
                  <div>
                    <strong>{player.name}</strong>
                    <small>{player.title}</small>
                  </div>
                </div>

                <strong>{player.gamesPlayed}</strong>
                <strong>{player.wins}</strong>
                <strong className="ranking-points">{player.totalPoints}</strong>
              </article>
            ))}
          </section>
        ) : (
          <div className="history-state">
            No completed matches have been recorded yet.
          </div>
        )}

        <p className="rankings-note">
          Rankings are based on accumulated points from completed matches.
        </p>

        <Link className="profile-play-btn" to="/create-room">
          CREATE A MATCH →
        </Link>
      </section>
    </main>
  );
}

export default Rankings;
