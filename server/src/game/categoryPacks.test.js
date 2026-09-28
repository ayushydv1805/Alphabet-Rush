const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CATEGORY_PACKS,
  getCategoryPackConfig,
} = require("./categoryPacks");

test("exposes all supported challenge packs", () => {
  assert.deepEqual(Object.keys(CATEGORY_PACKS).sort(), [
    "classic",
    "entertainment",
    "india",
    "tech",
  ]);
});

test("falls back to classic for unknown packs", () => {
  assert.equal(getCategoryPackConfig("not-a-pack").id, "classic");
});

test("every pack contains five ordered answer categories", () => {
  for (const pack of Object.values(CATEGORY_PACKS)) {
    assert.equal(pack.categories.length, 5);
    assert.deepEqual(
      pack.categories.map((category) => category.key),
      ["name", "place", "thing", "animal", "food"]
    );
  }
});
