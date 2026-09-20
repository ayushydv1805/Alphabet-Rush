import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

function Leaderboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const gameData = location.state;

  useEffect(() => {
    const handleGameStarted = (gameData) => {
      navigate("/game", {
        state: gameData,
      });
    };

    socket.on("gameStarted", handleGameStarted);

    return () => {
      socket.off("gameStarted", handleGameStarted);
    };
  }, [navigate]);

  if (!gameData) {
    return <h2>Game data not found</h2>;
  }

  const players = [...(gameData.players || [])].sort(
    (a, b) => b.score - a.score
  );

  const winner = players[0];

  return (
    <div className="room-container">
      <div className="waiting-card">

        <div className="room-icon">🏆</div>

        <h1>Game Over!</h1>

        <p className="room-subtitle">
          Final Results
        </p>

        {winner && (
          <div className="waiting-message">
            👑 Winner:{" "}
            <strong>{winner.name}</strong>
          </div>
        )}

        <div className="players-section">
          <div className="section-title">
            <h2>Final Leaderboard</h2>
          </div>

          <div className="player-list">
            {players.map((player, index) => (
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

        <button 
  className="start-game-btn" 
  onClick={() => { 
    console.log("PLAY AGAIN CLICKED");

    socket.emit("rematch", { 
      roomCode: gameData.roomCode, 
    }); 
  }} 
> 
  🔄 PLAY AGAIN 
</button>

        <button
          className="leave-btn"
          onClick={() => navigate("/")}
        >
          🏠 BACK TO HOME
        </button>

      </div>
    </div>
  );
}

export default Leaderboard;