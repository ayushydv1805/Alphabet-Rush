export const GAME_MODES = [
  {
    id: "classic",
    name: "Classic",
    icon: "🎯",
    timeLimit: 60,
    scoreMultiplier: 1,
    description: "60 sec · standard scoring",
  },
  {
    id: "blitz",
    name: "Blitz",
    icon: "⚡",
    timeLimit: 30,
    scoreMultiplier: 1,
    description: "30 sec · pure speed",
  },
  {
    id: "double",
    name: "Double Points",
    icon: "💎",
    timeLimit: 60,
    scoreMultiplier: 2,
    description: "60 sec · every point counts twice",
  },
  {
    id: "hard",
    name: "Hard Letters",
    icon: "🔥",
    timeLimit: 60,
    scoreMultiplier: 1,
    description: "60 sec · tricky letters only",
  },
];

export const ROUND_OPTIONS = [5, 10, 15, 20];

export const ANSWER_FIELDS = [
  { name: "name", label: "Name", placeholder: "Enter a name" },
  { name: "place", label: "Place", placeholder: "Enter a place" },
  { name: "thing", label: "Thing", placeholder: "Enter a thing" },
  { name: "animal", label: "Animal", placeholder: "Enter an animal" },
  { name: "food", label: "Food", placeholder: "Enter a food" },
];

export const MAX_PLAYERS = 10;
export const DEFAULT_TIME_LIMIT = 60;
