const test = require("node:test");
const assert = require("node:assert/strict");
const {
  GAME_MODES,
  HARD_LETTERS,
  getGameModeConfig,
  getRoundLetter,
} = require("./gameModes");

test("falls back to classic for an unknown mode", () => {
  assert.equal(getGameModeConfig("unknown").id, "classic");
});

test("blitz uses a 30 second timer", () => {
  assert.equal(GAME_MODES.blitz.timeLimit, 30_000);
});

test("double points uses a 2x multiplier", () => {
  assert.equal(GAME_MODES.double.scoreMultiplier, 2);
});

test("hard letters only produces hard letters", () => {
  for (let index = 0; index < 100; index += 1) {
    assert.ok(HARD_LETTERS.includes(getRoundLetter("hard")));
  }
});

test("classic uses a normal alphabet letter", () => {
  assert.match(getRoundLetter("classic"), /^[A-Z]$/);
});
