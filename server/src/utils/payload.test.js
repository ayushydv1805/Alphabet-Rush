const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeRoomCode,
  isValidRoomCode,
  normalizeName,
  normalizeAnswers,
} = require("./payload");

test("validates and normalizes room codes", () => {
  assert.equal(normalizeRoomCode(" ab12cd "), "AB12CD");
  assert.equal(isValidRoomCode("AB12CD"), true);
  assert.equal(isValidRoomCode("AB12"), false);
});

test("normalizes bounded player input", () => {
  assert.equal(normalizeName(" Ayush   Yadav "), "Ayush Yadav");
  const answers = normalizeAnswers({
    name: " Nitin ",
    place: "Nagaland",
    thing: "Nail",
    animal: "Narwhal",
    food: "Noodles",
  });
  assert.equal(answers.name, "Nitin");
  assert.equal(answers.food, "Noodles");
  assert.ok(answers.name.length <= 80);
});
