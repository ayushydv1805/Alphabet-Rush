import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";

function CreateRoom() {
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState("");
  const [rounds, setRounds] = useState(10);

  const handleCreateRoom = (e) => {
    e.preventDefault();

    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    socket.emit("createRoom", {
      playerName: playerName.trim(),
      rounds: rounds,
    });

    socket.once("roomCreated", (roomData) => {
      navigate("/waiting-room", {
        state: roomData,
      });
    });
  };

  return (
    <div className="room-container">
      <div className="room-card">

        <div className="room-icon">🎮</div>

        <h1>Create Room</h1>

        <p className="room-subtitle">
          Create a room and invite your friends
        </p>

        <form onSubmit={handleCreateRoom}>

          <label>YOUR NAME</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />

          <label>NUMBER OF ROUNDS</label>

          <div className="round-options">
            {[5, 10, 15, 20].map((number) => (
              <button
                type="button"
                key={number}
                className={
                  rounds === number
                    ? "round selected"
                    : "round"
                }
                onClick={() => setRounds(number)}
              >
                {number}
              </button>
            ))}
          </div>

          <button
            className="main-room-btn"
            type="submit"
          >
            CREATE ROOM
          </button>

        </form>

        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

      </div>
    </div>
  );
}

export default CreateRoom;