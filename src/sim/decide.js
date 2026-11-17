// Adventurer decisions. These functions see only the decision view (postings and
// guild records) and the adventurer's own knowledge of themselves. They are never
// handed a quest's hidden facts, and must not import anything that holds them.
//
// `roll` is a function returning a number in [0, 1) from the seeded generator.

import { TUNING } from '../data/tuning.js';
import { modifier, fitOf, bestJob } from './adventurers.js';

const D = TUNING.decision;

// The first empty slot this guild-recorded class may fill: a slot naming the class,
// else a slot open to any class. Failing both, a named slot whose job this class
// can fill passably, as long as nobody of a named class is free to take it.
// `freeClasses` is the recorded classes of the other adventurers free right now.
// Returns { slot, stopgap }, with slot -1 if none.
export function openSlot(slots, recordCls, freeClasses = []) {
  const named = slots.findIndex((s) => s.member === null && s.classes.includes(recordCls));
  if (named >= 0) return { slot: named, stopgap: false };
  const any = slots.findIndex((s) => s.member === null && s.classes.length === 0);
  if (any >= 0) return { slot: any, stopgap: false };
  const stopgap = slots.findIndex(
    (s) =>
      s.member === null &&
      s.classes.length > 0 &&
      fitOf(recordCls, bestJob(s.classes[0])) >= TUNING.fit.coveredAt &&
      !freeClasses.some((c) => s.classes.includes(c)),
  );
  return { slot: stopgap, stopgap: stopgap >= 0 };
}

function injuryTolerance(self) {
  return modifier(self, 'injuryTolerance');
}

// How attractive a posting looks to this adventurer, or null if their record's rank
// does not allow it.
export function scorePosting(self, posting, roll) {
  const recordRank = self.record.rank;
  if (posting.rank > recordRank + 1) return null;
  const reachedUp = posting.rank > recordRank;

  const perceivedLevel = self.level + modifier(self, 'selfLevelBias');
  const gap = posting.level - perceivedLevel;
  const riskMult = Math.max(0, 1 + modifier(self, 'riskWeight'));
  const risk =
    (Math.max(0, gap) * D.riskPerLevel + Math.max(0, gap) ** 2 * D.riskPerLevelSquared + posting.hazards.length * D.hazardRisk) *
      riskMult +
    self.needs.injury * D.injuryRisk;

  const share = posting.reward / Math.max(1, posting.slots.length);
  const greed = Math.max(0, 1 + modifier(self, 'rewardWeight'));
  const need = self.needs.gold < D.poorBelow ? D.poorMult : 1;
  const boredom = Math.max(0, -gap - D.boredGap) * D.boredPerLevel;

  let score = share * D.rewardScale * greed * need - risk - boredom + roll() * D.noise;
  if (reachedUp) score -= D.reachUpPenalty * Math.max(0, 1 - modifier(self, 'reachUp'));
  return { score, reachedUp };
}

export function chooseAction(view, self, roll) {
  const F = TUNING.needs;
  const tolerance = injuryTolerance(self);

  if (self.status === 'resting') {
    if (self.needs.fatigue <= F.restUntil && self.needs.injury <= tolerance) return { type: 'stop_rest' };
    return { type: 'keep_resting' };
  }
  if (self.needs.fatigue >= F.restAbove || self.needs.injury > tolerance) return { type: 'rest' };

  const freeClasses = view.roster.filter((r) => r.id !== self.id).map((r) => r.recordCls);
  const shunned = (quest) => self.shunned.some((s) => s.quest === quest);

  let best = null;
  for (const entry of view.board) {
    if (shunned(entry.quest)) continue;
    const slots = entry.posting.slots.map((classes) => ({ classes, member: null }));
    const { slot, stopgap } = openSlot(slots, self.record.cls, freeClasses);
    if (slot < 0) continue;
    const s = scorePosting(self, entry.posting, roll);
    if (s && (!best || s.score > best.score)) {
      best = { type: 'take', quest: entry.quest, slot, stopgap, score: s.score, reachedUp: s.reachedUp };
    }
  }
  for (const entry of view.forming) {
    if (shunned(entry.quest)) continue;
    const { slot, stopgap } = openSlot(entry.slots, self.record.cls, freeClasses);
    if (slot < 0) continue;
    const s = scorePosting(self, entry.posting, roll);
    if (!s) continue;
    const hasFriend = entry.slots.some((sl) => sl.member !== null && self.friends.includes(sl.member));
    const score = s.score + D.joinBonus + (hasFriend ? modifier(self, 'friendBonus') : 0);
    if (!best || score > best.score) {
      best = { type: 'join', party: entry.party, slot, stopgap, score, reachedUp: s.reachedUp };
    }
  }
  if (best && best.score >= D.actThreshold) return best;
  return { type: 'wait' };
}

// Called once a day for adventurers in town and not committed to a party.
export function decideLeave(self, daysUnregistered, roll) {
  const M = TUNING.morale;
  if (self.status === 'unregistered') {
    if (daysUnregistered >= TUNING.cast.unregisteredPatienceDays) return 'never registered';
    return null;
  }
  if (self.needs.gold < TUNING.needs.brokeLimit) return 'broke';
  if (self.needs.morale < M.leaveBelow && roll() < M.leaveChance) return 'lost heart';
  if (roll() < modifier(self, 'dailyLeaveChance')) return 'moved on';
  return null;
}

// Between encounters, the party leader decides whether to carry on.
export function decidePressOn(leader, healthFraction) {
  const neutral = TUNING.expedition.retreatAt;
  const threshold = neutral + modifier(leader, 'retreatShift');
  return { pressOn: healthFraction >= threshold, threshold, neutral };
}

// A forming party has waited long enough. The leader sets out short-handed or
// gives up.
export function decideAfterWaiting(leader, filled, size) {
  const appetite = Math.min(1, modifier(leader, 'departShort'));
  if (filled > 0 && (size - filled) / size <= appetite) return 'depart';
  return 'disband';
}
