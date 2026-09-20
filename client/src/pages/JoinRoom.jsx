import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";

function JoinRoom() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    const handleRoomJoined = (roomData) => navigate("/waiting-room", { state: roomData });
    const handleJoinError = (message) => alert(message);

    socket.on("roomJoined", handleRoomJoined);
    socket.on("joinError", handleJoinError);

    return () => {
      socket.off("roomJoined", handleRoomJoined);
      socket.off("joinError", handleJoinError);
    };
  }, [navigate]);

  const handleJoinRoom = (event) => {
    event.preventDefault();

    const name = playerName.trim();
    const code = roomCode.trim().toUpperCase();

    if (!name) {
      alert("Please enter your name");
      return;
    }

    if (!code) {
      alert("Please enter room code");
      return;
    }

    socket.emit("joinRoom", { playerName: name, roomCode: code });
  };

  return (
    <main className="room-container">
      <section className="room-card">
        <div className="room-icon" aria-hidden="true">👥</div>
        <h1>Join Room</h1>
        <p className="room-subtitle">Enter the room code to join your friends.</p>

        <form onSubmit={handleJoinRoom}>
          <label htmlFor="join-player-name">YOUR NAME</label>
          <input
            id="join-player-name"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            maxLength={20}
            autoComplete="nickname"
          />

          <label htmlFor="room-code">ROOM CODE</label>
          <input
            id="room-code"
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            maxLength={6}
            autoComplete="off"
            spellCheck="false"
          />

          <button className="main-room-btn" type="submit">JOIN ROOM</button>
        </form>

        <button className="back-btn" type="button" onClick={() => navigate("/")}>
          ← Back
        </button>
      </section>
    </main>
  );
}

export default JoinRoom;
