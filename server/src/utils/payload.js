const { getGameModeConfig } = require("../game/gameModes");

const ROOM_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const CATEGORIES = ["name", "place", "thing", "animal", "food"];
const MAX_NAME_LENGTH = 20;
const MAX_COSMETIC_LENGTH = 32;
const MAX_ANSWER_LENGTH = 80;

function normalizeRoomCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function isValidRoomCode(value) {
  return ROOM_CODE_PATTERN.test(normalizeRoomCode(value));
}

function normalizeName(value) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH)
    : "";
}

function normalizeCosmetic(value, fallback, maxLength = MAX_COSMETIC_LENGTH) {
  if (typeof value !== "string") return fallback;
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength) || fallback;
}

function normalizeGameMode(value) {
  return getGameModeConfig(
    typeof value === "string" ? value.trim().toLowerCase() : ""
  ).id;
}

function normalizeAnswers(value) {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      typeof source[category] === "string"
        ? source[category].trim().replace(/\s+/g, " ").slice(0, MAX_ANSWER_LENGTH)
        : "",
    ])
  );
}

function isValidAnswerPayload(value) {
  return Boolean(
    value && typeof value === "object" && !Array.isArray(value)
  );
}

module.exports = {
  CATEGORIES,
  MAX_ANSWER_LENGTH,
  normalizeRoomCode,
  isValidRoomCode,
  normalizeName,
  normalizeCosmetic,
  normalizeGameMode,
  normalizeAnswers,
  isValidAnswerPayload,
};
