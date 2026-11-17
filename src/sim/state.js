// Simulation state is plain JSON-compatible data. Helpers here look things up and
// append to the event log.

import { seedFrom } from './rng.js';

export const STATE_VERSION = 2;

export function emptyState(seed) {
  return {
    version: STATE_VERSION,
    seed: String(seed),
    rng: seedFrom(seed),
    tick: 0,
    nextId: { adv: 1, quest: 1, party: 1, report: 1 },
    adventurers: [], // living and in town, sorted by id
    fallen: [], // the dead, removed from play
    departed: [], // those who left town for good
    quests: [], // sorted by id
    parties: [], // sorted by id
    reports: [], // incident reports
    journal: [], // every accepted clerk action: { t, action }
    log: [], // recent events only; see trimLog
    logBase: 0, // the number of the first event still in `log`
  };
}

export function logEvent(state, type, fields) {
  const event = { i: state.logBase + state.log.length, t: state.tick, type, ...fields };
  state.log.push(event);
  return event.i;
}

// Events keep their number for good, even after older ones are trimmed away.
export function logAt(state, i) {
  return state.log[i - state.logBase] ?? null;
}

// Drops events that nothing still needs: older than `keepTicks`, and from before the
// departure of any party still out. Incident reports are written when a party
// returns, so their evidence is always still here at that point.
export function trimLog(state, keepTicks) {
  const cutoff = state.tick - keepTicks;
  let keepFrom = state.logBase + state.log.length;
  for (const p of state.parties) if (p.status === 'away' && p.departLog < keepFrom) keepFrom = p.departLog;
  let k = 0;
  while (k < state.log.length && state.log[k].t < cutoff && state.log[k].i < keepFrom) k++;
  if (k > 0) {
    state.log.splice(0, k);
    state.logBase += k;
  }
}

export function findAdventurer(state, id) {
  return state.adventurers.find((a) => a.id === id) ?? null;
}

export function findQuest(state, id) {
  return state.quests.find((q) => q.id === id) ?? null;
}

export function findParty(state, id) {
  return state.parties.find((p) => p.id === id) ?? null;
}

export function addHistory(adv, tick, what, extra = {}) {
  adv.history.push({ t: tick, what, ...extra });
}

export function insertSorted(list, id) {
  if (list.includes(id)) return;
  list.push(id);
  list.sort((a, b) => a - b);
}
