// The six base classes. `best` is the job the class fills fully, `also` the jobs it
// fills passably. Any other job is filled badly. Advanced branches are placeholders
// and unused until a later milestone.
export const CLASSES = {
  warrior: {
    name: 'Warrior',
    best: 'tank',
    also: ['damage'],
    key: ['str', 'vit'],
    advanced: ['Knight', 'Berserker'],
  },
  rogue: {
    name: 'Rogue',
    best: 'scout',
    also: ['damage'],
    key: ['agi', 'luk'],
    advanced: ['Assassin', 'Trickster'],
  },
  ranger: {
    name: 'Ranger',
    best: 'damage',
    also: ['scout'],
    key: ['agi', 'spi'],
    advanced: ['Sharpshooter', 'Beastmaster'],
  },
  mage: {
    name: 'Mage',
    best: 'damage',
    also: ['support'],
    key: ['int', 'spi'],
    advanced: ['Elementalist', 'Summoner'],
  },
  cleric: {
    name: 'Cleric',
    best: 'healer',
    also: ['support'],
    key: ['spi', 'vit'],
    advanced: ['Priest', 'Paladin'],
  },
  bard: {
    name: 'Bard',
    best: 'support',
    also: ['scout'],
    key: ['luk', 'int'],
    advanced: ['Skald', 'Dancer'],
  },
};

export const CLASS_IDS = Object.keys(CLASSES);
