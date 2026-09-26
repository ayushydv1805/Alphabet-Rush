const SESSION_KEY = "alphabet-rush-active-session";

export function getActiveSession() {
  if (typeof window === "undefined") return null;

  try {
    const session = JSON.parse(
      window.localStorage.getItem(SESSION_KEY) || "null"
    );
    if (!session?.roomCode) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveActiveSession(session) {
  if (typeof window === "undefined") return;
  const roomCode = String(session?.roomCode || "").trim().toUpperCase();
  if (!roomCode) return;

  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      roomCode,
      gameId: session?.gameId || "",
    })
  );
}

export function clearActiveSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
