// Simulation state is plain JSON-compatible data. Helpers here look things up and
// append to the event log.

import { seedFrom } from './rng.js';

export const STATE_VERSION = 1;

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
    log: [],
  };
}

export function logEvent(state, type, fields) {
  const event = { i: state.log.length, t: state.tick, type, ...fields };
  state.log.push(event);
  return event.i;
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
