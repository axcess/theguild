// Expedition resolution: a chain of encounters tested against the quest's truth.
// Everything a report might need is logged as it happens.

import { HAZARDS } from '../data/quests.js';
import { TUNING } from '../data/tuning.js';
import { random, randInt, randRange, chance, pick } from './rng.js';
import { maxHp, rawPower, expectedPower, condition, gainXp, modifier } from './adventurers.js';
import { decidePressOn } from './decide.js';
import { logEvent, findAdventurer, findQuest, addHistory, insertSorted } from './state.js';
import { deriveIncident } from './reports.js';

const E = TUNING.expedition;

function memberFor(party, job, alive) {
  return alive.find((m) => party.assign[m.id] === job && !party.missing.includes(job)) ?? null;
}

export function resolveExpedition(state, party) {
  const quest = findQuest(state, party.quest);
  const { truth, posting } = quest;
  const members = party.members.map((id) => findAdventurer(state, id));

  const hp = {};
  for (const m of members) {
    const max = maxHp(m);
    hp[m.id] = { max, cur: Math.round(max * (1 - m.needs.injury * TUNING.needs.injuryHpPenalty)) };
  }
  const extraInjury = {};
  const dead = [];

  // Spread the hazards over the encounters.
  const hazardsAt = Array.from({ length: truth.encounters }, () => []);
  for (const h of truth.hazards) hazardsAt[randInt(state, 0, truth.encounters - 1)].push(h);

  let cleared = 0;
  let outcome = null;
  const living = () => members.filter((m) => !dead.includes(m.id));

  for (let n = 0; n < truth.encounters; n++) {
    const alive = living();
    let power = 0;
    for (const m of alive) power += rawPower(m) * party.fit[m.id] * condition(m);
    power *= E.missingJobMult ** party.missing.length;
    const threat = E.threatMult * truth.jobs.length * expectedPower(truth.level) * randRange(state, E.threatJitter[0], E.threatJitter[1]);
    const ratio = power / threat;
    const roll = ratio * randRange(state, E.rollSpread[0], E.rollSpread[1]);
    const severity = roll >= 1 ? 'clean' : roll >= E.failBelow ? 'hard' : 'failed';

    const hazards = hazardsAt[n].map((h) => ({
      hazard: h,
      countered: memberFor(party, HAZARDS[h].counter, alive) !== null,
      posted: posting.hazards.includes(h),
    }));
    let mult = 1;
    for (const x of hazards) mult *= x.countered ? E.hazard.countered : x.posted ? E.hazard.prepared : E.hazard.unprepared;

    const tank = memberFor(party, 'tank', alive);
    const hitCount = severity === 'failed' ? alive.length : Math.min(E.hits[severity], alive.length);
    const hits = [];
    for (let k = 0; k < hitCount; k++) {
      let target;
      if (severity === 'failed') target = alive[k];
      else target = tank && chance(state, E.tankShare) ? tank : pick(state, alive);
      let frac = randRange(state, E.damage[severity][0], E.damage[severity][1]) * mult;
      if (target === tank) frac *= E.tankDamageMult;
      const dmg = Math.round(frac * hp[target.id].max);
      hp[target.id].cur -= dmg;
      hits.push({ adv: target.id, dmg, hp: hp[target.id].cur });
    }
    if (severity !== 'failed') cleared++;

    logEvent(state, 'encounter', {
      party: party.id,
      quest: quest.id,
      n,
      power: Math.round(power),
      threat: Math.round(threat),
      ratio: round2(ratio),
      roll: round2(roll),
      severity,
      hazards,
      missingJobs: [...party.missing],
      hits,
    });

    // Anyone brought to zero may be saved by a healer, or dies.
    for (const m of alive) {
      if (hp[m.id].cur > 0) continue;
      const healer = alive.find(
        (o) => o !== m && hp[o.id].cur > 0 && party.assign[o.id] === 'healer' && !party.missing.includes('healer'),
      );
      const saveChance = (healer ? E.save.withHealer : E.save.without) + m.stats.luk * E.save.perLuck;
      const r = random(state);
      const died = r >= saveChance;
      logEvent(state, 'downed', {
        party: party.id,
        quest: quest.id,
        n,
        adv: m.id,
        healer: healer ? healer.id : null,
        saveChance: round2(saveChance),
        roll: round2(r),
        died,
      });
      if (died) {
        dead.push(m.id);
      } else {
        hp[m.id].cur = 1;
        extraInjury[m.id] = (extraInjury[m.id] ?? 0) + E.savedInjury;
      }
    }

    const still = living();
    if (still.length === 0) {
      outcome = 'wiped';
      break;
    }
    if (severity === 'failed') {
      outcome = cleared * 2 >= truth.encounters ? 'partial' : 'retreat';
      logEvent(state, 'retreat', { party: party.id, quest: quest.id, n, forced: true, leader: still[0].id });
      break;
    }

    const healer = memberFor(party, 'healer', still);
    if (healer) {
      for (const m of still) hp[m.id].cur = Math.min(hp[m.id].max, hp[m.id].cur + Math.round(E.healBetween * hp[m.id].max));
    }

    if (n < truth.encounters - 1) {
      const leader = still[0];
      let cur = 0;
      let max = 0;
      for (const m of still) {
        cur += Math.max(0, hp[m.id].cur);
        max += hp[m.id].max;
      }
      const frac = round2(cur / max);
      const choice = decidePressOn(leader, frac);
      if (!choice.pressOn) {
        outcome = cleared * 2 >= truth.encounters ? 'partial' : 'retreat';
        logEvent(state, 'retreat', { party: party.id, quest: quest.id, n, forced: false, leader: leader.id, hpFrac: frac });
        break;
      }
      if (frac < choice.neutral) {
        logEvent(state, 'press_on', {
          party: party.id,
          quest: quest.id,
          n,
          leader: leader.id,
          hpFrac: frac,
          threshold: round2(choice.threshold),
          neutral: choice.neutral,
        });
      }
    }
  }
  if (!outcome) outcome = 'success';

  finish(state, party, quest, members, hp, extraInjury, dead, cleared, outcome);
}

function finish(state, party, quest, members, hp, extraInjury, dead, cleared, outcome) {
  const M = TUNING.morale;
  const N = TUNING.needs;
  const { truth, posting } = quest;

  for (const id of dead) killAdventurer(state, findAdventurer(state, id), party, quest);

  const survivors = members.filter((m) => !dead.includes(m.id));
  const totalPay = outcome === 'success' ? posting.reward : outcome === 'partial' ? Math.round(posting.reward * E.partialPay) : 0;
  const share = survivors.length ? Math.floor(totalPay / survivors.length) : 0;
  const xp = Math.round(TUNING.growth.xpPerRank * (truth.rank + 1) * (cleared / truth.encounters));

  for (const m of survivors) {
    const before = m.needs.injury;
    let add = extraInjury[m.id] ?? 0;
    if (hp[m.id].cur / hp[m.id].max < E.injuryBelow) add += 1;
    m.needs.injury = Math.min(N.injuryMax, m.needs.injury + add);
    m.needs.injuryDays = 0;
    if (m.needs.injury > before) {
      m.needs.morale += M.injured;
      addHistory(m, state.tick, 'injured', { quest: quest.id, injury: m.needs.injury });
      logEvent(state, 'injured', { adv: m.id, party: party.id, quest: quest.id, injury: m.needs.injury });
    }
    m.needs.fatigue += truth.durationTicks * N.fatiguePerExpeditionTick;
    m.needs.gold += share;
    m.needs.morale += M[outcome];
    for (const o of survivors) if (o !== m) insertSorted(m.friends, o.id);
    m.status = 'idle';
    m.party = null;
    gainXp(state, m, xp);
    addHistory(m, state.tick, 'returned', { quest: quest.id, outcome });
  }

  // Grief: friends and surviving party members lose heart.
  for (const id of dead) {
    for (const m of state.adventurers) {
      const inParty = survivors.includes(m);
      const friend = m.friends.includes(id);
      if (!inParty && !friend) continue;
      const loss = (inParty ? M.partyDeath : 0) + (friend ? M.friendDeath : 0);
      m.needs.morale += loss * (1 + Math.max(0, modifier(m, 'griefWeight')));
      logEvent(state, 'grief', { adv: m.id, for: id, morale: Math.round(m.needs.morale) });
    }
  }
  for (const m of state.adventurers) m.needs.morale = clamp(m.needs.morale, 0, M.max);

  party.status = 'done';
  quest.status = 'closed';
  quest.outcome = outcome;
  const returnIdx = logEvent(state, 'return', {
    party: party.id,
    quest: quest.id,
    outcome,
    cleared,
    encounters: truth.encounters,
    survivors: survivors.map((m) => m.id),
    dead: [...dead],
    payEach: share,
    xpEach: xp,
  });

  for (const id of dead) addReport(state, deriveIncident(state.log, party.departLog, { kind: 'death', adv: id }));
  if (outcome === 'retreat' || outcome === 'wiped') {
    addReport(state, deriveIncident(state.log, party.departLog, { kind: 'failed_quest' }));
  }
  return returnIdx;
}

function addReport(state, report) {
  report.id = state.nextId.report++;
  state.reports.push(report);
  logEvent(state, 'incident_report', { report: report.id, kind: report.kind, quest: report.quest, subject: report.subject });
}

export function killAdventurer(state, adv, party, quest) {
  adv.status = 'dead';
  addHistory(adv, state.tick, 'died', { quest: quest.id });
  state.adventurers = state.adventurers.filter((a) => a.id !== adv.id);
  state.fallen.push({
    id: adv.id,
    name: adv.name,
    cls: adv.cls,
    level: adv.level,
    record: { ...adv.record },
    claim: { ...adv.claim },
    traits: [...adv.traits],
    archetype: adv.archetype,
    diedAt: state.tick,
    quest: quest.id,
    party: party.id,
    history: adv.history,
  });
  logEvent(state, 'death', { victim: adv.id, name: adv.name, party: party.id, quest: quest.id });
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
