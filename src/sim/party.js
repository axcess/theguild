// Party formation and departure.

import { TUNING } from '../data/tuning.js';
import { fitOf } from './adventurers.js';
import { buildSelfView } from './view.js';
import { decideAfterWaiting } from './decide.js';
import { logEvent, findAdventurer, findQuest, addHistory } from './state.js';

export function formParty(state, adv, questId, slot, reachedUp, stopgap = false) {
  const quest = findQuest(state, questId);
  const party = {
    id: state.nextId.party++,
    quest: questId,
    leader: adv.id,
    slots: quest.posting.slots.map((classes) => ({ classes: [...classes], member: null, reachedUp: false })),
    status: 'forming', // forming, away, done, disbanded
    formedAt: state.tick,
    members: [],
    assign: null,
    missing: null,
    short: false,
    departLog: null,
    returnTick: null,
    endedAt: null,
  };
  state.parties.push(party);
  quest.status = 'taken';
  quest.party = party.id;
  logEvent(state, 'party_formed', { party: party.id, quest: questId, leader: adv.id, slot, reachedUp, stopgap });
  seat(state, party, adv, slot, reachedUp);
  return party;
}

export function joinParty(state, party, adv, slot, reachedUp, stopgap = false) {
  logEvent(state, 'party_join', { party: party.id, quest: party.quest, adv: adv.id, slot, reachedUp, stopgap });
  seat(state, party, adv, slot, reachedUp);
}

function seat(state, party, adv, slot, reachedUp) {
  party.slots[slot].member = adv.id;
  party.slots[slot].reachedUp = reachedUp;
  party.members.push(adv.id);
  adv.status = 'forming';
  adv.party = party.id;
  addHistory(adv, state.tick, 'joined_party', { quest: party.quest });
}

// Assign the truly needed jobs to members by true class, choosing the assignment
// that covers the most jobs, then has the highest total fit. Members left over fill
// their own best job. Parties are small, so every assignment is tried, in a fixed
// order, and the first best one wins.
export function assignJobs(members, jobs) {
  const sorted = [...members].sort((a, b) => a.id - b.id);
  const covered = TUNING.fit.coveredAt;
  let best = null;
  const pickFor = (j, used, chosen) => {
    if (j === jobs.length) {
      let count = 0;
      let total = 0;
      chosen.forEach((idx, k) => {
        if (idx < 0) return;
        const f = fitOf(sorted[idx].cls, jobs[k]);
        total += f;
        if (f >= covered) count += 1;
      });
      if (!best || count > best.count || (count === best.count && total > best.total + 1e-9)) {
        best = { count, total, chosen: [...chosen] };
      }
      return;
    }
    for (let i = 0; i < sorted.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      chosen.push(i);
      pickFor(j + 1, used, chosen);
      chosen.pop();
      used[i] = false;
    }
    // Leaving this job empty can free someone to cover a later one.
    chosen.push(-1);
    pickFor(j + 1, used, chosen);
    chosen.pop();
  };
  pickFor(0, sorted.map(() => false), []);

  const assign = {};
  const fit = {};
  const missing = [];
  best.chosen.forEach((idx, k) => {
    const job = jobs[k];
    if (idx < 0) {
      missing.push(job);
      return;
    }
    const m = sorted[idx];
    assign[m.id] = job;
    fit[m.id] = fitOf(m.cls, job);
    if (fit[m.id] < covered) missing.push(job);
  });
  for (const m of sorted) {
    if (m.id in assign) continue;
    assign[m.id] = null;
    fit[m.id] = TUNING.fit.best;
  }
  return { assign, fit, missing };
}

function depart(state, party, short) {
  const quest = findQuest(state, party.quest);
  const members = party.slots.filter((s) => s.member !== null).map((s) => findAdventurer(state, s.member));
  const { assign, fit, missing } = assignJobs(members, quest.truth.jobs);
  party.assign = assign;
  party.fit = fit;
  party.missing = missing;
  party.short = short;
  party.members = members.map((m) => m.id);
  party.status = 'away';
  party.returnTick = state.tick + quest.truth.durationTicks;
  quest.status = 'away';

  // The depart record is the reference point for incident reports, so it holds a
  // full snapshot of the posting, the truth and the party as they set out.
  party.departLog = logEvent(state, 'depart', {
    party: party.id,
    quest: quest.id,
    title: quest.title,
    leader: party.leader,
    short,
    posting: structuredClone(quest.posting),
    truth: structuredClone(quest.truth),
    missingJobs: [...missing],
    members: party.slots
      .filter((s) => s.member !== null)
      .map((s) => {
        const m = findAdventurer(state, s.member);
        return {
          id: m.id,
          name: m.name,
          trueCls: m.cls,
          level: m.level,
          injury: m.needs.injury,
          recordCls: m.record.cls,
          recordRank: m.record.rank,
          claimCls: m.claim.cls,
          claimLevel: m.claim.level,
          traits: [...m.traits],
          archetype: m.archetype,
          job: assign[m.id],
          fit: fit[m.id],
          reachedUp: s.reachedUp,
        };
      }),
  });
  for (const m of members) {
    m.status = 'away';
    addHistory(m, state.tick, 'departed', { quest: quest.id });
  }
}

function disband(state, party) {
  const quest = findQuest(state, party.quest);
  party.status = 'disbanded';
  party.endedAt = state.tick;
  quest.status = 'posted';
  quest.postedAt = state.tick; // back on the board, freshly
  quest.party = null;
  for (const id of party.members) {
    const m = findAdventurer(state, id);
    m.status = 'idle';
    m.party = null;
    m.shunned.push({ quest: quest.id, until: state.tick + TUNING.decision.shunTicks });
  }
  logEvent(state, 'party_disband', { party: party.id, quest: quest.id, leader: party.leader });
}

export function checkFormingParties(state) {
  for (const party of state.parties) {
    if (party.status !== 'forming') continue;
    const filled = party.slots.filter((s) => s.member !== null).length;
    if (filled === party.slots.length) {
      depart(state, party, false);
    } else if (state.tick - party.formedAt >= TUNING.decision.formWaitTicks) {
      const leader = findAdventurer(state, party.leader);
      const choice = decideAfterWaiting(buildSelfView(leader), filled, party.slots.length);
      if (choice === 'depart') {
        logEvent(state, 'depart_short', { party: party.id, leader: leader.id, filled, size: party.slots.length });
        depart(state, party, true);
      } else {
        disband(state, party);
      }
    }
  }
}
