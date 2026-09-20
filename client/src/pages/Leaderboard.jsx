import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import PlayerList from "../components/rooms/PlayerList";

function Leaderboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const gameData = location.state;

  useEffect(() => {
    const handleGameStarted = (nextGameData) => navigate("/game", { state: nextGameData });

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

  const winner = players[0];

  return (
    <main className="room-container">
      <section className="waiting-card">
        <div className="room-icon">🏆</div>
        <h1>Game Over!</h1>
        <p className="room-subtitle">Final Results</p>

        {winner && (
          <div className="waiting-message">
            👑 Winner: <strong>{winner.name}</strong>
          </div>
        )}

        <section className="players-section">
          <div className="section-title"><h2>Final Leaderboard</h2></div>
          <PlayerList players={players} showScores showRank />
        </section>

        <button
          className="start-game-btn"
          type="button"
          onClick={() => socket.emit("rematch", { roomCode: gameData.roomCode })}
        >
          🔄 PLAY AGAIN
        </button>

        <button className="leave-btn" type="button" onClick={() => navigate("/")}>
          🏠 BACK TO HOME
        </button>
      </section>
    </main>
  );
}

export default Leaderboard;
