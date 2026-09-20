import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
function JoinRoom() {
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const handleJoinRoom = (e) => {
  e.preventDefault();

  if (!playerName.trim()) {
    alert("Please enter your name");
    return;
  }

  if (!roomCode.trim()) {
    alert("Please enter room code");
    return;
  }

  socket.once("roomJoined", (roomData) => {
    navigate("/waiting-room", {
      state: roomData,
    });
  });

  socket.once("joinError", (message) => {
    alert(message);
  });

  socket.emit("joinRoom", {
    playerName: playerName.trim(),
    roomCode: roomCode.trim().toUpperCase(),
  });
};

  return (
    <div className="room-container">
      <div className="room-card">

        <div className="room-icon">👥</div>

        <h1>Join Room</h1>

        <p className="room-subtitle">
          Enter the room code to join your friends
        </p>

        <form onSubmit={handleJoinRoom}>

          <label>YOUR NAME</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
          />

          <label>ROOM CODE</label>

          <input
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
          />

          <button className="main-room-btn" type="submit">
            JOIN ROOM
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

export default JoinRoom;