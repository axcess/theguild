// Adventurer generation and the numbers derived from an adventurer.

import { CLASSES, CLASS_IDS } from '../data/classes.js';
import { STATS } from '../data/stats.js';
import { RANKS } from '../data/ranks.js';
import { TRAITS, TRAIT_IDS, TRAIT_CONFLICTS } from '../data/traits.js';
import { ARCHETYPES, ARCHETYPE_IDS } from '../data/archetypes.js';
import { FIRST_NAMES, SURNAMES } from '../data/names.js';
import { TUNING } from '../data/tuning.js';
import { randInt, chance, pick, weightedPick } from './rng.js';
import { logEvent, addHistory } from './state.js';

export function rankForLevel(level) {
  let rank = 0;
  for (let i = 0; i < RANKS.length; i++) if (level >= RANKS[i].minLevel) rank = i;
  return rank;
}

// Sum of a trait/archetype modifier across everything that shapes this adventurer.
export function modifier(adv, key) {
  let total = 0;
  for (const t of adv.traits) total += TRAITS[t][key] ?? 0;
  total += ARCHETYPES[adv.archetype][key] ?? 0;
  return total;
}

export function fitOf(cls, job) {
  const c = CLASSES[cls];
  if (c.best === job) return TUNING.fit.best;
  if (c.also.includes(job)) return TUNING.fit.also;
  return TUNING.fit.other;
}

export function bestJob(cls) {
  return CLASSES[cls].best;
}

export function maxHp(adv) {
  const H = TUNING.hp;
  return H.base + adv.stats.vit * H.perVit + adv.level * H.perLevel;
}

function statSum(adv) {
  let total = 0;
  for (const s of STATS) total += adv.stats[s];
  return total;
}

export function rawPower(adv) {
  const P = TUNING.power;
  return adv.level * P.perLevel + statSum(adv) / P.statDivisor;
}

// The power of a typical adventurer of this level, used to size a quest's threat.
export function expectedPower(level) {
  const P = TUNING.power;
  return level * P.perLevel + (P.baseStatSum + (level - 1) * P.statSumPerLevel) / P.statDivisor;
}

export function condition(adv) {
  const N = TUNING.needs;
  const M = TUNING.morale;
  return (1 - adv.needs.injury * N.injuryPowerPenalty) * (M.powerBase + (adv.needs.morale / 100) * M.powerScale);
}

function growStats(state, stats, cls) {
  const G = TUNING.growth;
  for (const s of STATS) {
    if (CLASSES[cls].key.includes(s)) stats[s] += G.keyStatPerLevel;
    else if (chance(state, G.otherStatChance)) stats[s] += 1;
  }
}

function pickTraits(state) {
  const count = chance(state, TUNING.newcomers.twoTraitChance) ? 2 : 1;
  const traits = [];
  while (traits.length < count) {
    const options = TRAIT_IDS.filter(
      (t) => !traits.includes(t) && !TRAIT_CONFLICTS.some((pair) => pair.includes(t) && traits.some((o) => pair.includes(o))),
    );
    traits.push(pick(state, options));
  }
  return traits.sort((a, b) => TRAIT_IDS.indexOf(a) - TRAIT_IDS.indexOf(b));
}

export function spawnNewcomer(state) {
  const N = TUNING.newcomers;
  const id = state.nextId.adv++;
  const cls = pick(state, CLASS_IDS);
  const band = weightedPick(state, N.levelBands, (b) => b[0]);
  const level = randInt(state, band[1], band[2]);

  const stats = {};
  for (const s of STATS) {
    stats[s] = N.statBase + randInt(state, 1, 6) + (CLASSES[cls].key.includes(s) ? N.keyStatBonus : 0);
  }
  for (let l = 2; l <= level; l++) growStats(state, stats, cls);

  const traits = pickTraits(state);
  const archetype = weightedPick(state, ARCHETYPE_IDS, (a) => ARCHETYPES[a].weight);
  const name = `${pick(state, FIRST_NAMES)} ${pick(state, SURNAMES)}`;

  const adv = {
    id,
    name,
    age: randInt(state, N.age[0], N.age[1]),
    cls,
    level,
    xp: 0,
    stats,
    traits,
    archetype,
    needs: {
      gold: randInt(state, N.gold[0], N.gold[1]),
      fatigue: 0,
      injury: 0,
      injuryDays: 0,
      morale: randInt(state, N.morale[0], N.morale[1]),
    },
    claim: null,
    record: null, // the guild's paperwork: { cls, rank }
    status: 'unregistered',
    party: null,
    friends: [],
    shunned: [], // quests they gave up on recently: { quest, until }
    arrivedAt: state.tick,
    history: [],
  };

  // What they tell the clerk. Some overstate their level or claim another class.
  const lieChance = N.baseLieChance + modifier(adv, 'lieChance');
  const claimLevel = chance(state, lieChance) ? level + randInt(state, N.lieLevels[0], N.lieLevels[1]) : level;
  const classLieChance = N.baseClassLieChance + modifier(adv, 'classLieChance');
  const claimCls = chance(state, classLieChance) ? pick(state, CLASS_IDS.filter((c) => c !== cls)) : cls;
  adv.claim = { cls: claimCls, level: claimLevel };

  state.adventurers.push(adv);
  addHistory(adv, state.tick, 'arrived');
  logEvent(state, 'arrive', { adv: id, name, claim: { ...adv.claim } });
  return adv;
}

export function gainXp(state, adv, xp) {
  adv.xp += xp;
  while (adv.xp >= TUNING.growth.xpPerLevel * adv.level) {
    adv.xp -= TUNING.growth.xpPerLevel * adv.level;
    adv.level += 1;
    growStats(state, adv.stats, adv.cls);
    addHistory(adv, state.tick, 'level_up', { level: adv.level });
    logEvent(state, 'level_up', { adv: adv.id, level: adv.level });
  }
}
