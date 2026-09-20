import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../services/socket";
import AnswerField from "../components/game/AnswerField";
import PlayerSubmissionStatus from "../components/game/PlayerSubmissionStatus";
import { ANSWER_FIELDS, DEFAULT_TIME_LIMIT } from "../constants/game";

const EMPTY_ANSWERS = {
  name: "",
  place: "",
  thing: "",
  animal: "",
  food: "",
};

function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const gameData = location.state;

  const [timeLeft, setTimeLeft] = useState(gameData?.timeLimit || DEFAULT_TIME_LIMIT);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPlayers, setSubmittedPlayers] = useState([]);

  useEffect(() => {
    if (!gameData || submitted) return undefined;

    if (timeLeft <= 0) {
      setSubmitted(true);
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => previousTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameData, submitted]);

  useEffect(() => {
    const handlePlayerSubmitted = (playerData) => {
      setSubmittedPlayers((previousPlayers) => {
        if (previousPlayers.includes(playerData.playerId)) return previousPlayers;
        return [...previousPlayers, playerData.playerId];
      });
    };

    socket.on("playerSubmitted", handlePlayerSubmitted);
    return () => socket.off("playerSubmitted", handlePlayerSubmitted);
  }, []);

  useEffect(() => {
    const handleRoundEnded = (roundData) => {
      setSubmitted(true);
      navigate("/round-result", { state: { ...gameData, ...roundData } });
    };

    socket.on("roundEnded", handleRoundEnded);
    return () => socket.off("roundEnded", handleRoundEnded);
  }, [gameData, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAnswers((previousAnswers) => ({ ...previousAnswers, [name]: value }));
  };

  const handleSubmit = () => {
    if (!gameData || submitted || timeLeft <= 0) return;

    socket.emit("submitAnswers", {
      roomCode: gameData.roomCode,
      answers,
      submittedAt: Date.now(),
    });

    setSubmitted(true);
  };

  if (!gameData) {
    return (
      <main className="room-container">
        <section className="room-card">
          <div className="room-icon">🎮</div>
          <h1>Game data not found</h1>
          <p className="room-subtitle">This game session is no longer available.</p>
          <button className="main-room-btn" type="button" onClick={() => navigate("/")}>
            BACK TO HOME
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="game-container">
      <section className="game-card">
        <header className="game-header">
          <div>
            <h1>Alphabet Rush</h1>
            <p>Round {gameData.currentRound} / {gameData.totalRounds}</p>
          </div>

          <div className={timeLeft <= 10 ? "timer timer-warning" : "timer"}>
            <span>⏱️ {timeLeft}s</span>
            {timeLeft <= 10 && timeLeft > 0 && <small>Hurry!</small>}
          </div>
        </header>

        <section className="letter-section" aria-label="Round letter">
          <span>YOUR LETTER</span>
          <div className="letter">{gameData.letter}</div>
        </section>

        <PlayerSubmissionStatus submittedCount={submittedPlayers.length} />

        <section className="answers-section" aria-label="Answer fields">
          {ANSWER_FIELDS.map((field) => (
            <AnswerField
              key={field.name}
              {...field}
              value={answers[field.name]}
              onChange={handleChange}
              disabled={submitted}
            />
          ))}
        </section>

        <button
          className="submit-answers-btn"
          type="button"
          onClick={handleSubmit}
          disabled={submitted}
        >
          {submitted
            ? timeLeft === 0
              ? "TIME'S UP"
              : "ANSWERS SUBMITTED"
            : "SUBMIT ANSWERS"}
        </button>
      </section>
    </main>
  );
}

export default Game;
