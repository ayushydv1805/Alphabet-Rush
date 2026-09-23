const CATEGORIES = ["name", "place", "thing", "animal", "food"];

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

const startsWithLetter = (answer, letter) => {
  const normalizedAnswer = normalizeText(answer).toLocaleLowerCase();
  const normalizedLetter = normalizeText(letter).toLocaleLowerCase();

  return Boolean(
    normalizedAnswer &&
      normalizedLetter &&
      normalizedAnswer.startsWith(normalizedLetter)
  );
};

function extractOutputText(response) {
  if (typeof response?.output_text === "string") {
    return response.output_text;
  }

  if (Array.isArray(response?.output)) {
    return response.output
      .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
      .filter((item) => item?.type === "output_text" && typeof item?.text === "string")
      .map((item) => item.text)
      .join("\n");
  }

  return "";
}

function parseValidationOutput(outputText) {
  if (typeof outputText !== "string") {
    return null;
  }

  const cleaned = outputText
    .replace(/^\s*\`\`\`(?:json)?/i, "")
    .replace(/\`\`\`\s*$/i, "")
    .trim();

  const candidates = [cleaned];
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (jsonMatch && jsonMatch[0] !== cleaned) {
    candidates.push(jsonMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([key, value]) => [
            normalizeText(key).toLocaleLowerCase(),
            value
          ])
        );
      }
    } catch (_error) {
      // Try the next candidate.
    }
  }

  return null;
}

function normalizeModelResult(value) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  return false;
}

function fallbackValidate(category, answer) {
  const normalized = normalizeText(answer).toLocaleLowerCase();
  return FALLBACK_ANSWERS[category]?.has(normalized) || false;
}

function createAnswerValidator(openai) {
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

      const trustedLocalMatch = fallbackValidate(category, answer);
      if (trustedLocalMatch) {
        result[category] = true;
        continue;
      }

      const key =
        category +
        "|" +
        normalizeText(letter).toLocaleLowerCase() +
        "|" +
        answer.toLocaleLowerCase();

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

    const answerLines = pending
      .map(
        ({ category, answer }) =>
          category.charAt(0).toUpperCase() + category.slice(1) + ": " + answer
      )
      .join("\n");

    let lastError;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await openai.responses.create({
          model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
          input:
            "You are the answer judge for a friendly Name-Place-Thing style word game.\n\n" +
            "Round letter: " +
            normalizeText(letter) +
            "\n\n" +
            "The server already checks that every answer starts with the round letter. Validate whether each answer genuinely belongs to its requested category.\n\n" +
            "Be permissive and accept valid examples even when they are less common, regional, proper nouns, alternate spellings, species or breeds, towns/villages, landmarks, ingredients, foods or ordinary objects.\n\n" +
            "Return false only when an answer is clearly nonsense, clearly belongs to another category, or is not a meaningful example of the category.\n\n" +
            "Category meanings:\n" +
            "- Name: a real person's name.\n" +
            "- Place: a real geographic place such as a city, town, village, state, country, landmark, or region.\n" +
            "- Thing: a tangible object, item, product, or ordinary thing.\n" +
            "- Animal: an animal, species, or recognized breed.\n" +
            "- Food: a food, dish, ingredient, fruit, vegetable, snack, or beverage.\n\n" +
            "Examples:\n" +
            "A + Name + Amit = true\n" +
            "A + Place + Agra = true\n" +
            "A + Thing + Apple = true\n" +
            "A + Animal + Ant = true\n" +
            "A + Food + Apple = true\n" +
            "A + Animal + Ace = false\n" +
            "A + Food + Agra = false\n\n" +
            "Answers to judge:\n" +
            answerLines +
            "\n\nReturn ONLY one JSON object. Use the exact lowercase category keys supplied below and boolean values. No markdown and no explanation. Keys: " +
            pending.map(({ category }) => category).join(", ")
        });

        const parsed = parseValidationOutput(extractOutputText(response));

        if (!parsed) {
          throw new Error("AI validator returned an unreadable response.");
        }

        for (const item of pending) {
          const modelValue = parsed[item.category];

          if (modelValue === undefined) {
            throw new Error(
              "AI validator omitted category: " + item.category
            );
          }

          const value = normalizeModelResult(modelValue);

          result[item.category] = value;

          if (value) {
            cacheSet(item.key, value);
          }
        }

        return result;
      } catch (error) {
        lastError = error;
      }
    }

    console.error(
      "AI validation unavailable:",
      lastError?.message || "Unknown error"
    );

    // Graceful degradation: keep deterministic letter validation and use a
    // small server-side common-answer dictionary instead of marking every
    // clearly known answer as wrong when the AI service is temporarily down.
    for (const item of pending) {
      const value = fallbackValidate(item.category, item.answer);
      result[item.category] = value;
      if (value) {
        cacheSet(item.key, value);
      }
    }

    return result;
  }

  async function validateAnswer(answer, category, letter) {
    const result = await validateAnswers({ [category]: answer }, letter);
    return Boolean(result[category]);
  }

  return { validateAnswers, validateAnswer };
}

module.exports = { createAnswerValidator, CATEGORIES };
