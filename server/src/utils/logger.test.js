const test = require("node:test");
const assert = require("node:assert/strict");
const { serializeError } = require("./logger");

test("serializes an Error for structured logging", () => {
  const result = serializeError(new Error("test error"));
  assert.equal(result.name, "Error");
  assert.equal(result.message, "test error");
  assert.ok(result.stack);
});
