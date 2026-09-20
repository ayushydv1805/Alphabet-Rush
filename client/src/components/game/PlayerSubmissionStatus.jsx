function PlayerSubmissionStatus({ submittedCount }) {
  return (
    <div className="submission-status">
      <strong>Players Status</strong>
      <p>
        <span className="status-dot" aria-hidden="true" />
        {submittedCount} player{submittedCount !== 1 ? "s" : ""} submitted
      </p>
    </div>
  );
}

export default PlayerSubmissionStatus;
