import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../socket";
function Game() {
  const location = useLocation();
const navigate = useNavigate();
  const gameData = location.state;

  const [timeLeft, setTimeLeft] = useState(
    gameData?.timeLimit || 60
  );

  const [answers, setAnswers] = useState({
    name: "",
    place: "",
    thing: "",
    animal: "",
    food: "",
  });

  const [submitted, setSubmitted] = useState(false);
const [submittedPlayers, setSubmittedPlayers] = useState([]);
  // =========================
  // TIMER
  // =========================

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

    return () => {
      clearInterval(timer);
    };
  }, [timeLeft, gameData, submitted]);

// =========================
// PLAYER SUBMISSION STATUS
// =========================

useEffect(() => {
  const handlePlayerSubmitted = (playerData) => {
    setSubmittedPlayers((previousPlayers) => {
      if (previousPlayers.includes(playerData.playerId)) {
        return previousPlayers;
      }

      return [
        ...previousPlayers,
        playerData.playerId,
      ];
    });
  };

  socket.on("playerSubmitted", handlePlayerSubmitted);

  return () => {
    socket.off("playerSubmitted", handlePlayerSubmitted);
  };
}, []);
    
// =========================
// ROUND END
// =========================

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
  // =========================
  // INPUT CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAnswers({
      ...answers,
      [name]: value,
    });
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = () => {
  if (submitted || timeLeft <= 0) {
    return;
  }

  socket.emit("submitAnswers", {
    roomCode: gameData.roomCode,
    answers: answers,
    submittedAt: Date.now(),
  });

  setSubmitted(true);
};

  if (!gameData) {
    return <h2>Game data not found</h2>;
  }

  return (
    <div className="game-container">
      <div className="game-card">

        {/* GAME HEADER */}

        <div className="game-header">
          <div>
            <h1>Alphabet Rush</h1>

            <p>
              Round {gameData.currentRound} /{" "}
              {gameData.totalRounds}
            </p>
          </div>

         <div
  className={
    timeLeft <= 10
      ? "timer timer-warning"
      : "timer"
  }
>
  ⏱️ {timeLeft}

  {timeLeft <= 10 && timeLeft > 0 && (
    <small>Hurry! {timeLeft}s left</small>
  )}
</div>
        </div>

        {/* LETTER */}

        <div className="letter-section">
          <span>YOUR LETTER</span>

          <div className="letter">
            {gameData.letter}
          </div>
        </div>

        <div className="submission-status">
  <strong>Players Status</strong>

  <p>
    🟢 {submittedPlayers.length} player
    {submittedPlayers.length !== 1 ? "s" : ""} submitted
  </p>
</div>

        {/* ANSWERS */}

        <div className="answers-section">

          <label>Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter a name"
            value={answers.name}
            onChange={handleChange}
            disabled={submitted}
          />

          <label>Place</label>

          <input
            type="text"
            name="place"
            placeholder="Enter a place"
            value={answers.place}
            onChange={handleChange}
            disabled={submitted}
          />

          <label>Thing</label>

          <input
            type="text"
            name="thing"
            placeholder="Enter a thing"
            value={answers.thing}
            onChange={handleChange}
            disabled={submitted}
          />

          <label>Animal</label>

          <input
            type="text"
            name="animal"
            placeholder="Enter an animal"
            value={answers.animal}
            onChange={handleChange}
            disabled={submitted}
          />

          <label>Food</label>

          <input
            type="text"
            name="food"
            placeholder="Enter a food"
            value={answers.food}
            onChange={handleChange}
            disabled={submitted}
          />

        </div>

        {/* SUBMIT */}

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