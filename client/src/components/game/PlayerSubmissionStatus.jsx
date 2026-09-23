function PlayerSubmissionStatus({
  submittedCount,
  totalPlayers = 0,
  submittedPlayers = [],
}) {
  const remaining = Math.max(totalPlayers - submittedCount, 0);
  const visiblePlayers = submittedPlayers.slice(-6);

  return (
    <div className="submission-status">
      <div className="submission-status-copy">
        <strong>LIVE PLAYER STATUS</strong>
        <p>
          <span className="status-dot" aria-hidden="true" />
          {submittedCount} / {totalPlayers || "?"} submitted
          {remaining > 0 ? " · " + remaining + " still writing" : " · Everyone is ready"}
        </p>
      </div>

      <div className="submission-players" aria-label="Players who submitted">
        {visiblePlayers.map((player) => (
          <span
            className="submission-player"
            key={player.playerId}
            title={player.playerName}
          >
            {player.playerName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        ))}

        {submittedPlayers.length > visiblePlayers.length ? (
          <span className="submission-more">
            +{submittedPlayers.length - visiblePlayers.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default PlayerSubmissionStatus;
