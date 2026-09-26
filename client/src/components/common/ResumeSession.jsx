import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getIdentityToken } from "../../services/identity";
import { getActiveSession, saveActiveSession } from "../../services/session";
import socket from "../../services/socket";

const RESUMABLE_PATHS = new Set([
  "/waiting-room",
  "/game",
  "/round-result",
  "/leaderboard",
]);

function ResumeSession() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!RESUMABLE_PATHS.has(location.pathname)) return undefined;

    const resume = () => {
      const session = getActiveSession();
      const identityToken = getIdentityToken();
      if (!session?.roomCode || !identityToken) return;

      socket.emit("resumeRoom", {
        roomCode: session.roomCode,
        gameId: session.gameId,
        identityToken,
      });
    };

    const handleResumed = (data) => {
      if (!data?.status) return;

      if (data.roomCode) {
        saveActiveSession({
          roomCode: data.roomCode,
          gameId: data.gameId,
        });
      }

      if (data.identityToken) {
        localStorage.setItem(
          "alphabet-rush-identity-token",
          data.identityToken
        );
      }

      if (data.status === "waiting") {
        navigate("/waiting-room", { state: data });
      } else if (data.status === "active") {
        navigate("/game", { state: data });
      } else if (data.status === "result") {
        navigate("/round-result", { state: data });
      } else if (data.status === "finished") {
        navigate("/leaderboard", { state: data });
      }
    };

    socket.on("roomResumed", handleResumed);
    socket.on("connect", resume);

    if (socket.connected) resume();

    return () => {
      socket.off("roomResumed", handleResumed);
      socket.off("connect", resume);
    };
  }, [location.pathname, navigate]);

  return null;
}

export default ResumeSession;
