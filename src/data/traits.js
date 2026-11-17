// Traits skew an adventurer's judgment. Each field is a modifier added to the base
// value in tuning.js. Archetypes use the same fields, and the two are summed.
//
// selfLevelBias    levels added to their own level when judging a posting
// riskWeight       multiplier on perceived risk is (1 + riskWeight)
// rewardWeight     multiplier on perceived reward is (1 + rewardWeight)
// reachUp          0..1, how readily they take a posting one rank above their record
// retreatShift     added to the party health fraction below which they turn back
// departShort      0..1, the share of empty slots they will set out without
// injuryTolerance  injury levels they will still take quests with
// lieChance        chance of overstating their level at registration
// classLieChance   chance of claiming a different class at registration
// griefWeight      multiplier on morale lost to a friend's death is (1 + griefWeight)
// friendBonus      score added to joining a party with a friend in it
export const TRAITS = {
  cautious: {
    name: 'cautious',
    selfLevelBias: -2,
    riskWeight: 0.6,
    reachUp: -0.5,
    retreatShift: 0.15,
  },
  reckless: {
    name: 'reckless',
    riskWeight: -0.5,
    reachUp: 0.5,
    retreatShift: -0.25,
    departShort: 0.34,
    injuryTolerance: 1,
  },
  greedy: {
    name: 'greedy',
    rewardWeight: 0.6,
    reachUp: 0.2,
  },
  loyal: {
    name: 'loyal',
    friendBonus: 6,
    griefWeight: 0.5,
  },
  overconfident: {
    name: 'overconfident',
    selfLevelBias: 4,
    reachUp: 0.4,
    retreatShift: -0.15,
    departShort: 0.25,
    lieChance: 0.3,
  },
  boastful: {
    name: 'boastful',
    lieChance: 0.7,
    classLieChance: 0.1,
  },
};

export const TRAIT_IDS = Object.keys(TRAITS);

// Pairs that never appear on the same adventurer.
export const TRAIT_CONFLICTS = [['cautious', 'reckless'], ['cautious', 'overconfident']];
