import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { getIdentityToken, setIdentityToken } from "../services/identity";
import { getProfile } from "../services/profile";
import { saveActiveSession } from "../services/session";

function JoinRoom() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(() => getProfile().name || "");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const handleRoomJoined = (roomData) => {
      setJoining(false);
      setError("");
      setIdentityToken(roomData.identityToken);
      saveActiveSession({
        roomCode: roomData.roomCode,
        gameId: roomData.gameId,
      });
      navigate("/waiting-room", { state: roomData });
    };

    const handleJoinError = (message) => {
      setJoining(false);
      setError(
        typeof message === "string" ? message : "Unable to join the room."
      );
    };

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
      setError("Please enter your name.");
      return;
    }

    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError("Room code must be exactly 6 characters.");
      return;
    }

    if (!socket.connected) {
      setError("Connecting to the game server. Please try again.");
      return;
    }

    setError("");
    setJoining(true);

    socket.emit("joinRoom", {
      playerName: name,
      roomCode: code,
      identityToken: getIdentityToken(),
      profile: getProfile(),
    });
  };

  return (
    <main className="room-container form-page">
      <section className="room-card">
        <div className="form-topbar">
          <button className="form-back" type="button" onClick={() => navigate("/")}>
            ← HOME
          </button>
          <span className="form-status">JOIN A MATCH</span>
        </div>

        <div className="room-icon" aria-hidden="true">👥</div>
        <p className="page-kicker">ENTER THE LOBBY</p>
        <h1>Join Room</h1>
        <p className="room-subtitle">
          Enter the six-character room code shared by your host.
        </p>

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <form onSubmit={handleJoinRoom}>
          <label htmlFor="join-player-name">YOUR NAME</label>
          <input
            id="join-player-name"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(event) => {
              setError("");
              setPlayerName(event.target.value);
            }}
            maxLength={20}
            autoComplete="nickname"
            disabled={joining}
          />

          <label htmlFor="room-code">ROOM CODE</label>
          <input
            id="room-code"
            type="text"
            placeholder="ABC123"
            value={roomCode}
            onChange={(event) => {
              setError("");
              setRoomCode(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 6)
              );
            }}
            maxLength={6}
            autoComplete="off"
            spellCheck="false"
            inputMode="text"
            aria-describedby="room-code-help"
            disabled={joining}
          />
          <small id="room-code-help" className="input-helper">
            6 letters or numbers · shared by your host
          </small>

          <button className="main-room-btn" type="submit" disabled={joining}>
            {joining ? "JOINING ROOM..." : "JOIN ROOM"}
          </button>
        </form>

        <p className="form-footnote">Private room · Up to 10 players</p>
      </section>
    </main>
  );
}

export default JoinRoom;