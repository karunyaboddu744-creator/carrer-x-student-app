export const CREDIT_RULES = {
  profile: {
    complete: 50,
    update: 10,
  },

  assessment: {
    start: 10,
    complete: 100,
    highScore: 50,
  },

  skills: {
    add: 20,
    verify: 75,
    improve: 30,
  },

  projects: {
    create: 50,
    submit: 100,
    complete: 150,
  },

  challenges: {
    beginner: 50,
    intermediate: 100,
    advanced: 150,
    hardcore: 250,
  },

  learning: {
    lessonComplete: 25,
    moduleComplete: 75,
    courseComplete: 200,
  },

  companyReadiness: {
    analyze: 25,
    improveSkill: 40,
    reachTarget: 150,
  },

  roadmap: {
    milestone: 50,
    complete: 150,
  },

  daily: {
    login: 10,
    streak3: 50,
    streak7: 100,
    streak30: 500,
  },
};

export const LEVELS = [
  {
    name: 'Explorer',
    minCredits: 0,
    icon: '🌱',
  },
  {
    name: 'Builder',
    minCredits: 250,
    icon: '🛠️',
  },
  {
    name: 'Skill Seeker',
    minCredits: 750,
    icon: '🧠',
  },
  {
    name: 'Career Ready',
    minCredits: 1500,
    icon: '🚀',
  },
  {
    name: 'CARRER-X Pro',
    minCredits: 3000,
    icon: '🏆',
  },
];

export function getLevel(credits = 0) {
  const currentCredits = Number(credits) || 0;

  let currentLevel = LEVELS[0];

  for (const level of LEVELS) {
    if (currentCredits >= level.minCredits) {
      currentLevel = level;
    }
  }

  return currentLevel;
}

export function getNextLevel(credits = 0) {
  const currentCredits = Number(credits) || 0;

  return (
    LEVELS.find((level) => level.minCredits > currentCredits) ||
    null
  );
}

export function getLevelProgress(credits = 0) {
  const currentCredits = Number(credits) || 0;
  const currentLevel = getLevel(currentCredits);
  const nextLevel = getNextLevel(currentCredits);

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      progress: 100,
      remaining: 0,
    };
  }

  const levelRange =
    nextLevel.minCredits - currentLevel.minCredits;

  const earnedInLevel =
    currentCredits - currentLevel.minCredits;

  const progress =
    levelRange > 0
      ? Math.min(
          100,
          Math.round((earnedInLevel / levelRange) * 100)
        )
      : 100;

  return {
    currentLevel,
    nextLevel,
    progress,
    remaining: Math.max(
      0,
      nextLevel.minCredits - currentCredits
    ),
  };
}

export function formatCredits(value = 0) {
  return new Intl.NumberFormat('en-IN').format(
    Number(value) || 0
  );
}