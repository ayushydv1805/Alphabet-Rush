const test = require("node:test");
const assert = require("node:assert/strict");
const { createAnswerValidator } = require("./answerValidator");

function createMockOpenAI(outputText) {
  let callCount = 0;

  return {
    responses: {
      create: async () => {
        callCount += 1;
        return { output_text: outputText };
      },
    },
    get callCount() {
      return callCount;
    },
  };
}

test("accepts valid category results returned by the AI", async () => {
  const openai = createMockOpenAI(
    JSON.stringify({
      name: true,
      place: true,
      thing: true,
      animal: true,
      food: true,
    })
  );

  const validator = createAnswerValidator(openai);

  const result = await validator.validateAnswers(
    {
      name: "Anmol",
      place: "Aizawl",
      thing: "Abacus",
      animal: "Alligator",
      food: "Avocado",
    },
    "A"
  );

  assert.deepEqual(result, {
    name: true,
    place: true,
    thing: true,
    animal: true,
    food: true,
  });
  assert.equal(openai.callCount, 1);
});

test("rejects wrong starting letters before calling the AI", async () => {
  const openai = createMockOpenAI(
    JSON.stringify({
      name: true,
    })
  );

  const validator = createAnswerValidator(openai);

  const result = await validator.validateAnswers(
    {
      name: "Anmol",
      animal: "Cat",
    },
    "A"
  );

  assert.equal(result.name, true);
  assert.equal(result.animal, false);
  assert.equal(openai.callCount, 1);
});

test("parses JSON wrapped in a markdown code fence", async () => {
  const openai = createMockOpenAI(
    'Here is the result:\n\n\`\`\`json\n{"animal":true}\n\`\`\`'
  );

  const validator = createAnswerValidator(openai);
  const result = await validator.validateAnswers(
    { animal: "Alligator" },
    "A"
  );

  assert.equal(result.animal, true);
});

test("falls back to known valid answers when the AI service is unavailable", async () => {
  const openai = {
    responses: {
      create: async () => {
        throw new Error("simulated API outage");
      },
    },
  };

  const validator = createAnswerValidator(openai);
  const result = await validator.validateAnswers(
    {
      name: "Yash",
      place: "Yamunanagar",
      thing: "yacht",
      animal: "yak",
      food: "yummy",
    },
    "Y"
  );

  assert.equal(result.name, true);
  assert.equal(result.place, true);
  assert.equal(result.thing, true);
  assert.equal(result.animal, true);
  assert.equal(result.food, false);
});

test("reuses cached positive validations", async () => {
  const openai = createMockOpenAI(JSON.stringify({ place: true }));
  const validator = createAnswerValidator(openai);

  const first = await validator.validateAnswers({ place: "Asansol" }, "A");
  const second = await validator.validateAnswers({ place: "Asansol" }, "A");

  assert.equal(first.place, true);
  assert.equal(second.place, true);
  assert.equal(openai.callCount, 1);
});


test("accepts the common H round answers without relying on AI", async () => {
  const openai = createMockOpenAI(
    JSON.stringify({
      name: false,
      place: false,
      thing: false,
      animal: false,
      food: false,
    })
  );

  const validator = createAnswerValidator(openai);
  const result = await validator.validateAnswers(
    {
      name: "Harsh",
      place: "Haridwar",
      thing: "Hair",
      animal: "Hen",
      food: "Honey",
    },
    "H"
  );

  assert.deepEqual(result, {
    name: true,
    place: true,
    thing: true,
    animal: true,
    food: true,
  });
  assert.equal(openai.callCount, 0);
});


test("accepts the common N round answers without relying on AI", async () => {
  const openai = createMockOpenAI(
    JSON.stringify({
      name: false,
      place: false,
      thing: false,
      animal: false,
      food: false,
    })
  );

  const validator = createAnswerValidator(openai);
  const result = await validator.validateAnswers(
    {
      name: "Nitin",
      place: "Nagaland",
      thing: "Nail",
      animal: "Narwhal",
      food: "Noodles",
    },
    "N"
  );

  assert.deepEqual(result, {
    name: true,
    place: true,
    thing: true,
    animal: true,
    food: true,
  });
  assert.equal(openai.callCount, 0);
});


test("accepts the common R round answers without relying on AI", async () => {
  const openai = createMockOpenAI(
    JSON.stringify({
      name: false,
      place: false,
      thing: false,
      animal: false,
      food: false,
    })
  );

  const validator = createAnswerValidator(openai);
  const result = await validator.validateAnswers(
    {
      name: "Rahul",
      place: "Rewari",
      thing: "rope",
      animal: "rabbit",
      food: "rice",
    },
    "R"
  );

  assert.deepEqual(result, {
    name: true,
    place: true,
    thing: true,
    animal: true,
    food: true,
  });
  assert.equal(openai.callCount, 0);
});
