export const AVATARS = [
  { id: "spark", icon: "⚡", name: "Spark", unlockLevel: 1 },
  { id: "fox", icon: "🦊", name: "Fox", unlockLevel: 2 },
  { id: "panda", icon: "🐼", name: "Panda", unlockLevel: 4 },
  { id: "robot", icon: "🤖", name: "Robot", unlockLevel: 6 },
  { id: "dragon", icon: "🐉", name: "Dragon", unlockLevel: 9 },
  { id: "crown", icon: "👑", name: "Crown", unlockLevel: 12 },
];

export const TITLES = [
  { id: "rookie", name: "Rush Rookie", unlockLevel: 1 },
  { id: "quick", name: "Quick Thinker", unlockLevel: 3 },
  { id: "wordsmith", name: "Wordsmith", unlockLevel: 5 },
  { id: "streak", name: "Streak Hunter", unlockLevel: 8 },
  { id: "legend", name: "Rush Legend", unlockLevel: 12 },
];

const PROFILE_KEY = "alphabet-rush-profile";

const DEFAULT_PROFILE = {
  name: "",
  avatarId: "spark",
  titleId: "rookie",
  xp: 0,
  level: 1,
  totalGames: 0,
  wins: 0,
  totalRounds: 0,
  totalPoints: 0,
  perfectRounds: 0,
  currentStreak: 0,
  bestStreak: 0,
  processedRounds: [],
  processedGames: [],
};

function cloneDefaultProfile() {
  return {
    ...DEFAULT_PROFILE,
    processedRounds: [],
    processedGames: [],
  };
}

export function getLevelFromXp(xp) {
  return Math.floor(Math.max(0, Number(xp) || 0) / 100) + 1;
}

export function getLevelProgress(xp) {
  const normalizedXp = Math.max(0, Number(xp) || 0);
  return normalizedXp % 100;
}

function normalizeStoredProfile(raw) {
  const profile = {
    ...cloneDefaultProfile(),
    ...(raw && typeof raw === "object" ? raw : {}),
  };

  profile.xp = Math.max(0, Number(profile.xp) || 0);
  profile.level = getLevelFromXp(profile.xp);
  profile.totalGames = Math.max(0, Number(profile.totalGames) || 0);
  profile.wins = Math.max(0, Number(profile.wins) || 0);
  profile.totalRounds = Math.max(0, Number(profile.totalRounds) || 0);
  profile.totalPoints = Math.max(0, Number(profile.totalPoints) || 0);
  profile.perfectRounds = Math.max(0, Number(profile.perfectRounds) || 0);
  profile.currentStreak = Math.max(0, Number(profile.currentStreak) || 0);
  profile.bestStreak = Math.max(0, Number(profile.bestStreak) || 0);
  profile.processedRounds = Array.isArray(profile.processedRounds)
    ? profile.processedRounds.slice(-100)
    : [];
  profile.processedGames = Array.isArray(profile.processedGames)
    ? profile.processedGames.slice(-30)
    : [];

  return profile;
}

export function getProfile() {
  if (typeof window === "undefined") {
    return cloneDefaultProfile();
  }

  try {
    return normalizeStoredProfile(
      JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null")
    );
  } catch {
    return cloneDefaultProfile();
  }
}

export function saveProfile(profile) {
  const normalized = normalizeStoredProfile(profile);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));
  }

  return normalized;
}

export function updateProfile(changes) {
  return saveProfile({
    ...getProfile(),
    ...changes,
  });
}

export function getAvatar(avatarId) {
  return AVATARS.find((avatar) => avatar.id === avatarId) || AVATARS[0];
}

export function getTitle(titleId) {
  return TITLES.find((title) => title.id === titleId) || TITLES[0];
}

export function isAvatarUnlocked(avatar, level) {
  return level >= avatar.unlockLevel;
}

export function isTitleUnlocked(title, level) {
  return level >= title.unlockLevel;
}

export function getRoundXp(roundPoints, currentStreak, isWinner) {
  let xp = Math.max(0, Number(roundPoints) || 0) * 10;

  if (roundPoints === 5) xp += 20;
  if (isWinner) xp += 15;
  if (currentStreak >= 3) xp += 10;

  return xp;
}

export function recordRoundResult({
  roundKey,
  roundPoints,
  currentStreak,
  perfectRound,
  isWinner,
}) {
  const profile = getProfile();

  if (!roundKey || profile.processedRounds.includes(roundKey)) {
    return { profile, xpGained: 0 };
  }

  const points = Math.max(0, Number(roundPoints) || 0);
  const streak = Math.max(0, Number(currentStreak) || 0);
  const xpGained = getRoundXp(points, streak, Boolean(isWinner));

  const nextProfile = {
    ...profile,
    xp: profile.xp + xpGained,
    totalRounds: profile.totalRounds + 1,
    totalPoints: profile.totalPoints + points,
    perfectRounds: profile.perfectRounds + (perfectRound ? 1 : 0),
    currentStreak: streak,
    bestStreak: Math.max(profile.bestStreak, streak),
    processedRounds: [...profile.processedRounds, roundKey].slice(-100),
  };

  nextProfile.level = getLevelFromXp(nextProfile.xp);

  return {
    profile: saveProfile(nextProfile),
    xpGained,
  };
}

export function recordGameResult({ gameKey, won }) {
  const profile = getProfile();

  if (!gameKey || profile.processedGames.includes(gameKey)) {
    return { profile, xpGained: 0 };
  }

  const xpGained = won ? 100 : 50;
  const nextProfile = {
    ...profile,
    xp: profile.xp + xpGained,
    totalGames: profile.totalGames + 1,
    wins: profile.wins + (won ? 1 : 0),
    processedGames: [...profile.processedGames, gameKey].slice(-30),
    currentStreak: 0,
  };

  nextProfile.level = getLevelFromXp(nextProfile.xp);

  return {
    profile: saveProfile(nextProfile),
    xpGained,
  };
}
