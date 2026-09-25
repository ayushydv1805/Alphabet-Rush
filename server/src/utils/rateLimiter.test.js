const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter } = require("./rateLimiter");

test("rate limiter blocks excess requests per key", () => {
  const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
  assert.equal(limiter.isAllowed("one"), true);
  assert.equal(limiter.isAllowed("one"), true);
  assert.equal(limiter.isAllowed("one"), false);
  assert.equal(limiter.isAllowed("two"), true);
});
