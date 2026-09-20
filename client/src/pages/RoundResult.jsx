import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

function RoundResult() {
  const location = useLocation();
  const navigate = useNavigate();

  const resultData = location.state;

  useEffect(() => {
    const handleGameStarted = (gameData) => {
      navigate("/game", {
        state: gameData,
      });
    };

    const handleGameOver = (gameData) => {
      navigate("/leaderboard", {
        state: gameData,
      });
    };

    socket.on("gameStarted", handleGameStarted);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameOver", handleGameOver);
    };
  }, [navigate]);

  if (!resultData) {
    return <h2>Result data not found</h2>;
  }

  const isLastRound =
    resultData.currentRound >= resultData.totalRounds;

  return (
    <div className="room-container">
      <div className="waiting-card">

        <div className="room-icon">🏆</div>

        <h1>
          Round {resultData.currentRound} Result
        </h1>

        <p className="room-subtitle">
          The round has ended!
        </p>

        <div className="waiting-message">
          🏆 Winner:{" "}
          <strong>
            {resultData.winnerName || "No Winner"}
          </strong>
        </div>

{resultData.winnerId === null && (
  <div className="waiting-message">
    ❌ No winner this round
  </div>
)}
        <div className="waiting-message">
          🎯 Letter:{" "}
          <strong>{resultData.letter}</strong>
        </div>

        <div className="players-section">
          <div className="section-title">
            <h2>Scores</h2>
          </div>

          <div className="player-list">
            {resultData.players?.map((player, index) => (
              <div
                className="player-card"
                key={player.id}
              >
                <div className="player-avatar">
                  {index + 1}
                </div>

                <div className="player-info">
                  <strong>{player.name}</strong>

                  <small>
                    {player.score}{" "}
                    {player.score === 1
                      ? "Point"
                      : "Points"}
                  </small>
                </div>

                <div className="host-badge">
                  ⭐ {player.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isLastRound && (
          <button
            className="start-game-btn"
            onClick={() => {
              socket.emit("nextRound", {
                roomCode: resultData.roomCode,
              });
            }}
          >
            NEXT ROUND
          </button>
        )}

        {isLastRound && (
          <button
            className="start-game-btn"
            onClick={() => {
              socket.emit("nextRound", {
                roomCode: resultData.roomCode,
              });
            }}
          >
            🏆 FINISH GAME
          </button>
        )}

      </div>
    </div>
  );
}

export default RoundResult;