// Hazards a quest can hold. `counter` is the job that blunts the hazard when the
// party has someone filling it well.
export const HAZARDS = {
  ambush: { name: 'ambush', counter: 'scout' },
  poison: { name: 'poison', counter: 'healer' },
  brute: { name: 'heavy hitters', counter: 'tank' },
  swarm: { name: 'swarm', counter: 'damage' },
  curse: { name: 'curse', counter: 'support' },
  undead: { name: 'undead', counter: 'healer' },
};

export const HAZARD_IDS = Object.keys(HAZARDS);

// Quest request templates. Each request rolls its hidden truth from one of these.
// ranks:      [lowest, highest] true danger rank, as indexes into RANKS
// jobs:       the jobs truly needed; the party size is the number of jobs
// hazards:    [hazard id, chance it is present]
// encounters: [min, max] encounters on the expedition
// hours:      [min, max] length of the expedition in ticks
export const QUEST_TEMPLATES = [
  {
    id: 'cellar_rats', title: 'Rats in the cellar', weight: 3,
    ranks: [0, 1], jobs: ['damage'],
    hazards: [['swarm', 0.4], ['poison', 0.2]],
    encounters: [1, 2], hours: [4, 10],
  },
  {
    id: 'lost_goat', title: 'Find a lost goat', weight: 2,
    ranks: [0, 1], jobs: ['scout'],
    hazards: [['ambush', 0.2]],
    encounters: [1, 2], hours: [6, 12],
  },
  {
    id: 'swamp_herbs', title: 'Gather swamp herbs', weight: 2,
    ranks: [0, 2], jobs: ['scout', 'damage'],
    hazards: [['poison', 0.5], ['ambush', 0.2]],
    encounters: [1, 3], hours: [8, 20],
  },
  {
    id: 'wolf_pack', title: 'Cull a wolf pack', weight: 3,
    ranks: [1, 2], jobs: ['tank', 'damage'],
    hazards: [['swarm', 0.5], ['ambush', 0.3]],
    encounters: [2, 3], hours: [10, 24],
  },
  {
    id: 'caravan_escort', title: 'Escort a caravan', weight: 2,
    ranks: [1, 3], jobs: ['tank', 'scout', 'damage'],
    hazards: [['ambush', 0.6], ['brute', 0.2]],
    encounters: [2, 4], hours: [24, 48],
  },
  {
    id: 'bandit_camp', title: 'Clear a bandit camp', weight: 2,
    ranks: [2, 3], jobs: ['tank', 'healer', 'damage'],
    hazards: [['ambush', 0.4], ['brute', 0.4], ['poison', 0.2]],
    encounters: [3, 4], hours: [18, 36],
  },
  {
    id: 'old_crypt', title: 'Seal an old crypt', weight: 1,
    ranks: [2, 4], jobs: ['tank', 'healer', 'damage', 'support'],
    hazards: [['undead', 0.8], ['curse', 0.4]],
    encounters: [3, 5], hours: [24, 48],
  },
  {
    id: 'ogre', title: 'Drive off an ogre', weight: 1,
    ranks: [3, 4], jobs: ['tank', 'healer', 'damage'],
    hazards: [['brute', 0.9]],
    encounters: [2, 3], hours: [18, 36],
  },
  {
    id: 'wyvern', title: 'Slay a wyvern', weight: 0.5,
    ranks: [4, 5], jobs: ['tank', 'healer', 'damage', 'scout'],
    hazards: [['poison', 0.6], ['brute', 0.5]],
    encounters: [3, 5], hours: [36, 72],
  },
];
