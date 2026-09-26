const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createIdentityToken,
  verifyIdentityToken,
} = require("./identity");

test("creates and verifies a durable player identity token", () => {
  const playerId = "player-123";
  const token = createIdentityToken(playerId);
  const verified = verifyIdentityToken(token);

  assert.ok(token.split(".").length === 3);
  assert.equal(verified.playerId, playerId);
});

test("rejects a tampered identity token", () => {
  const token = createIdentityToken("player-456");
  const parts = token.split(".");
  parts[1] = Buffer.from(
    JSON.stringify({
      sub: "attacker",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  )
    .toString("base64url");

  assert.equal(verifyIdentityToken(parts.join(".")), null);
});
