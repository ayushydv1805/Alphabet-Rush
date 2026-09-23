const test = require("node:test");
const assert = require("node:assert/strict");
const { createAnswerValidator } = require("./answerValidator");

function createMockOpenAI(outputText, options = {}) {
  let callCount = 0;
  const calls = [];
  const responses = Array.isArray(outputText) ? [...outputText] : [outputText];

  return {
    responses: {
      create: async (request) => {
        callCount += 1;
        calls.push(request);

        const next = responses[Math.min(callCount - 1, responses.length - 1)];

        if (next instanceof Error) {
          throw next;
        }

        return { output_text: next };
      },
    },
    get callCount() {
      return callCount;
    },
    get calls() {
      return calls;
    },
    ...options,
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


test("runs a second AI review when the first pass rejects an unknown answer", async () => {
  const openai = createMockOpenAI([
    JSON.stringify({ thing: false }),
    JSON.stringify({ thing: true }),
  ]);

  const validator = createAnswerValidator(openai);
  const result = await validator.validateAnswers(
    { thing: "Racket" },
    "R"
  );

  assert.equal(result.thing, true);
  assert.equal(openai.callCount, 2);
  assert.equal(
    openai.calls[0].text.format.type,
    "json_schema"
  );
  assert.equal(
    openai.calls[1].text.format.name,
    "alphabet_rush_validation"
  );
});

test("does not call AI for an obvious trusted answer", async () => {
  const openai = createMockOpenAI(
    JSON.stringify({ thing: false })
  );

  const validator = createAnswerValidator(openai);
  const result = await validator.validateAnswers(
    { thing: "Rope" },
    "R"
  );

  assert.equal(result.thing, true);
  assert.equal(openai.callCount, 0);
});

test("uses the configured model", async () => {
  const openai = createMockOpenAI(
    JSON.stringify({ place: true })
  );

  const validator = createAnswerValidator(openai, {
    model: "test-model",
  });

  await validator.validateAnswers(
    { place: "Aizawl" },
    "A"
  );

  assert.equal(openai.calls[0].model, "test-model");
});
