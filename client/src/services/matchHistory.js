const API_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:5000"
    : "https://alphabet-rush-server.onrender.com");

async function getJson(path, token) {
  const response = await fetch(API_URL + path, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Unable to load player data.");
  }

  return payload;
}

export async function fetchPlayerHistory(token, limit = 10) {
  if (!token) return [];

  const safeLimit = Math.min(
    Math.max(Number(limit) || 10, 1),
    50
  );

  const payload = await getJson(
    "/api/player/history?limit=" + safeLimit,
    token
  );

  return Array.isArray(payload.history) ? payload.history : [];
}

export async function fetchPlayerStats(token) {
  if (!token) return null;

  const payload = await getJson("/api/player/stats", token);
  return payload.stats || null;
}
