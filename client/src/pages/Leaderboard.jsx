import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlayerList from "../components/rooms/PlayerList";
import socket from "../services/socket";

function Leaderboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const gameData = location.state;

  useEffect(() => {
    const handleGameStarted = (nextGameData) => {
      navigate("/game", { state: nextGameData });
    };

    socket.on("gameStarted", handleGameStarted);
    return () => socket.off("gameStarted", handleGameStarted);
  }, [navigate]);

  if (!gameData) {
    return (
      <main className="room-container">
        <section className="room-card">
          <div className="room-icon">🏆</div>
          <h1>Leaderboard unavailable</h1>
          <p className="room-subtitle">The final results are no longer available.</p>
          <button className="main-room-btn" type="button" onClick={() => navigate("/")}>
            BACK TO HOME
          </button>
        </section>
      </main>
    );
  }

  const players = [...(gameData.players || [])].sort(
    (first, second) => second.score - first.score
  );

  const topScore = players.length ? players[0].score : 0;
  const winners = players.filter((player) => player.score === topScore);
  const isHost = gameData.hostId === socket.id;

  return (
    <main className="room-container">
      <section className="waiting-card leaderboard-card">
        <div className="result-hero">
          <div className="room-icon" aria-hidden="true">🏆</div>
          <p className="home-eyebrow">FINAL RESULTS</p>
          <h1>Game Complete</h1>
          <p className="room-subtitle">
            After {gameData.totalRounds || "all"} rounds, the final scores are in.
          </p>
        </div>

        <div className="overall-winner-banner">
          <span className="overall-trophy" aria-hidden="true">👑</span>
          <div>
            <small>OVERALL WINNER{winners.length > 1 ? "S" : ""}</small>
            <strong>{winners.length ? winners.map((player) => player.name).join(" · ") : "No winner"}</strong>
            <span>{topScore} total point{topScore === 1 ? "" : "s"}</span>
          </div>
        </div>

        <section className="players-section">
          <div className="section-title">
            <h2>Final Leaderboard</h2>
            <span>{players.length} player{players.length === 1 ? "" : "s"}</span>
          </div>

          <PlayerList players={players} showScores showRank />
        </section>

        {isHost ? (
          <button
            className="start-game-btn"
            type="button"
            onClick={() => socket.emit("rematch", { roomCode: gameData.roomCode })}
          >
            🔄 PLAY AGAIN
          </button>
        ) : (
          <div className="waiting-message">
            ⏳ Waiting for the host to start another game...
          </div>
        )}

        <button className="leave-btn" type="button" onClick={() => navigate("/")}>
          🏠 BACK TO HOME
        </button>
      </section>
    </main>
  );
}

export default Leaderboard;
