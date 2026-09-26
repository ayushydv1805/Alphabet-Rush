const crypto = require("node:crypto");

const TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;
const FALLBACK_SECRET = "alphabet-rush-development-secret";

function getSecret() {
  return process.env.AUTH_SECRET || FALLBACK_SECRET;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(value) {
  return base64Url(
    crypto.createHmac("sha256", getSecret()).update(value).digest()
  );
}

function createIdentityToken(playerId) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: playerId,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    })
  );
  const unsigned = header + "." + payload;
  return unsigned + "." + sign(unsigned);
}

function verifyIdentityToken(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const unsigned = header + "." + payload;
  const expected = sign(unsigned);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    provided.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(provided, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(
        payload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString()
    );

    if (
      typeof decoded.sub !== "string" ||
      !decoded.sub ||
      Number(decoded.exp) < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { playerId: decoded.sub, expiresAt: Number(decoded.exp) };
  } catch {
    return null;
  }
}

module.exports = { createIdentityToken, verifyIdentityToken, TOKEN_TTL_SECONDS };
