import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";

function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const gameData = location.state;

  const [timeLeft, setTimeLeft] = useState(gameData?.timeLimit || 60);
  const [answers, setAnswers] = useState({
    name: "",
    place: "",
    thing: "",
    animal: "",
    food: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedPlayers, setSubmittedPlayers] = useState([]);

  useEffect(() => {
    if (!gameData || submitted) {
      return;
    }

    if (timeLeft <= 0) {
      setSubmitted(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => previousTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameData, submitted]);

  useEffect(() => {
    const handlePlayerSubmitted = (playerData) => {
      setSubmittedPlayers((previousPlayers) => {
        if (previousPlayers.includes(playerData.playerId)) {
          return previousPlayers;
        }

        return [...previousPlayers, playerData.playerId];
      });
    };

    socket.on("playerSubmitted", handlePlayerSubmitted);

    return () => {
      socket.off("playerSubmitted", handlePlayerSubmitted);
    };
  }, []);

  useEffect(() => {
    const handleRoundEnded = (roundData) => {
      setSubmitted(true);

      navigate("/round-result", {
        state: {
          ...gameData,
          ...roundData,
        },
      });
    };

    socket.on("roundEnded", handleRoundEnded);

    return () => {
      socket.off("roundEnded", handleRoundEnded);
    };
  }, [gameData, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (submitted || timeLeft <= 0) {
      return;
    }

    socket.emit("submitAnswers", {
      roomCode: gameData.roomCode,
      answers,
      submittedAt: Date.now(),
    });

    setSubmitted(true);
  };

  if (!gameData) {
    return (
      <div className="room-container">
        <div className="room-card">
          <div className="room-icon">🎮</div>
          <h1>Game data not found</h1>
          <p className="room-subtitle">
            This game session is no longer available.
          </p>
          <button className="main-room-btn" onClick={() => navigate("/")}>
            BACK TO HOME
          </button>
        </div>
      </div>
    );
  }

  const fields = [
    { name: "name", label: "Name", placeholder: "Enter a name" },
    { name: "place", label: "Place", placeholder: "Enter a place" },
    { name: "thing", label: "Thing", placeholder: "Enter a thing" },
    { name: "animal", label: "Animal", placeholder: "Enter an animal" },
    { name: "food", label: "Food", placeholder: "Enter a food" },
  ];

  return (
    <div className="game-container">
      <div className="game-card">
        <div className="game-header">
          <div>
            <h1>Alphabet Rush</h1>
            <p>
              Round {gameData.currentRound} / {gameData.totalRounds}
            </p>
          </div>

          <div className={timeLeft <= 10 ? "timer timer-warning" : "timer"}>
            <span>⏱️ {timeLeft}s</span>
            {timeLeft <= 10 && timeLeft > 0 && (
              <small>Hurry!</small>
            )}
          </div>
        </div>

        <div className="letter-section">
          <span>YOUR LETTER</span>
          <div className="letter">{gameData.letter}</div>
        </div>

        <div className="submission-status">
          <strong>Players Status</strong>
          <p>
            <span className="status-dot" aria-hidden="true" />
            {submittedPlayers.length} player
            {submittedPlayers.length !== 1 ? "s" : ""} submitted
          </p>
        </div>

        <div className="answers-section">
          {fields.map((field) => (
            <div className="answer-field" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                type="text"
                name={field.name}
                placeholder={field.placeholder}
                value={answers[field.name]}
                onChange={handleChange}
                disabled={submitted}
                autoComplete="off"
              />
            </div>
          ))}
        </div>

        <button
          className="submit-answers-btn"
          onClick={handleSubmit}
          disabled={submitted}
        >
          {submitted
            ? timeLeft === 0
              ? "TIME'S UP"
              : "ANSWERS SUBMITTED"
            : "SUBMIT ANSWERS"}
        </button>
      </div>
    </div>
  );
}

export default Game;
