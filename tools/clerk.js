// A scripted stand-in for the player. It lives outside the simulation core and only
// sends actions, the same way the desk interface will.
//
// Registration copies what the newcomer claims, with the clerk's own slips on top.
// Postings start from the request's truth (standing in for a clerk who investigates)
// and then lose accuracy at `errorRate`: ranks and levels set too low, hazards left
// off, needed classes left out. The clerk has its own seeded generator so its
// choices never disturb the simulation's rolls.

import { CLASSES, CLASS_IDS } from '../src/data/classes.js';
import { RANKS } from '../src/data/ranks.js';
import { seedFrom, randInt, chance, pick } from '../src/sim/rng.js';
import { counterOpen, rankForLevel } from '../src/sim/index.js';

export function createClerk({ seed, errorRate }) {
  return { rng: seedFrom(`clerk:${seed}`), errorRate };
}

function bestClassesFor(job) {
  return CLASS_IDS.filter((c) => CLASSES[c].best === job);
}

export function clerkActions(clerk, state) {
  if (!counterOpen(state.tick)) return [];
  const e = clerk.errorRate;
  const actions = [];

  for (const adv of state.adventurers) {
    if (adv.status !== 'unregistered') continue;
    let rank = rankForLevel(adv.claim.level);
    if (chance(clerk, e)) rank = Math.min(RANKS.length - 1, rank + 1);
    let cls = adv.claim.cls;
    if (chance(clerk, e / 2)) cls = pick(clerk, CLASS_IDS.filter((c) => c !== cls));
    actions.push({ type: 'register', adv: adv.id, cls, rank });
  }

  const topRank = Math.max(0, ...state.adventurers.filter((a) => a.record).map((a) => a.record.rank));
  for (const q of state.quests) {
    if (q.status !== 'requested') continue;
    const t = q.truth;
    if (t.rank > topRank + 1) {
      actions.push({ type: 'reject', quest: q.id });
      continue;
    }
    let rank = t.rank;
    let level = t.level;
    if (chance(clerk, e)) {
      const drop = Math.min(rank, randInt(clerk, 1, 2));
      rank -= drop;
      level = Math.max(1, level - drop * 5);
    }
    if (chance(clerk, e)) level = Math.max(1, level - randInt(clerk, 2, 5));
    const hazards = t.hazards.filter(() => !chance(clerk, e));
    const slots = t.jobs.map((job) => (chance(clerk, e) ? [] : bestClassesFor(job)));
    actions.push({ type: 'post', quest: q.id, posting: { rank, level, hazards, slots, reward: t.pay } });
  }
  return actions;
}
