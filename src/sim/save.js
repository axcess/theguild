// Saves and replay. A save holds the seed, the journal of accepted clerk actions,
// and a snapshot of the state. Loading uses the snapshot. Replaying rebuilds the
// state from the seed and the journal alone, which proves the snapshot honest and
// regenerates the full event log for audits.

import { createState, step } from './sim.js';
import { STATE_VERSION, emptyState } from './state.js';

export const SAVE_FORMAT = 'theguild-save';

// FNV-1a over the state's JSON. Not cryptographic; it only has to show that two
// states are the same.
export function stateHash(state) {
  const text = JSON.stringify(state);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16).padStart(8, '0');
}

export function makeSave(state) {
  const { journal, ...snapshot } = state;
  return {
    format: SAVE_FORMAT,
    version: STATE_VERSION,
    seed: state.seed,
    tick: state.tick,
    hash: stateHash(state),
    journal: structuredClone(journal),
    snapshot: structuredClone(snapshot),
  };
}

export function loadSave(save) {
  if (save?.format !== SAVE_FORMAT) throw new Error('not a save');
  if (save.version !== STATE_VERSION) throw new Error(`save version ${save.version}, expected ${STATE_VERSION}`);
  // Rebuild in the state's own key order, so a loaded state serializes exactly like
  // the one that was saved.
  const snapshot = structuredClone(save.snapshot);
  const state = {};
  for (const key of Object.keys(emptyState(save.seed))) {
    state[key] = key === 'journal' ? structuredClone(save.journal) : snapshot[key];
  }
  for (const key of Object.keys(snapshot)) if (!(key in state)) state[key] = snapshot[key];
  return state;
}

// Rebuilds a run from its seed and journal up to `toTick`. `onEvent` sees every
// event as it is logged, before any trimming.
export function replay(seed, journal, toTick, onEvent = null) {
  const state = createState(seed);
  let next = 0;
  let seen = -1;
  const report = () => {
    if (!onEvent) return;
    for (const e of state.log) if (e.i > seen) onEvent(e);
    if (state.log.length) seen = state.log[state.log.length - 1].i;
  };
  report();
  while (state.tick < toTick) {
    const actions = [];
    while (next < journal.length && journal[next].t === state.tick) actions.push(structuredClone(journal[next++].action));
    const results = step(state, actions);
    if (results.some((r) => !r.ok)) throw new Error(`journal action refused at tick ${state.tick - 1}`);
    report();
  }
  return state;
}

// True if replaying the save's journal reproduces its state exactly.
export function verifySave(save) {
  const state = replay(save.seed, save.journal, save.tick);
  return stateHash(state) === save.hash;
}
