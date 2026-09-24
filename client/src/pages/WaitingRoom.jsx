import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import PlayerList from "../components/rooms/PlayerList";
import RoomCode from "../components/rooms/RoomCode";
import { GAME_MODES, MAX_PLAYERS } from "../constants/game";

function WaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const roomData = location.state;
  const [players, setPlayers] = useState(roomData?.players || []);

  useEffect(() => {
    if (!roomData) {
      navigate("/");
      return undefined;
    }

    const handleRoomUpdate = (updatedRoom) => setPlayers(updatedRoom.players || []);
    const handleGameStarted = (gameData) => navigate("/game", { state: gameData });

    socket.on("roomUpdated", handleRoomUpdate);
    socket.on("gameStarted", handleGameStarted);

    return () => {
      socket.off("roomUpdated", handleRoomUpdate);
      socket.off("gameStarted", handleGameStarted);
    };
  }, [roomData, navigate]);

  if (!roomData) return null;

  return (
    <main className="room-container">
      <section className="waiting-card">
        <div className="waiting-header">
          <div className="room-icon" aria-hidden="true">🎮</div>
          <div>
            <h1>Waiting Room</h1>
            <p>Get your friends ready!</p>
          </div>
        </div>

        <RoomCode roomCode={roomData.roomCode} />

        <section className="players-section">
          <div className="section-title">
            <h2>Players</h2>
            <span>{players.length} / {MAX_PLAYERS}</span>
          </div>
          <PlayerList players={players} showHost />
        </section>

        <div className="waiting-message">⏳ Waiting for other players to join...</div>
        <div className="room-info-grid">
          <div className="round-info">🎯 {roomData.rounds} Rounds</div>
          <div className="round-info">
            {(() => {
              const mode = GAME_MODES.find((item) => item.id === roomData.gameMode) || GAME_MODES[0];
              return <>{mode.icon} {mode.name}</>;
            })()}
          </div>
        </div>

        <button
          className="start-game-btn"
          type="button"
          onClick={() => socket.emit("startGame", { roomCode: roomData.roomCode })}
        >
          START GAME
        </button>

        <button className="leave-btn" type="button" onClick={() => navigate("/")}>
          ← Leave Room
        </button>
      </section>
    </main>
  );
}

export default WaitingRoom;
