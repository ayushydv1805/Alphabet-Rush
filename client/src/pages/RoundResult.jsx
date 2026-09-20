import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import PlayerList from "../components/rooms/PlayerList";

function RoundResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultData = location.state;

  useEffect(() => {
    const handleGameStarted = (gameData) => navigate("/game", { state: gameData });
    const handleGameOver = (gameData) => navigate("/leaderboard", { state: gameData });

    socket.on("gameStarted", handleGameStarted);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameOver", handleGameOver);
    };
  }, [navigate]);

  if (!resultData) {
    return (
      <main className="room-container">
        <section className="room-card">
          <div className="room-icon">🏆</div>
          <h1>Result unavailable</h1>
          <p className="room-subtitle">This round result is no longer available.</p>
          <button className="main-room-btn" type="button" onClick={() => navigate("/")}>
            BACK TO HOME
          </button>
        </section>
      </main>
    );
  }

  const isLastRound =
    resultData.totalRounds != null &&
    resultData.currentRound >= resultData.totalRounds;

  return (
    <main className="room-container">
      <section className="waiting-card">
        <div className="room-icon">🏆</div>
        <h1>Round {resultData.currentRound} Result</h1>
        <p className="room-subtitle">The round has ended.</p>

        <div className="waiting-message">
          🏆 Winner: <strong>{resultData.winnerName || "No winner"}</strong>
        </div>

        {resultData.winnerId === null && (
          <div className="waiting-message">❌ No winner this round</div>
        )}

        <div className="waiting-message">
          🎯 Letter: <strong>{resultData.letter}</strong>
        </div>

        <section className="players-section">
          <div className="section-title"><h2>Scores</h2></div>
          <PlayerList players={resultData.players} showScores showRank />
        </section>

        <button
          className="start-game-btn"
          type="button"
          onClick={() => socket.emit("nextRound", { roomCode: resultData.roomCode })}
        >
          {isLastRound ? "🏆 FINISH GAME" : "NEXT ROUND"}
        </button>
      </section>
    </main>
  );
}

export default RoundResult;
