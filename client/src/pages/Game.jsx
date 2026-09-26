import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AnswerField from "../components/game/AnswerField";
import PlayerSubmissionStatus from "../components/game/PlayerSubmissionStatus";
import { ANSWER_FIELDS, DEFAULT_TIME_LIMIT, GAME_MODES } from "../constants/game";
import { playGameSound } from "../services/sound";
import { getAvatar, getProfile } from "../services/profile";
import socket from "../services/socket";

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

  const totalTime = gameData?.timeLimit || DEFAULT_TIME_LIMIT;
  const mode = GAME_MODES.find((item) => item.id === gameData?.gameMode) || GAME_MODES[0];

  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPlayers, setSubmittedPlayers] = useState([]);
  const [myStreak, setMyStreak] = useState(getProfile().currentStreak);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (!gameData || submitted || timeLeft <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => Math.max(previousTime - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameData, submitted, timeLeft]);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;

    if (timeLeft <= 5) {
      playGameSound("urgent");
    } else if (timeLeft <= 10) {
      playGameSound("tick");
    }
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (!gameData || submitted || timeLeft !== 0) return;
    playGameSound("timeup");
  }, [gameData, submitted, timeLeft]);

  useEffect(() => {
    const handleSubmissionValidated = (payload) => {
      if (payload?.roundId === gameData?.roundId) {
        setValidating(false);
      }
    };

    const handleActionError = () => setValidating(false);

    socket.on("submissionValidated", handleSubmissionValidated);
    socket.on("actionError", handleActionError);

    return () => {
      socket.off("submissionValidated", handleSubmissionValidated);
      socket.off("actionError", handleActionError);
    };
  }, [gameData?.roundId]);

  useEffect(() => {
    const handlePlayerSubmitted = (playerData) => {
      if (playerData.playerId === socket.id && playerData.currentStreak != null) {
        setMyStreak(playerData.currentStreak);
      }

      setSubmittedPlayers((previousPlayers) => {
        if (previousPlayers.some((player) => player.playerId === playerData.playerId)) {
          return previousPlayers;
        }

        return [
          ...previousPlayers,
          {
            playerId: playerData.playerId,
            playerName: playerData.playerName,
          },
        ];
      });
    };

    socket.on("playerSubmitted", handlePlayerSubmitted);
    return () => socket.off("playerSubmitted", handlePlayerSubmitted);
  }, []);

  useEffect(() => {
    const handleRoundEnded = (roundData) => {
      setSubmitted(true);

      if (roundData.winnerIds?.includes(socket.id)) {
        playGameSound("winner");
      } else {
        playGameSound("roundEnd");
      }

      navigate("/round-result", {
        state: {
          ...gameData,
          ...roundData,
        },
      });
    };

    socket.on("roundEnded", handleRoundEnded);
    return () => socket.off("roundEnded", handleRoundEnded);
  }, [gameData, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (!gameData || submitted || timeLeft <= 0 || validating) return;

    if (!socket.connected) {
      return;
    }

    setValidating(true);
    playGameSound("submit");

    socket.emit("submitAnswers", {
      roomCode: gameData.roomCode,
      roundId: gameData.roundId,
      answers,
    });

    setSubmitted(true);
    setSubmittedPlayers((previousPlayers) =>
      previousPlayers.some((player) => player.playerId === socket.id)
        ? previousPlayers
        : [
            ...previousPlayers,
            {
              playerId: socket.id,
              playerName: gameData.playerName || "You",
            },
          ]
    );
  };

  if (!gameData) {
    return (
      <main className="room-container">
        <section className="room-card">
          <div className="room-icon">🎮</div>
          <h1>Game session unavailable</h1>
          <p className="room-subtitle">
            This game session is no longer available. Start a new game from home.
          </p>
          <button
            className="main-room-btn"
            type="button"
            onClick={() => navigate("/")}
          >
            BACK TO HOME
          </button>
        </section>
      </main>
    );
  }

  const submittedCount = submittedPlayers.length;
  const totalPlayers = gameData.totalPlayers || Math.max(submittedCount, 1);
  const progress = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const timerClass =
    timeLeft <= 5
      ? "timer timer-critical"
      : timeLeft <= 10
        ? "timer timer-warning"
        : "timer";

  return (
    <main className="game-container">
      <section className="game-card">
        <header className="game-header">
          <div>
            <div className="game-kicker-row">
              <p className="game-kicker">ALPHABET RUSH</p>
              <span className="mode-pill">{mode.icon} {mode.name}</span>
            </div>
            <h1>Round {gameData.currentRound}</h1>
            <p>
              Round {gameData.currentRound} of {gameData.totalRounds}
            </p>
          </div>

          <div className="game-header-tools">
            <div className="game-player-chip">
              <span>{gameData.avatar || getAvatar(getProfile().avatarId).icon}</span>
              <div>
                <strong>{gameData.playerName || "Player"}</strong>
                <small>Lv. {getProfile().level}</small>
              </div>
            </div>

            {myStreak >= 2 ? (
              <div className="game-streak-chip">
                🔥 {myStreak}
              </div>
            ) : null}

            <div className="timer-wrap">
              <div className={timerClass} aria-live="polite">
                <span>⏱️ {timeLeft}s</span>
                {timeLeft <= 10 && timeLeft > 0 && (
                  <small>{timeLeft <= 5 ? "FINAL SECONDS!" : "Hurry!"}</small>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="timer-progress" aria-hidden="true">
          <span style={{ width: progress + "%" }} />
        </div>

        {timeLeft <= 5 && timeLeft > 0 ? (
          <div className="countdown-rush" role="status" aria-live="assertive">
            <strong>{timeLeft}</strong>
            <span>FINAL SECONDS</span>
          </div>
        ) : null}

        <section className="letter-section" aria-label="Round letter">
          <span>YOUR LETTER</span>
          <div className="letter letter-live">{gameData.letter}</div>
          <p className="letter-hint">
            Every answer must start with {gameData.letter}.\n            {mode.scoreMultiplier > 1 ? " Every valid answer is worth 2 points." : ""}
          </p>
        </section>

        <PlayerSubmissionStatus
          submittedCount={submittedCount}
          totalPlayers={totalPlayers}
          submittedPlayers={submittedPlayers}
        />

        {submitted ? (
          <div className="waiting-message game-waiting-state submission-feedback">
            <strong>{validating ? "🤖 Verifying answers..." : "✅ Answers locked"}</strong>
            <span>
              Waiting for the other players or the timer to finish the round.
            </span>
          </div>
        ) : null}

        <section className="answers-section" aria-label="Answer fields">
          {ANSWER_FIELDS.map((field) => (
            <AnswerField
              key={field.name}
              {...field}
              value={answers[field.name]}
              onChange={handleChange}
              disabled={submitted || timeLeft <= 0}
            />
          ))}
        </section>

        <button
          className="submit-answers-btn"
          type="button"
          onClick={handleSubmit}
          disabled={submitted || timeLeft <= 0}
        >
          {validating
            ? "🤖 VERIFYING ANSWERS..."
            : submitted
              ? "✓ ANSWERS LOCKED"
            : timeLeft <= 0
              ? "TIME'S UP"
              : "SUBMIT ANSWERS"}
        </button>
      </section>
    </main>
  );
}

export default Game;
