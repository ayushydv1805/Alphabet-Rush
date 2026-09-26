import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { getIdentityToken, setIdentityToken } from "../services/identity";
import { getProfile } from "../services/profile";
import { saveActiveSession } from "../services/session";
import { GAME_MODES, ROUND_OPTIONS } from "../constants/game";

function CreateRoom() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [rounds, setRounds] = useState(10);
  const [gameMode, setGameMode] = useState("classic");

  const handleCreateRoom = (event) => {
    event.preventDefault();
    const name = playerName.trim();

    if (!name) {
      alert("Please enter your name");
      return;
    }

    socket.once("roomCreated", (roomData) => {
      setIdentityToken(roomData.identityToken);
      saveActiveSession({
        roomCode: roomData.roomCode,
        gameId: roomData.gameId,
      });
      navigate("/waiting-room", { state: roomData });
    });

    socket.emit("createRoom", {
      playerName: name,
      rounds,
      gameMode,
      identityToken: getIdentityToken(),
      profile: getProfile(),
    });
  };

  return (
    <main className="room-container">
      <section className="room-card">
        <div className="room-icon" aria-hidden="true">🎮</div>
        <h1>Create Room</h1>
        <p className="room-subtitle">Create a room and invite your friends.</p>

        <form onSubmit={handleCreateRoom}>
          <label htmlFor="player-name">YOUR NAME</label>
          <input
            id="player-name"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={20}
            autoComplete="nickname"
          />

          <label htmlFor="round-count">NUMBER OF ROUNDS</label>
          <div id="round-count" className="round-options">
            {ROUND_OPTIONS.map((number) => (
              <button
                type="button"
                key={number}
                className={rounds === number ? "round selected" : "round"}
                onClick={() => setRounds(number)}
                aria-pressed={rounds === number}
              >
                {number}
              </button>
            ))}
          </div>

          <label htmlFor="game-mode">GAME MODE</label>
          <div id="game-mode" className="mode-picker">
            {GAME_MODES.map((mode) => (
              <button
                type="button"
                key={mode.id}
                className={
                  gameMode === mode.id
                    ? "mode-option selected"
                    : "mode-option"
                }
                onClick={() => setGameMode(mode.id)}
                aria-pressed={gameMode === mode.id}
              >
                <span>{mode.icon}</span>
                <strong>{mode.name}</strong>
                <small>{mode.description}</small>
              </button>
            ))}
          </div>

          <button className="main-room-btn" type="submit">
            CREATE ROOM
          </button>
        </form>

        <button className="back-btn" type="button" onClick={() => navigate("/")}>
          ← Back
        </button>
      </section>
    </main>
  );
}

export default CreateRoom;
