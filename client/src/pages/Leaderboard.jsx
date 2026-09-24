import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlayerList from "../components/rooms/PlayerList";
import { playGameSound } from "../services/sound";
import {
  getAvatar,
  getLevelFromXp,
  getProfile,
  recordGameResult,
} from "../services/profile";
import socket from "../services/socket";

function Leaderboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const gameData = location.state;
  const celebrationPlayed = useRef(false);

  useEffect(() => {
    const handleGameStarted = (nextGameData) => {
      navigate("/game", { state: nextGameData });
    };

    socket.on("gameStarted", handleGameStarted);
    return () => socket.off("gameStarted", handleGameStarted);
  }, [navigate]);

  useEffect(() => {
    if (!gameData || celebrationPlayed.current) return;
    celebrationPlayed.current = true;
    playGameSound("winner");
  }, [gameData]);

  const players = [...(gameData?.players || [])].sort(
    (first, second) => second.score - first.score
  );
  const me = players.find((player) => player.id === socket.id);
  const topScore = players.length ? players[0].score : 0;
  const winners = players.filter((player) => player.score === topScore);
  const isHost = Boolean(gameData && gameData.hostId === socket.id);
  const didWin = Boolean(me && winners.some((player) => player.id === socket.id));
  const gameXp = didWin ? 100 : 50;
  const currentProfile = getProfile();
  const projectedXp = currentProfile.xp + gameXp;
  const projectedLevel = getLevelFromXp(projectedXp);
  const avatar = me?.avatar || getAvatar(currentProfile.avatarId).icon;

  useEffect(() => {
    if (!gameData?.gameId || !me) return;

    recordGameResult({
      gameKey: gameData.gameId,
      won: didWin,
    });
  }, [gameData?.gameId, me, didWin]);

  if (!gameData) {
    return (
      <main className="room-container">
        <section className="room-card">
          <div className="room-icon">🏆</div>
          <h1>Leaderboard unavailable</h1>
          <p className="room-subtitle">
            The final results are no longer available.
          </p>
          <button
            className="main-room-btn"
            type="button"
            onClick={() => navigate("/")}
          >
            BACK TO HOME
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="room-container">
      <section className="waiting-card leaderboard-card">
        <div className="result-hero result-hero-animated">
          <div className="room-icon" aria-hidden="true">🏆</div>
          <p className="home-eyebrow">FINAL RESULTS</p>
          <h1>Game Complete</h1>
          <p className="room-subtitle">
            After {gameData.totalRounds || "all"} rounds, the final scores are in.
          </p>
        </div>

        <div className="overall-winner-banner winner-banner-pop">
          <span className="overall-trophy" aria-hidden="true">👑</span>
          <div>
            <small>OVERALL WINNER{winners.length > 1 ? "S" : ""}</small>
            <strong>
              {winners.length
                ? winners.map((player) => player.name).join(" · ")
                : "No winner"}
            </strong>
            <span>
              {topScore} total point{topScore === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {me ? (
          <section className="final-personal-card">
            <div className="final-personal-avatar">{avatar}</div>
            <div className="final-personal-main">
              <span>YOUR RUN</span>
              <strong>{me.name}</strong>
              <small>
                {me.title || "Rush Rookie"} · {me.score} points ·{" "}
                {me.perfectRounds || 0} perfect rounds
              </small>
            </div>
            <div className="final-personal-xp">
              <span>GAME XP</span>
              <strong>+{gameXp}</strong>
              <small>Level {projectedLevel}</small>
            </div>
          </section>
        ) : null}

        <section className="players-section">
          <div className="section-title">
            <h2>Final Leaderboard</h2>
            <span>
              {players.length} player{players.length === 1 ? "" : "s"}
            </span>
          </div>

          <PlayerList players={players} showScores showRank />
        </section>

        {isHost ? (
          <button
            className="start-game-btn"
            type="button"
            onClick={() => {
              playGameSound("nextRound");
              socket.emit("rematch", { roomCode: gameData.roomCode });
            }}
          >
            🔄 PLAY AGAIN
          </button>
        ) : (
          <div className="waiting-message">
            ⏳ Waiting for the host to start another game...
          </div>
        )}

        <button
          className="profile-play-btn"
          type="button"
          onClick={() => navigate("/profile")}
        >
          👤 VIEW PROFILE
        </button>

        <button
          className="leave-btn"
          type="button"
          onClick={() => navigate("/")}
        >
          🏠 BACK TO HOME
        </button>
      </section>
    </main>
  );
}

export default Leaderboard;
