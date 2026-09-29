const API_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:5000"
    : "https://alphabet-rush-server.onrender.com");

export async function fetchGlobalLeaderboard(limit = 25) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
  const response = await fetch(
    API_URL + "/api/leaderboard?limit=" + safeLimit
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load global leaderboard.");
  }

  return Array.isArray(payload.leaderboard) ? payload.leaderboard : [];
}
