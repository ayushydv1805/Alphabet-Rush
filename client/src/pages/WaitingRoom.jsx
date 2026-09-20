import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import socket from "../socket";
function WaitingRoom() {

  const navigate = useNavigate();

  const location = useLocation();

  const roomData = location.state;

  const [players, setPlayers] = useState(
    roomData?.players || []
  );

  useEffect(() => {
  if (!roomData) {
    navigate("/");
    return;
  }

  const handleRoomUpdate = (updatedRoom) => {
    setPlayers(updatedRoom.players);
  };

  const handleGameStarted = (gameData) => {
    navigate("/game", {
      state: gameData,
    });
  };

  socket.on("roomUpdated", handleRoomUpdate);
  socket.on("gameStarted", handleGameStarted);

  return () => {
    socket.off("roomUpdated", handleRoomUpdate);
    socket.off("gameStarted", handleGameStarted);
  };
}, [roomData, navigate]);

  if (!roomData) {
    return null;
  }

  const roomCode = roomData.roomCode;

  const rounds = roomData.rounds;
  return (
    <div className="room-container">
      <div className="waiting-card">

        <div className="waiting-header">
          <div className="room-icon">🎮</div>

          <div>
            <h1>Waiting Room</h1>
            <p>Get your friends ready!</p>
          </div>
        </div>

        <div className="code-section">

          <span>ROOM CODE</span>

          <div className="code-box">
            <strong>{roomCode}</strong>

            <button
              className="copy-btn"
              onClick={() =>
                navigator.clipboard.writeText(roomCode)
              }
            >
              📋
            </button>
          </div>

          <small>
            Share this code with your friends
          </small>

        </div>

        <div className="players-section">

          <div className="section-title">
            <h2>Players</h2>
            <span>{players.length} / 10</span>
          </div>

          <div className="player-list">

            {players.map((player, index) => (
              <div
                className="player-card"
                key={player.id}
              >

                <div className="player-avatar">
                  {player.name.charAt(0).toUpperCase()}
                </div>

                <div className="player-info">
                  <strong>{player.name}</strong>

                  <small>
                    {index === 0 ? "Host" : "Player"}
                  </small>
                </div>

                {index === 0 && (
                  <div className="host-badge">
                    👑 HOST
                  </div>
                )}

              </div>
            ))}

          </div>

        </div>

        <div className="waiting-message">
          ⏳ Waiting for other players to join...
        </div>

        <div className="round-info">
          🎯 {rounds} Rounds
        </div>

        <button
  className="start-game-btn"
  onClick={() => {
    socket.emit("startGame", {
      roomCode: roomCode,
    });
  }}
>
  START GAME
</button>

        <button
          className="leave-btn"
          onClick={() => navigate("/")}
        >
          ← Leave Room
        </button>

      </div>
    </div>
  );
}

export default WaitingRoom;