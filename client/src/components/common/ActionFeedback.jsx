import { useEffect, useState } from "react";
import socket from "../../services/socket";

function ActionFeedback() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleError = (nextMessage) => {
      setMessage(typeof nextMessage === "string" ? nextMessage : "Something went wrong.");
    };

    socket.on("actionError", handleError);

    return () => socket.off("actionError", handleError);
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div className="action-feedback" role="alert" aria-live="assertive">
      <span aria-hidden="true">⚠️</span>
      <span>{message}</span>
      <button type="button" onClick={() => setMessage("")} aria-label="Dismiss message">
        ×
      </button>
    </div>
  );
}

export default ActionFeedback;
