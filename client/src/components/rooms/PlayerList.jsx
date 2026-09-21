function PlayerList({
  players = [],
  showScores = false,
  showHost = false,
  showRank = false,
  showRoundPoints = false,
}) {
  return (
    <div className="player-list">
      {players.map((player, index) => {
        const scoreLabel = player.score === 1 ? "Point" : "Points";

        return (
          <div className="player-card" key={player.id}>
            <div className="player-avatar">
              {showRank ? index + 1 : player.name?.charAt(0)?.toUpperCase() || "?"}
            </div>

            <div className="player-info">
              <strong>{player.name}</strong>
              <small>
                {showRoundPoints
                  ? "+" + (player.roundPoints || 0) + " this round"
                  : showScores
                    ? player.score + " " + scoreLabel
                    : showHost && index === 0
                      ? "Host"
                      : "Player"}
              </small>
            </div>

            {showRoundPoints ? (
              <div className="score-stack">
                <span className="round-score">
                  +{player.roundPoints || 0}
                </span>
                <strong>{player.score}</strong>
              </div>
            ) : showScores ? (
              <div className="score-badge">⭐ {player.score}</div>
            ) : showHost && index === 0 ? (
              <div className="host-badge">👑 HOST</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default PlayerList;
