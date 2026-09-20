import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { ROUND_OPTIONS } from "../constants/game";

function CreateRoom() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [rounds, setRounds] = useState(10);

  const handleCreateRoom = (event) => {
    event.preventDefault();
    const name = playerName.trim();

    if (!name) {
      alert("Please enter your name");
      return;
    }

    socket.once("roomCreated", (roomData) => {
      navigate("/waiting-room", { state: roomData });
    });

    socket.emit("createRoom", { playerName: name, rounds });
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

          <label>NUMBER OF ROUNDS</label>
          <div className="round-options">
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

          <button className="main-room-btn" type="submit">CREATE ROOM</button>
        </form>

        <button className="back-btn" type="button" onClick={() => navigate("/")}>
          ← Back
        </button>
      </section>
    </main>
  );
}

export default CreateRoom;
