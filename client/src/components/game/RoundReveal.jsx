function RoundReveal({ players = [], fields = [], currentPlayerId = "" }) {
  return (
    <section className="round-reveal">
      <div className="round-reveal-heading">
        <div>
          <p className="round-reveal-kicker">THE REVEAL</p>
          <h2>Everyone&apos;s Answers</h2>
        </div>
        <span>{players.length} player{players.length === 1 ? "" : "s"}</span>
      </div>

      <div className="reveal-grid">
        {players.map((player, index) => (
          <article
            className={
              player.id === currentPlayerId
                ? "reveal-player-card reveal-player-me"
                : "reveal-player-card"
            }
            style={{ animationDelay: index * 70 + "ms" }}
            key={player.id}
          >
            <div className="reveal-player-head">
              <div className="reveal-avatar">
                {player.avatar || player.name?.charAt(0)?.toUpperCase() || "?"}
              </div>

              <div>
                <strong>
                  {player.name}
                  {player.id === currentPlayerId ? " · YOU" : ""}
                </strong>
                <span>
                  {player.title || "Rush Rookie"} · +{player.roundPoints || 0} / {fields.length}
                </span>
              </div>

              <div className="reveal-score-group">
                <b className="reveal-player-score">{player.score}</b>
                {player.currentStreak >= 2 ? (
                  <small>🔥 {player.currentStreak}</small>
                ) : null}
              </div>
            </div>

            <div className="reveal-answers">
              {fields.map((field) => {
                const value = player.answers?.[field.name] || "";
                const isCorrect = Boolean(player.validation?.[field.name]);

                return (
                  <div
                    className={
                      isCorrect
                        ? "reveal-answer correct"
                        : value
                          ? "reveal-answer incorrect"
                          : "reveal-answer empty"
                    }
                    key={field.name}
                  >
                    <span>{field.label}</span>
                    <strong>{value || "—"}</strong>
                    <em
                      aria-label={
                        isCorrect ? "Correct" : value ? "Wrong" : "Blank"
                      }
                    >
                      {isCorrect ? "✓" : value ? "✕" : "•"}
                    </em>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RoundReveal;
