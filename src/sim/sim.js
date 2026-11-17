// The tick loop. advance() moves the world on by one hour; step() applies a batch
// of clerk actions first and records the accepted ones in the journal.

import { TUNING } from '../data/tuning.js';
import { random, randInt, chance } from './rng.js';
import { hourOf, counterOpen } from './clock.js';
import { emptyState, logEvent, findAdventurer, findParty, addHistory, trimLog } from './state.js';
import { spawnNewcomer, modifier, rankForLevel } from './adventurers.js';
import { generateRequest } from './quests.js';
import { buildDecisionView, buildSelfView } from './view.js';
import { chooseAction, decideLeave } from './decide.js';
import { formParty, joinParty, checkFormingParties } from './party.js';
import { resolveExpedition } from './expedition.js';
import { applyAction } from './actions.js';

const DAY = TUNING.clock.ticksPerDay;

export function createState(seed) {
  const state = emptyState(seed);
  for (let i = 0; i < TUNING.cast.initial; i++) spawnNewcomer(state);
  return state;
}

export function step(state, actions = []) {
  const results = actions.map((action) => {
    const result = applyAction(state, action);
    if (result.ok) state.journal.push({ t: state.tick, action: structuredClone(action) });
    return result;
  });
  advance(state);
  return results;
}

export function advance(state) {
  const hour = hourOf(state.tick);
  if (hour === 0) newDay(state);
  if (hour === TUNING.requests.hour) newRequests(state);
  if (TUNING.cast.arrivalHours.includes(hour)) arrivals(state);
  returns(state);
  recover(state);
  if (counterOpen(state.tick)) decisions(state);
  checkFormingParties(state);
  state.tick += 1;
}

function newDay(state) {
  const N = TUNING.needs;
  const M = TUNING.morale;
  const R = TUNING.requests;
  const roll = () => random(state);

  for (const q of state.quests) {
    if (q.status === 'requested' && state.tick - q.requestedAt >= R.requestExpiryDays * DAY) {
      q.status = 'lapsed';
      logEvent(state, 'request_lapsed', { quest: q.id });
    } else if (q.status === 'posted' && state.tick - q.postedAt >= R.postingExpiryDays * DAY) {
      q.status = 'expired';
      logEvent(state, 'posting_expired', { quest: q.id });
    }
  }

  const leaving = [];
  for (const adv of state.adventurers) {
    adv.shunned = adv.shunned.filter((s) => s.until > state.tick);
    if (adv.status === 'away') continue;
    adv.needs.gold -= N.dailyUpkeep + N.upkeepPerRank * rankForLevel(adv.level);
    if (adv.needs.injury > 0) {
      adv.needs.injuryDays += 1;
      if (adv.needs.injuryDays >= N.injuryHealDays) {
        adv.needs.injury -= 1;
        adv.needs.injuryDays = 0;
      }
    }
    adv.needs.morale += Math.sign(M.rest - adv.needs.morale) * Math.min(M.drift, Math.abs(M.rest - adv.needs.morale));
    if (adv.status === 'forming') continue; // committed to a party; no thought of leaving
    const daysWaiting = Math.floor((state.tick - adv.arrivedAt) / DAY);
    const reason = decideLeave(buildSelfView(adv), daysWaiting, roll);
    if (reason) leaving.push([adv, reason]);
  }
  for (const [adv, reason] of leaving) {
    adv.status = 'left';
    addHistory(adv, state.tick, 'left', { reason });
    state.adventurers = state.adventurers.filter((a) => a !== adv);
    // Those who leave keep a short record, not their whole history.
    state.departed.push({
      id: adv.id,
      name: adv.name,
      cls: adv.cls,
      level: adv.level,
      arrivedAt: adv.arrivedAt,
      leftAt: state.tick,
      reason,
      quests: adv.history.filter((h) => h.what === 'returned').length,
    });
    logEvent(state, 'leave', { adv: adv.id, reason });
  }

  archive(state);
  trimLog(state, TUNING.save.keepLogDays * DAY);
}

// Finished quests and parties leave the live state after a while. The log and the
// incident reports keep what happened.
function archive(state) {
  const cutoff = state.tick - TUNING.save.archiveAfterDays * DAY;
  const done = ['closed', 'rejected', 'lapsed', 'expired'];
  const lastTouched = (q) => Math.max(q.requestedAt, q.postedAt ?? 0, q.closedAt ?? 0);
  state.quests = state.quests.filter((q) => !(done.includes(q.status) && lastTouched(q) < cutoff));
  state.parties = state.parties.filter((p) => !((p.status === 'done' || p.status === 'disbanded') && (p.endedAt ?? 0) < cutoff));
}

function newRequests(state) {
  const [lo, hi] = TUNING.requests.perDay;
  const count = randInt(state, lo, hi);
  for (let i = 0; i < count; i++) generateRequest(state);
}

function arrivals(state) {
  const C = TUNING.cast;
  const cast = state.adventurers.length;
  let count = 0;
  if (cast < C.min) count = randInt(state, C.arrivalsBelowMin[0], C.arrivalsBelowMin[1]);
  else if (cast < C.max && chance(state, C.arrivalChanceBelowMax)) count = 1;
  for (let i = 0; i < count; i++) spawnNewcomer(state);
}

function returns(state) {
  for (const party of state.parties) {
    if (party.status === 'away' && party.returnTick === state.tick) resolveExpedition(state, party);
  }
}

function recover(state) {
  const N = TUNING.needs;
  for (const adv of state.adventurers) {
    if (adv.status === 'resting') adv.needs.fatigue = Math.max(0, adv.needs.fatigue - N.restPerTick);
    else if (adv.status === 'idle' || adv.status === 'unregistered') adv.needs.fatigue = Math.max(0, adv.needs.fatigue - N.idleRecoverPerTick);
  }
}

function decisions(state) {
  const roll = () => random(state);
  let view = null;
  const ids = state.adventurers.map((a) => a.id);
  for (const id of ids) {
    const adv = findAdventurer(state, id);
    if (!adv || (adv.status !== 'idle' && adv.status !== 'resting')) continue;
    if (adv.status === 'idle' && !chance(state, modifier(adv, 'activity'))) continue;
    if (!view) view = buildDecisionView(state);
    const choice = chooseAction(view, buildSelfView(adv), roll);
    switch (choice.type) {
      case 'rest':
        adv.status = 'resting';
        logEvent(state, 'rest', { adv: adv.id });
        view = null;
        break;
      case 'stop_rest':
        adv.status = 'idle';
        view = null;
        break;
      case 'take':
        formParty(state, adv, choice.quest, choice.slot, choice.reachedUp, choice.stopgap);
        addHistory(adv, state.tick, 'took_quest', { quest: choice.quest });
        view = null;
        break;
      case 'join':
        joinParty(state, findParty(state, choice.party), adv, choice.slot, choice.reachedUp, choice.stopgap);
        view = null;
        break;
      default:
        break;
    }
  }
}
