import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlayerList from "../components/rooms/PlayerList";
import RoundReveal from "../components/game/RoundReveal";
import { ANSWER_FIELDS } from "../constants/game";
import { playGameSound } from "../services/sound";
import {
  getLevelFromXp,
  getProfile,
  getRoundXp,
  recordRoundResult,
} from "../services/profile";
import socket from "../services/socket";

function getRoundAwards(me, winnerIds, submitSeconds) {
  if (!me) return [];

  const awards = [];

  if ((me.roundPoints || 0) === ANSWER_FIELDS.length) {
    awards.push({
      icon: "🎯",
      title: "PERFECT ROUND",
      text: "All 5 categories were correct.",
    });
  } else if ((me.roundPoints || 0) >= 4) {
    awards.push({
      icon: "🧠",
      title: "WORD MACHINE",
      text: "You nailed 4+ categories.",
    });
  }

  if ((me.currentStreak || 0) >= 3) {
    awards.push({
      icon: "🔥",
      title: "ON FIRE",
      text: me.currentStreak + " perfect-round streak.",
    });
  }

  if (winnerIds.includes(me.id)) {
    awards.push({
      icon: "👑",
      title: "ROUND WINNER",
      text: "Highest valid-answer score this round.",
    });
  }

  if (submitSeconds != null && submitSeconds <= 20) {
    awards.push({
      icon: "⚡",
      title: "QUICK THINKER",
      text: "Submitted in " + submitSeconds.toFixed(1) + " seconds.",
    });
  }

  return awards;
}

function RoundResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultData = location.state;

  useEffect(() => {
    const handleGameStarted = (gameData) =>
      navigate("/game", { state: gameData });
    const handleGameOver = (gameData) =>
      navigate("/leaderboard", { state: gameData });

    socket.on("gameStarted", handleGameStarted);
    socket.on("gameOver", handleGameOver);

    return () => {
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameOver", handleGameOver);
    };
  }, [navigate]);

  const players = resultData?.players || [];
  const me = players.find((player) => player.id === socket.id);

  useEffect(() => {
    if (!me || !resultData?.gameId) return;

    recordRoundResult({
      roundKey:
        resultData.gameId +
        ":round:" +
        resultData.currentRound +
        ":" +
        (resultData.roundStartedAt || ""),
      roundPoints: me.roundPoints || 0,
      currentStreak: me.currentStreak || 0,
      perfectRound: (me.roundPoints || 0) === ANSWER_FIELDS.length,
      isWinner: (resultData.winnerIds || []).includes(me.id),
    });
  }, [
    me,
    resultData?.gameId,
    resultData?.currentRound,
    resultData?.roundStartedAt,
    resultData?.winnerIds,
  ]);

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

  const submitSeconds =
    me?.submittedAt && resultData.roundStartedAt
      ? Math.max(0, (me.submittedAt - resultData.roundStartedAt) / 1000)
      : null;

  const isWinner = Boolean(me && winnerIds.includes(me.id));
  const roundPoints = me?.roundPoints || 0;
  const currentStreak = me?.currentStreak || 0;
  const xpGained = getRoundXp(roundPoints, currentStreak, isWinner);
  const currentProfile = getProfile();
  const xpAfterRound = currentProfile.xp + xpGained;
  const levelAfterRound = getLevelFromXp(xpAfterRound);
  const awards = getRoundAwards(me, winnerIds, submitSeconds);

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
            <div className="round-xp-pill">
              <span>XP</span>
              <strong>+{xpGained}</strong>
            </div>
          </div>
        ) : null}

        {me && awards.length ? (
          <section className="round-awards">
            <div className="section-title">
              <h2>Round awards</h2>
              <span>{awards.length} earned</span>
            </div>

            <div className="award-grid">
              {awards.map((award) => (
                <article className="award-card" key={award.title}>
                  <span className="award-icon" aria-hidden="true">{award.icon}</span>
                  <div>
                    <strong>{award.title}</strong>
                    <small>{award.text}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {me ? (
          <div className="streak-banner">
            <div className="streak-banner-main">
              <span>{currentStreak >= 2 ? "🔥" : "✨"}</span>
              <div>
                <strong>
                  {currentStreak
                    ? currentStreak + " perfect-round streak"
                    : "Streak reset this round"}
                </strong>
                <small>
                  Best streak: {me.bestStreak || currentStreak || 0}
                </small>
              </div>
            </div>
            <div className="level-up-copy">
              <span>LEVEL</span>
              <strong>{levelAfterRound}</strong>
              {levelAfterRound > currentProfile.level ? (
                <em>LEVEL UP!</em>
              ) : null}
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
