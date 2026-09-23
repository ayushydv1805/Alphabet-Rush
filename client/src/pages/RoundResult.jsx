import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlayerList from "../components/rooms/PlayerList";
import RoundReveal from "../components/game/RoundReveal";
import { ANSWER_FIELDS } from "../constants/game";
import { playGameSound } from "../services/sound";
import socket from "../services/socket";

function RoundResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultData = location.state;

  useEffect(() => {
    const handleGameStarted = (gameData) => navigate("/game", { state: gameData });
    const handleGameOver = (gameData) => navigate("/leaderboard", { state: gameData });

    socket.on("gameStarted", handleGameStarted);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameOver", handleGameOver);
    };
  }, [navigate]);

  if (!resultData) {
    return (
      <main className="room-container">
        <section className="room-card">
          <div className="room-icon">🏆</div>
          <h1>Result unavailable</h1>
          <p className="room-subtitle">
            This round result is no longer available.
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

  const players = resultData.players || [];
  const me = players.find((player) => player.id === socket.id);
  const isHost = resultData.hostId === socket.id;
  const winnerIds = resultData.winnerIds || [];
  const winnerNames = resultData.winnerNames || [];

  const rankedPlayers = [...players].sort(
    (first, second) =>
      (second.roundPoints || 0) - (first.roundPoints || 0) ||
      second.score - first.score
  );

  const isLastRound =
    resultData.totalRounds != null &&
    resultData.currentRound >= resultData.totalRounds;

  return (
    <main className="room-container">
      <section className="waiting-card result-card">
        <div className="result-hero result-hero-animated">
          <div className="room-icon" aria-hidden="true">🏆</div>
          <p className="home-eyebrow">ROUND COMPLETE</p>
          <h1>Round {resultData.currentRound} Results</h1>
          <p className="room-subtitle">
            Letter <strong>{resultData.letter}</strong>
            {resultData.endReason === "time-up"
              ? " · Time's up"
              : " · Everyone submitted"}
          </p>
        </div>

        <div className="round-winner-banner winner-banner-pop">
          <span className="round-winner-icon" aria-hidden="true">👑</span>
          <div>
            <small>
              ROUND WINNER{winnerNames.length > 1 ? "S" : ""}
            </small>
            <strong>
              {winnerNames.length
                ? winnerNames.join(" · ")
                : "No scored winner"}
            </strong>
            {resultData.winningRoundPoints > 0 && (
              <span>
                {resultData.winningRoundPoints} / {ANSWER_FIELDS.length} correct
              </span>
            )}
          </div>
        </div>

        {me ? (
          <div className="my-round-score-card score-pop">
            <div>
              <span>YOUR ROUND SCORE</span>
              <strong>+{me.roundPoints || 0}</strong>
            </div>
            <div className="my-round-score-total">
              <span>OVERALL</span>
              <strong>{me.score}</strong>
            </div>
          </div>
        ) : null}

        {me ? (
          <section className="answer-review">
            <div className="section-title">
              <h2>Your answers</h2>
              <span>
                {me.roundPoints} / {ANSWER_FIELDS.length} correct
              </span>
            </div>

            <div className="answer-review-grid">
              {ANSWER_FIELDS.map((field, index) => {
                const value = me.answers?.[field.name] || "";
                const isCorrect = Boolean(me.validation?.[field.name]);

                return (
                  <article
                    className={
                      isCorrect
                        ? "review-card correct review-card-animated"
                        : "review-card incorrect review-card-animated"
                    }
                    style={{ animationDelay: index * 70 + "ms" }}
                    key={field.name}
                  >
                    <div className="review-card-top">
                      <span>{field.label}</span>
                      <strong>{isCorrect ? "✓ RIGHT" : "✕ WRONG"}</strong>
                    </div>

                    <p className={value ? "" : "empty-answer"}>
                      {value || "No answer submitted"}
                    </p>

                    <small>
                      {isCorrect
                        ? "Valid category answer for the round letter."
                        : value
                          ? "This answer did not pass the category or starting-letter check."
                          : "Blank answers do not receive a point."}
                    </small>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <RoundReveal
          players={players}
          fields={ANSWER_FIELDS}
          currentPlayerId={socket.id}
        />

        <section className="round-score-section">
          <div className="section-title">
            <h2>Round scoreboard</h2>
            <span>Round points · Overall total</span>
          </div>

          <PlayerList
            players={rankedPlayers}
            showScores
            showRoundPoints
            showRank
            winnerIds={winnerIds}
          />
        </section>

        <div className="result-next-action">
          {isHost ? (
            <button
              className="start-game-btn"
              type="button"
              onClick={() => {
                playGameSound("nextRound");
                socket.emit("nextRound", { roomCode: resultData.roomCode });
              }}
            >
              {isLastRound ? "🏆 FINISH GAME" : "NEXT ROUND →"}
            </button>
          ) : (
            <div className="waiting-message">
              ⏳ Waiting for the host to{" "}
              {isLastRound ? "finish the game" : "start the next round"}...
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default RoundResult;
