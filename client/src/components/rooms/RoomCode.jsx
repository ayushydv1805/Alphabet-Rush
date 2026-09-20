function RoomCode({ roomCode }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch (error) {
      console.error("Unable to copy room code:", error);
    }
  };

  return (
    <div className="code-section">
      <span>ROOM CODE</span>
      <div className="code-box">
        <strong>{roomCode}</strong>
        <button
          type="button"
          className="copy-btn"
          onClick={handleCopy}
          aria-label="Copy room code"
          title="Copy room code"
        >
          📋
        </button>
      </div>
      <small>Share this code with your friends</small>
    </div>
  );
}

export default RoomCode;
