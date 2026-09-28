import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import PlayerList from "../components/rooms/PlayerList";
import RoomCode from "../components/rooms/RoomCode";
import { GAME_MODES, MAX_PLAYERS } from "../constants/game";
import { clearActiveSession } from "../services/session";

function WaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const roomData = location.state;

  const [players, setPlayers] = useState(roomData?.players || []);
  const [hostId, setHostId] = useState(roomData?.hostId || "");

  useEffect(() => {
    if (!roomData) {
      navigate("/");
      return undefined;
    }

    const handleRoomUpdate = (updatedRoom) => {
      setPlayers(updatedRoom.players || []);
      setHostId(updatedRoom.hostId || "");
    };

    const handleGameStarted = (gameData) => {
      navigate("/game", { state: gameData });
    };

    socket.on("roomUpdated", handleRoomUpdate);
    socket.on("gameStarted", handleGameStarted);

    return () => {
      socket.off("roomUpdated", handleRoomUpdate);
      socket.off("gameStarted", handleGameStarted);
    };
  }, [roomData, navigate]);

  if (!roomData) return null;

  const mode =
    GAME_MODES.find((item) => item.id === roomData.gameMode) ||
    GAME_MODES[0];
  const isHost = hostId === socket.id;
  const connectedPlayers = players.filter(
    (player) => player.connected !== false
  ).length;
  const canStart = isHost && connectedPlayers > 0;

  return (
    <main className="room-container waiting-room-page">
      <section className="waiting-card">
        <div className="waiting-header">
          <div className="room-icon" aria-hidden="true">🎮</div>
          <div>
            <span className="page-kicker">PRIVATE MATCH</span>
            <h1>Waiting Room</h1>
            <p>
              {isHost
                ? "You are the host. Start when everyone is ready."
                : "Share the code and wait for the host to start."}
            </p>
          </div>
        </div>

        <RoomCode roomCode={roomData.roomCode} />

        <div className="waiting-status-row">
          <div className="waiting-live-pill">
            <span className="status-dot" aria-hidden="true" />
            {connectedPlayers} online
          </div>
          <div className="waiting-mode-pill">
            {mode.icon} {mode.name}
          </div>
          <div className="waiting-round-pill">
            🎯 {roomData.rounds} rounds
          </div>
        </div>

        <section className="players-section">
          <div className="section-title">
            <h2>Players</h2>
            <span>{connectedPlayers} / {MAX_PLAYERS}</span>
          </div>
          <PlayerList players={players} showHost />
        </section>

        <div className="waiting-message">
          {isHost
            ? connectedPlayers > 1
              ? "🔥 Your lobby is ready."
              : "⏳ Waiting for your friends to join..."
            : "⏳ Waiting for the host to start..."}
        </div>

        <button
          className="start-game-btn"
          type="button"
          disabled={!canStart}
          onClick={() =>
            socket.emit("startGame", { roomCode: roomData.roomCode })
          }
        >
          {isHost ? "START GAME" : "🔒 WAITING FOR HOST"}
        </button>

        <button
          className="leave-btn"
          type="button"
          onClick={() => {
            clearActiveSession();
            navigate("/");
          }}
        >
          ← Leave Room
        </button>
      </section>
    </main>
  );
}

export default WaitingRoom;
