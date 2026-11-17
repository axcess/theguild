// Every tunable number in the simulation. Rebalance here, not in src/sim/.
export const TUNING = {
  clock: {
    ticksPerDay: 24, // one tick is one in-game hour
    // Hours are inclusive. Any hour outside these is night, when the counter is
    // closed but expeditions carry on.
    phases: [
      { id: 'morning', from: 6, to: 11 },
      { id: 'midday', from: 12, to: 16 },
      { id: 'evening', from: 17, to: 21 },
    ],
  },

  cast: {
    initial: 14, // newcomers waiting at the door on day one
    min: 20,
    max: 40,
    arrivalHours: [7, 13],
    arrivalsBelowMin: [0, 2], // per arrival hour while the cast is under min
    arrivalChanceBelowMax: 0.3, // per arrival hour while under max
    unregisteredPatienceDays: 3,
  },

  requests: {
    hour: 6,
    perDay: [3, 5],
    payPerRankPerJob: 12, // client's true budget, before a +-20% roll
    requestExpiryDays: 3, // unposted requests lapse
    postingExpiryDays: 5, // untaken postings come down
  },

  newcomers: {
    // [weight, min level, max level]
    levelBands: [[50, 1, 4], [30, 5, 9], [15, 10, 14], [5, 15, 19]],
    twoTraitChance: 0.4,
    baseLieChance: 0.05,
    lieLevels: [3, 7],
    baseClassLieChance: 0.03,
    age: [16, 45],
    statBase: 5, // plus 1d6 per stat
    keyStatBonus: 3,
    gold: [20, 60],
    morale: [55, 80],
  },

  growth: {
    keyStatPerLevel: 2,
    otherStatChance: 0.5,
    xpPerLevel: 100, // times the current level
    xpPerRank: 25, // times (true rank + 1), scaled by encounters cleared
  },

  power: {
    perLevel: 5,
    statDivisor: 4,
    // Expected stat total at level 1 and its growth per level, used to turn a
    // quest's needed level into a threat.
    baseStatSum: 57,
    statSumPerLevel: 6,
  },

  hp: { base: 30, perVit: 3, perLevel: 6 },

  fit: { best: 1, also: 0.7, other: 0.4, coveredAt: 0.7 },

  needs: {
    dailyUpkeep: 2,
    brokeLimit: -40,
    restAbove: 60, // fatigue at which they stop to rest
    restUntil: 20,
    restPerTick: 4,
    idleRecoverPerTick: 1,
    fatiguePerExpeditionTick: 1.2,
    injuryMax: 3,
    injuryHealDays: 3,
    injuryPowerPenalty: 0.15,
    injuryHpPenalty: 0.15,
  },

  morale: {
    drift: 2, // per day, toward rest
    rest: 60,
    success: 6,
    partial: 1,
    retreat: -6,
    wiped: 0,
    injured: -4,
    friendDeath: -15,
    partyDeath: -12,
    leaveBelow: 25,
    leaveChance: 0.3,
    powerBase: 0.85,
    powerScale: 0.3,
    max: 100,
  },

  decision: {
    rewardScale: 0.5,
    riskPerLevel: 6,
    riskPerLevelSquared: 1.5, // big gaps look much worse than small ones
    hazardRisk: 3,
    injuryRisk: 6,
    boredGap: 6, // levels below them before a quest bores them
    boredPerLevel: 1.5,
    poorBelow: 20,
    poorMult: 1.5,
    reachUpPenalty: 18,
    noise: 6,
    actThreshold: 4,
    formWaitTicks: 18, // hours a leader waits for a full party
  },

  expedition: {
    threatMult: 0.72,
    threatJitter: [0.9, 1.1],
    rollSpread: [0.75, 1.25],
    failBelow: 0.7, // roll below this loses the encounter
    missingJobMult: 0.8, // party power multiplier per uncovered job
    hits: { clean: 1, hard: 2 }, // failed hits everyone
    damage: { clean: [0, 0.12], hard: [0.2, 0.45], failed: [0.4, 0.8] },
    hazard: { countered: 0.6, prepared: 0.85, unprepared: 1.5 },
    tankShare: 0.6,
    tankDamageMult: 0.7,
    healBetween: 0.25,
    save: { withHealer: 0.65, without: 0.3, perLuck: 0.01 },
    retreatAt: 0.45, // party health fraction below which a neutral leader turns back
    injuryBelow: 0.35, // health fraction at return that leaves an injury
    savedInjury: 2,
    partialPay: 0.5,
  },
};
