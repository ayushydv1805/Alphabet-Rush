const CATEGORIES = ["name", "place", "thing", "animal", "food"];
const DEFAULT_MODEL = "gpt-5.6-luna";

const FALLBACK_ANSWERS = {
  name: new Set([
    "aarav", "aakash", "abhay", "aditya", "aman", "amit", "ananya", "anjali",
    "arjun", "aryan", "ayush", "bhavna", "deepak", "diya", "farhan", "harsh",
    "isha", "karan", "kavya", "kunal", "meera", "nikhil", "nisha", "nitin",
    "pooja", "rahul", "raj", "rajesh", "rakesh", "ravi", "reena", "riya", "rohan",
    "rohit", "sahil", "simran", "sonia", "varun", "vijay", "vikas", "yash",
    "yuvan", "zoya"
  ]),
  place: new Set([
    "agra", "ahmedabad", "amritsar", "bangalore", "bathinda", "bhopal", "chandigarh",
    "chennai", "delhi", "faridabad", "goa", "gurgaon", "haridwar", "hisar",
    "hyderabad", "jaipur", "jalandhar", "kashmir", "kochi", "kolkata", "kurukshetra",
    "lucknow", "ludhiana", "manali", "mathura", "meerut", "mumbai", "mysore",
    "nagaland", "nagpur", "nainital", "new delhi", "patiala", "pune", "rajkot",
    "ranchi", "rewari", "rishikesh", "rohtak", "roorkee", "shimla", "surat",
    "udaipur", "varanasi", "yamunanagar"
  ]),
  thing: new Set([
    "apple", "bag", "ball", "belt", "bicycle", "bottle", "book", "box", "brush",
    "camera", "chair", "clock", "computer", "cup", "desk", "door", "fan", "fork",
    "glasses", "guitar", "hair", "hammer", "hat", "helmet", "key", "keyboard",
    "knife", "laptop", "lock", "mobile", "monitor", "mouse", "nail", "notebook",
    "pen", "phone", "pillow", "plate", "radio", "rack", "razor", "remote", "ring",
    "robot", "rocket", "rope", "ruler", "shirt", "shoe", "spoon", "table",
    "television", "umbrella", "watch", "wallet", "yacht", "yo-yo"
  ]),
  animal: new Set([
    "ant", "ape", "bear", "camel", "cat", "cow", "deer", "dog", "donkey", "eagle",
    "elephant", "fox", "goat", "hen", "horse", "hyena", "ibex", "jaguar", "koala",
    "lion", "monkey", "mouse", "narwhal", "ox", "panda", "rabbit", "raccoon", "ram",
    "rat", "reindeer", "rhinoceros", "rooster", "sheep", "tiger", "vulture", "wolf",
    "yak", "zebra"
  ]),
  food: new Set([
    "aam", "aaloo", "aloo", "apple", "banana", "bread", "burger", "cake", "carrot",
    "cheese", "chicken", "chocolate", "dal", "dosa", "egg", "halwa", "honey",
    "ice cream", "idli", "jalebi", "kheer", "mango", "noodles", "orange", "paneer",
    "pasta", "pizza", "poha", "rabri", "raita", "rajma", "ramen", "rasgulla", "ravioli",
    "rice", "roti", "samosa", "sandwich", "tea", "upma", "vada", "yogurt", "zucchini"
  ])
};

const normalizeText = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const normalizeKey = (value) => normalizeText(value).toLocaleLowerCase();

const startsWithLetter = (answer, letter) => {
  const normalizedAnswer = normalizeKey(answer);
  const normalizedLetter = normalizeKey(letter);

  return Boolean(
    normalizedAnswer &&
      normalizedLetter &&
      normalizedAnswer.startsWith(normalizedLetter)
  );
};

function fallbackValidate(category, answer) {
  return FALLBACK_ANSWERS[category]?.has(normalizeKey(answer)) || false;
}

function extractOutputText(response) {
  if (typeof response?.output_text === "string") {
    return response.output_text;
  }

  if (!Array.isArray(response?.output)) {
    return "";
  }

  return response.output
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter(
      (item) =>
        item?.type === "output_text" && typeof item?.text === "string"
    )
    .map((item) => item.text)
    .join("\n");
}

function parseValidationOutput(outputText) {
  if (typeof outputText !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(outputText.trim());
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch (_error) {
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch (_parseError) {
      return null;
    }
  }
}

function normalizeModelResult(value) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  return false;
}

function buildSchema(categories) {
  return {
    type: "object",
    properties: Object.fromEntries(
      categories.map((category) => [category, { type: "boolean" }])
    ),
    required: categories,
    additionalProperties: false,
  };
}

function buildJudgePrompt(letter, items, secondPass = false) {
  const answers = items
    .map(
      ({ category, answer }) =>
        category.charAt(0).toUpperCase() + category.slice(1) + ": " + answer
    )
    .join("\n");

  const prefix = secondPass
    ? "This is a second-chance review for answers that may have been rejected incorrectly. Re-check each answer carefully and prefer accepting a valid, understandable example over rejecting it merely because it is uncommon."
    : "Act as the primary game judge.";

  return (
    prefix +
    "\n\nRound letter: " +
    normalizeText(letter) +
    "\n\n" +
    "The server has already enforced the starting-letter rule. Judge category membership only. " +
    "Accept real names, real places (including states, cities, towns, villages, regions, landmarks), tangible things/objects, animals/species/breeds, and foods/drinks/ingredients. " +
    "Accept proper nouns, Indian/local examples, regional examples, alternate spellings, and less-common but legitimate examples. " +
    "Do NOT reject an answer just because it is not a common everyday word. " +
    "Reject only answers that are clearly nonsense, clearly from another category, or clearly not meaningful.\n\n" +
    "Examples: N + Name + Nitin = true; N + Place + Nagaland = true; N + Thing + Nail = true; " +
    "N + Animal + Narwhal = true; N + Food + Noodles = true; " +
    "A + Animal + Ace = false; A + Food + Agra = false.\n\n" +
    "Answers:\n" +
    answers +
    "\n\nReturn only boolean values for these exact categories: " +
    items.map(({ category }) => category).join(", ")
  );
}

async function createJudgeCall(openai, model, letter, items, secondPass = false) {
  const request = {
    model,
    input: buildJudgePrompt(letter, items, secondPass),
    text: {
      format: {
        type: "json_schema",
        name: "alphabet_rush_validation",
        description: "Boolean category validation for Alphabet Rush answers.",
        strict: true,
        schema: buildSchema(items.map(({ category }) => category)),
      },
    },
  };

  // For second-chance reviews, let the model use web search when a doubtful
  // answer needs external factual confirmation. This is especially useful for
  // real places, animals, foods and less-common proper nouns.
  if (secondPass) {
    request.tools = [{ type: "web_search" }];
  }

  return openai.responses.create(request);
}

function createAnswerValidator(openai, options = {}) {
  const model = options.model || process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const cache = new Map();
  const MAX_CACHE_SIZE = 5000;

  const cacheGet = (key) => (cache.has(key) ? cache.get(key) : undefined);

  const cacheSet = (key, value) => {
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    cache.set(key, value);
  };

  function applyParsedResult(result, parsed, items) {
    const missing = [];

    for (const item of items) {
      const category = item.category;
      const value = parsed?.[category];

      if (value === undefined) {
        missing.push(category);
        continue;
      }

      result[category] = normalizeModelResult(value);

      if (result[category]) {
        cacheSet(item.key, true);
      }
    }

    return missing;
  }

  async function aiValidate(result, pending, letter) {
    if (!openai || typeof openai.responses?.create !== "function") {
      throw new Error("OpenAI validator is not configured.");
    }

    // Pass 1: normal semantic category validation.
    const firstResponse = await createJudgeCall(
      openai,
      model,
      letter,
      pending,
      false
    );

    const firstParsed = parseValidationOutput(
      extractOutputText(firstResponse)
    );

    if (!firstParsed) {
      throw new Error("AI validator returned invalid structured data.");
    }

    const firstFalse = [];
    const missing = applyParsedResult(result, firstParsed, pending);

    if (missing.length) {
      throw new Error(
        "AI validator omitted categories: " + missing.join(", ")
      );
    }

    for (const item of pending) {
      if (!result[item.category]) {
        firstFalse.push(item);
      }
    }

    // Pass 2 only for false results. This is specifically designed to catch
    // false negatives without paying for a second call on already-valid answers.
    if (!firstFalse.length) {
      return;
    }

    const secondResponse = await createJudgeCall(
      openai,
      model,
      letter,
      firstFalse,
      true
    );

    const secondParsed = parseValidationOutput(
      extractOutputText(secondResponse)
    );

    if (!secondParsed) {
      return;
    }

    for (const item of firstFalse) {
      if (normalizeModelResult(secondParsed[item.category])) {
        result[item.category] = true;
        cacheSet(item.key, true);
      }
    }
  }

  async function validateAnswers(answers, letter) {
    const source = answers && typeof answers === "object" ? answers : {};
    const result = Object.fromEntries(
      CATEGORIES.map((category) => [category, false])
    );
    const pending = [];

    for (const category of CATEGORIES) {
      const answer = normalizeText(source[category]);

      if (!answer || !startsWithLetter(answer, letter)) {
        continue;
      }

      // Common, unambiguous answers are accepted deterministically. This is
      // deliberately checked before AI so an AI false-negative cannot turn an
      // obvious game answer into a wrong answer.
      if (fallbackValidate(category, answer)) {
        result[category] = true;
        continue;
      }

      const key = category + "|" + normalizeKey(letter) + "|" + normalizeKey(answer);
      const cached = cacheGet(key);

      if (cached !== undefined) {
        result[category] = cached;
      } else {
        pending.push({ category, answer, key });
      }
    }

    if (!pending.length) {
      return result;
    }

    try {
      await aiValidate(result, pending, letter);
      return result;
    } catch (error) {
      console.error("AI validation unavailable:", error.message);

      // Never award an unknown answer just because AI failed. The deterministic
      // dictionary remains the safety net for common valid answers.
      for (const item of pending) {
        result[item.category] = fallbackValidate(item.category, item.answer);
      }

      return result;
    }
  }

  async function validateAnswer(answer, category, letter) {
    const result = await validateAnswers({ [category]: answer }, letter);
    return Boolean(result[category]);
  }

  return {
    validateAnswers,
    validateAnswer,
    model,
  };
}

module.exports = {
  createAnswerValidator,
  CATEGORIES,
  DEFAULT_MODEL,
  fallbackValidate,
  startsWithLetter,
};
