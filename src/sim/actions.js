// Clerk actions: the only way the player (or a stand-in) changes the simulation.
// Each returns { ok, reason }. A refused action changes nothing.

import { CLASS_IDS } from '../data/classes.js';
import { RANKS } from '../data/ranks.js';
import { HAZARD_IDS } from '../data/quests.js';
import { counterOpen } from './clock.js';
import { logEvent, findAdventurer, findQuest, addHistory } from './state.js';

const refuse = (reason) => ({ ok: false, reason });

function isRank(r) {
  return Number.isInteger(r) && r >= 0 && r < RANKS.length;
}

function cleanPosting(p) {
  if (!p || typeof p !== 'object') return null;
  if (!isRank(p.rank)) return null;
  if (!Number.isInteger(p.level) || p.level < 1) return null;
  if (!Number.isInteger(p.reward) || p.reward < 0) return null;
  if (!Array.isArray(p.hazards) || !p.hazards.every((h) => HAZARD_IDS.includes(h))) return null;
  if (!Array.isArray(p.slots) || p.slots.length < 1 || p.slots.length > 6) return null;
  for (const slot of p.slots) {
    if (!Array.isArray(slot) || !slot.every((c) => CLASS_IDS.includes(c))) return null;
  }
  return {
    rank: p.rank,
    level: p.level,
    reward: p.reward,
    hazards: HAZARD_IDS.filter((h) => p.hazards.includes(h)),
    slots: p.slots.map((slot) => CLASS_IDS.filter((c) => slot.includes(c))),
    description: typeof p.description === 'string' ? p.description : '',
  };
}

export function applyAction(state, action) {
  if (!counterOpen(state.tick)) return refuse('the counter is closed');
  switch (action?.type) {
    case 'register': {
      const adv = findAdventurer(state, action.adv);
      if (!adv || adv.status !== 'unregistered') return refuse('no such newcomer');
      if (!CLASS_IDS.includes(action.cls)) return refuse('unknown class');
      if (!isRank(action.rank)) return refuse('unknown rank');
      adv.record = { cls: action.cls, rank: action.rank };
      adv.status = 'idle';
      addHistory(adv, state.tick, 'registered', { cls: action.cls, rank: action.rank });
      logEvent(state, 'register', { adv: adv.id, cls: action.cls, rank: action.rank, claim: { ...adv.claim } });
      return { ok: true };
    }
    case 'post': {
      const quest = findQuest(state, action.quest);
      if (!quest || quest.status !== 'requested') return refuse('no such request');
      const posting = cleanPosting(action.posting);
      if (!posting) return refuse('invalid posting');
      quest.posting = posting;
      quest.status = 'posted';
      quest.postedAt = state.tick;
      logEvent(state, 'post', { quest: quest.id, posting: structuredClone(posting) });
      return { ok: true };
    }
    case 'reject': {
      const quest = findQuest(state, action.quest);
      if (!quest || quest.status !== 'requested') return refuse('no such request');
      quest.status = 'rejected';
      logEvent(state, 'reject', { quest: quest.id });
      return { ok: true };
    }
    default:
      return refuse('unknown action');
  }
}
