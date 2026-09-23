const CATEGORIES = ["name", "place", "thing", "animal", "food"];

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

function parseValidationOutput(outputText) {
  if (typeof outputText !== "string") {
    return null;
  }

  const cleaned = outputText
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse(jsonMatch[0]);
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
    const result = Object.fromEntries(CATEGORIES.map((category) => [category, false]));
    const pending = [];

    for (const category of CATEGORIES) {
      const answer = normalizeText(source[category]);

      if (!answer || !startsWithLetter(answer, letter)) {
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

    try {
      const answerLines = pending
        .map(
          ({ category, answer }) =>
            category.charAt(0).toUpperCase() +
            category.slice(1) +
            ": " +
            answer
        )
        .join("\n");

      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        input:
          "You are the answer judge for a friendly Name-Place-Thing style word game.\n\n" +
          "Round letter: " +
          normalizeText(letter) +
          "\n\n" +
          "Validate each answer independently. The server already checks that every answer starts with the round letter. Your job is only to decide whether the answer genuinely fits its category.\n\n" +
          "IMPORTANT: Be permissive, not overly strict. Accept valid and understandable examples even when they are less common, regional, proper nouns, alternate spellings, species names, cities/villages, landmarks, foods/ingredients, or ordinary objects. Do not reject an answer just because you personally do not recognize it immediately.\n\n" +
          "Return false only when the answer is clearly nonsense, clearly belongs to another category, or is not a meaningful example of the requested category.\n\n" +
          "Category meanings:\n" +
          "- Name: a person's given name, surname, or commonly used personal name.\n" +
          "- Place: a real geographic place such as a city, town, village, state, country, landmark, or region.\n" +
          "- Thing: a tangible object, item, product, or ordinary thing.\n" +
          "- Animal: an animal or recognized animal species/breed.\n" +
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
          "\n\nReturn ONLY valid JSON with exactly these keys: " +
          pending.map(({ category }) => category).join(", ") +
          ". Each value must be true or false. No markdown, no explanation."
      });

      const parsed = parseValidationOutput(response?.output_text);

      if (!parsed || typeof parsed !== "object") {
        throw new Error("AI validator returned invalid JSON.");
      }

      for (const item of pending) {
        const value = normalizeModelResult(parsed[item.category]);
        result[item.category] = value;
        cacheSet(item.key, value);
      }

      return result;
    } catch (error) {
      console.error("AI validation error:", error.message);

      // Keep all answers that pass the authoritative letter check as false
      // when the AI service fails. This avoids awarding points on an
      // unverified category match while keeping the game round alive.
      return result;
    }
  }

  async function validateAnswer(answer, category, letter) {
    const result = await validateAnswers({ [category]: answer }, letter);
    return Boolean(result[category]);
  }

  return { validateAnswers, validateAnswer };
}

module.exports = { createAnswerValidator, CATEGORIES };
