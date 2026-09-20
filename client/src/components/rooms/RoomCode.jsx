import { useEffect, useRef, useState } from "react";

function RoomCode({ roomCode }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);

      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }

      resetTimer.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
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
          className={copied ? "copy-btn copied" : "copy-btn"}
          onClick={handleCopy}
          aria-label={copied ? "Room code copied" : "Copy room code"}
          title={copied ? "Copied!" : "Copy room code"}
        >
          {copied ? "✓" : "📋"}
        </button>
      </div>

      <small className={copied ? "copy-feedback visible" : "copy-feedback"}>
        {copied ? "Room code copied!" : "Share this code with your friends"}
      </small>
    </div>
  );
}

export default RoomCode;
