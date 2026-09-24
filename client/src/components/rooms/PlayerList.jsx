function PlayerList({
  players = [],
  showScores = false,
  showHost = false,
  showRank = false,
  showRoundPoints = false,
  winnerIds = [],
}) {
  return (
    <div className="player-list">
      {players.map((player, index) => {
        const isWinner = winnerIds.includes(player.id);
        const scoreLabel = player.score === 1 ? "Point" : "Points";

        return (
          <div
            className={isWinner ? "player-card round-winner-card" : "player-card"}
            key={player.id}
          >
            <div className="player-avatar">
              {showRank ? (
                index + 1
              ) : (
                player.avatar || player.name?.charAt(0)?.toUpperCase() || "?"
              )}
            </div>

            <div className="player-info">
              <strong>{player.name}</strong>
              <small>
                {isWinner
                  ? "Round winner"
                  : showRoundPoints
                    ? "+" + (player.roundPoints || 0) + " this round"
                    : showScores
                      ? player.score + " " + scoreLabel
                      : showHost && index === 0
                        ? "Host"
                        : player.title || "Player"}
              </small>
              {player.currentStreak >= 2 ? (
                <span className="player-streak">🔥 {player.currentStreak} streak</span>
              ) : null}
            </div>

            {showRoundPoints ? (
              <div className="score-stack">
                <span className="round-score">+{player.roundPoints || 0}</span>
                <strong>{player.score}</strong>
                {isWinner && <span className="winner-chip">WINNER</span>}
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
