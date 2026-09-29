const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CATEGORY_PACKS,
  getCategoryPackConfig,
} = require("./categoryPacks");

test("exposes all supported challenge packs", () => {
  assert.deepEqual(Object.keys(CATEGORY_PACKS).sort(), [
    "campus",
    "classic",
    "entertainment",
    "india",
    "sports",
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


test("sports pack has useful sports categories", () => {
  const pack = getCategoryPackConfig("sports");
  assert.equal(pack.name, "Sports");
  assert.deepEqual(
    pack.categories.map((category) => category.label),
    ["Athlete", "Team", "Sport", "Venue", "Sports Brand"]
  );
});

test("campus pack has student-focused categories", () => {
  const pack = getCategoryPackConfig("campus");
  assert.equal(pack.name, "Campus");
  assert.deepEqual(
    pack.categories.map((category) => category.label),
    ["Student Name", "College / University", "Subject", "Technology", "App / Platform"]
  );
});
