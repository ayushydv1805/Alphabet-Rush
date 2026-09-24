import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { ROUND_OPTIONS } from "../constants/game";
import { getAvatar, getProfile, getTitle, updateProfile } from "../services/profile";

function CreateRoom() {
  const navigate = useNavigate();
  const savedProfile = getProfile();
  const [playerName, setPlayerName] = useState(savedProfile.name || "");
  const [rounds, setRounds] = useState(10);

  const handleCreateRoom = (event) => {
    event.preventDefault();
    const name = playerName.trim();

    if (!name) {
      alert("Please enter your name");
      return;
    }

    const profile = updateProfile({ name });
    const avatar = getAvatar(profile.avatarId);
    const title = getTitle(profile.titleId);

    socket.once("roomCreated", (roomData) => {
      navigate("/waiting-room", { state: roomData });
    });

    socket.emit("createRoom", {
      playerName: name,
      rounds,
      profile: {
        avatar: avatar.icon,
        title: title.name,
      },
    });
  };

  return (
    <main className="room-container">
      <section className="room-card">
        <div className="room-icon" aria-hidden="true">{getAvatar(savedProfile.avatarId).icon}</div>
        <h1>Create Room</h1>
        <p className="room-subtitle">
          Create a room and invite your friends.
        </p>

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

          <div className="profile-preview-strip">
            <span>{getAvatar(savedProfile.avatarId).icon}</span>
            <div>
              <strong>{getTitle(savedProfile.titleId).name}</strong>
              <small>Your profile cosmetics will appear in the match.</small>
            </div>
            <button type="button" className="profile-preview-link" onClick={() => navigate("/profile")}>
              EDIT
            </button>
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
