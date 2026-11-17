// MMO player archetypes. They use the same modifier fields as traits (see traits.js),
// plus `activity`, the chance per hour that an idle adventurer looks at the board,
// and `dailyLeaveChance`, a chance each day of simply moving on.
export const ARCHETYPES = {
  grinder: {
    name: 'grinder',
    weight: 3,
    activity: 0.4,
    rewardWeight: -0.2,
  },
  speedrunner: {
    name: 'speedrunner',
    weight: 2,
    activity: 0.35,
    reachUp: 0.3,
    departShort: 0.25,
  },
  roleplayer: {
    name: 'roleplayer',
    weight: 2,
    activity: 0.25,
    friendBonus: 6,
    griefWeight: 0.5,
  },
  lootGoblin: {
    name: 'loot goblin',
    weight: 2,
    activity: 0.3,
    rewardWeight: 0.5,
  },
  weekendCasual: {
    name: 'weekend casual',
    weight: 2,
    activity: 0.12,
    dailyLeaveChance: 0.01,
  },
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES);
