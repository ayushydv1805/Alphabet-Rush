import { useEffect, useState } from "react";
import socket from "../../services/socket";

function ConnectionStatus() {
  const [status, setStatus] = useState(socket.connected ? "connected" : "disconnected");

  useEffect(() => {
    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = () => setStatus("reconnecting");
    const onReconnectAttempt = () => setStatus("reconnecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, []);

  const copy =
    status === "connected"
      ? { icon: "●", label: "LIVE", className: "connected" }
      : status === "reconnecting"
        ? { icon: "◌", label: "RECONNECTING", className: "reconnecting" }
        : { icon: "○", label: "OFFLINE", className: "disconnected" };

  return (
    <div
      className={"connection-status " + copy.className}
      role="status"
      aria-live="polite"
      title={
        status === "connected"
          ? "Connected to the game server"
          : status === "reconnecting"
            ? "Trying to reconnect to the game server"
            : "Not connected to the game server"
      }
    >
      <span aria-hidden="true">{copy.icon}</span>
      <span>{copy.label}</span>
    </div>
  );
}

export default ConnectionStatus;
