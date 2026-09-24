const GAME_MODES = {
  classic: {
    id: "classic",
    name: "Classic",
    icon: "🎯",
    timeLimit: 60_000,
    scoreMultiplier: 1,
    description: "60 sec · standard scoring",
  },
  blitz: {
    id: "blitz",
    name: "Blitz",
    icon: "⚡",
    timeLimit: 30_000,
    scoreMultiplier: 1,
    description: "30 sec · pure speed",
  },
  double: {
    id: "double",
    name: "Double Points",
    icon: "💎",
    timeLimit: 60_000,
    scoreMultiplier: 2,
    description: "60 sec · every point counts twice",
  },
  hard: {
    id: "hard",
    name: "Hard Letters",
    icon: "🔥",
    timeLimit: 60_000,
    scoreMultiplier: 1,
    description: "60 sec · tricky letters only",
  },
};

const HARD_LETTERS = ["J", "Q", "V", "W", "X", "Y", "Z"];

function getGameModeConfig(modeId) {
  return GAME_MODES[modeId] || GAME_MODES.classic;
}

function getRoundLetter(modeId) {
  const mode = getGameModeConfig(modeId);

  if (mode.id === "hard") {
    return HARD_LETTERS[Math.floor(Math.random() * HARD_LETTERS.length)];
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

module.exports = {
  GAME_MODES,
  HARD_LETTERS,
  getGameModeConfig,
  getRoundLetter,
};
