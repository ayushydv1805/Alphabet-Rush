import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import { getIdentityToken, setIdentityToken } from "../services/identity";
import { getProfile } from "../services/profile";
import { saveActiveSession } from "../services/session";
import { CATEGORY_PACKS } from "../constants/categoryPacks";
import { GAME_MODES, ROUND_OPTIONS } from "../constants/game";

function CreateRoom() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(() => getProfile().name || "");
  const [rounds, setRounds] = useState(10);
  const [gameMode, setGameMode] = useState("classic");
  const [categoryPack, setCategoryPack] = useState("classic");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleRoomCreated = (roomData) => {
      setCreating(false);
      setError("");
      setIdentityToken(roomData.identityToken);
      saveActiveSession({
        roomCode: roomData.roomCode,
        gameId: roomData.gameId,
      });
      navigate("/waiting-room", { state: roomData });
    };

    const handleCreateError = (message) => {
      setCreating(false);
      setError(
        typeof message === "string" ? message : "Unable to create the room."
      );
    };

    socket.on("roomCreated", handleRoomCreated);
    socket.on("createError", handleCreateError);

    return () => {
      socket.off("roomCreated", handleRoomCreated);
      socket.off("createError", handleCreateError);
    };
  }, [navigate]);

  const handleCreateRoom = (event) => {
    event.preventDefault();
    const name = playerName.trim();

    if (!name) {
      setError("Please enter your name.");
      return;
    }

    if (!socket.connected) {
      setError("Connecting to the game server. Please try again.");
      return;
    }

    setError("");
    setCreating(true);

    socket.emit("createRoom", {
      playerName: name,
      rounds,
      gameMode,
      categoryPack,
      identityToken: getIdentityToken(),
      profile: getProfile(),
    });
  };

  return (
    <main className="room-container form-page">
      <section className="room-card">
        <div className="form-topbar">
          <button
            className="form-back"
            type="button"
            onClick={() => navigate("/")}
          >
            ← HOME
          </button>
          <span className="form-status">PRIVATE MATCH</span>
        </div>

        <div className="room-icon" aria-hidden="true">🎮</div>
        <p className="page-kicker">BUILD YOUR LOBBY</p>
        <h1>Create Room</h1>
        <p className="room-subtitle">
          Choose the rules, game mode and challenge pack, then send the code
          to your friends.
        </p>

        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleCreateRoom}>
          <label htmlFor="player-name">YOUR NAME</label>
          <input
            id="player-name"
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(event) => {
              setError("");
              setPlayerName(event.target.value);
            }}
            maxLength={20}
            autoComplete="nickname"
            disabled={creating}
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
                disabled={creating}
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
                disabled={creating}
              >
                <span>{mode.icon}</span>
                <strong>{mode.name}</strong>
                <small>{mode.description}</small>
              </button>
            ))}
          </div>

          <label htmlFor="category-pack">CHALLENGE PACK</label>
          <div id="category-pack" className="category-pack-grid">
            {CATEGORY_PACKS.map((pack) => (
              <button
                type="button"
                key={pack.id}
                className={
                  categoryPack === pack.id
                    ? "category-pack-option selected"
                    : "category-pack-option"
                }
                onClick={() => setCategoryPack(pack.id)}
                aria-pressed={categoryPack === pack.id}
                disabled={creating}
              >
                <span className="category-pack-icon">{pack.icon}</span>
                <strong>{pack.name}</strong>
                <small>{pack.description}</small>
              </button>
            ))}
          </div>

          <div className="selected-pack-preview">
            <span>{CATEGORY_PACKS.find((pack) => pack.id === categoryPack)?.icon}</span>
            <div>
              <strong>
                {CATEGORY_PACKS.find((pack) => pack.id === categoryPack)?.name}
              </strong>
              <small>
                {CATEGORY_PACKS.find((pack) => pack.id === categoryPack)
                  ?.categories.map((field) => field.label)
                  .join(" · ")}
              </small>
            </div>
          </div>

          <button className="main-room-btn" type="submit" disabled={creating}>
            {creating ? "CREATING ROOM..." : "CREATE ROOM"}
          </button>
        </form>

        <p className="form-footnote">
          Rooms are private and support up to 10 players.
        </p>
      </section>
    </main>
  );
}

export default CreateRoom;
