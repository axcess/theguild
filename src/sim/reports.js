// Incident reports, derived only from the event log. Every cause names the log
// entries that prove it, and is attributed to the clerk's paperwork, the
// adventurers' own choices, or bad luck.

import { RANKS } from '../data/ranks.js';
import { CLASSES } from '../data/classes.js';
import { JOB_NAMES } from '../data/jobs.js';
import { HAZARDS } from '../data/quests.js';
import { TUNING } from '../data/tuning.js';
import { TRAITS } from '../data/traits.js';
import { ARCHETYPES } from '../data/archetypes.js';
import { rankForLevel, fitOf } from './adventurers.js';

const rankName = (r) => RANKS[r].id;
const clsName = (c) => CLASSES[c].name;
const article = (word) => (/^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`);

// The traits and archetype that pushed a member toward a choice: those whose
// modifier for `key` leans the way `sign` says.
function drivers(member, key, sign) {
  const out = member.traits.filter((t) => Math.sign(TRAITS[t][key] ?? 0) === sign).map((t) => TRAITS[t].name);
  const a = ARCHETYPES[member.archetype];
  if (a && Math.sign(a[key] ?? 0) === sign) out.push(a.name);
  return out;
}

const because = (list) => (list.length ? ` (${list.join(', ')})` : '');

// `log` holds events numbered from `logBase`. subject is { kind: 'death', adv } or
// { kind: 'failed_quest' }.
export function deriveIncident(log, logBase, departIdx, subject) {
  const d = log[departIdx - logBase];
  const events = [];
  for (let k = departIdx - logBase + 1; k < log.length; k++) {
    const e = log[k];
    if (e.party !== d.party) continue;
    events.push(e);
    if (e.type === 'return') break;
  }
  const encounters = events.filter((e) => e.type === 'encounter');
  const ret = events.find((e) => e.type === 'return');

  let lastN;
  let fatalDown = null;
  if (subject.kind === 'death') {
    fatalDown = events.find((e) => e.type === 'downed' && e.adv === subject.adv && e.died);
    lastN = fatalDown.n;
  } else {
    lastN = encounters[encounters.length - 1].n;
  }
  const relevant = encounters.filter((e) => e.n <= lastN);
  const decisive = relevant[relevant.length - 1];
  const subjects = subject.kind === 'death' ? d.members.filter((m) => m.id === subject.adv) : d.members;
  const nameOf = (id) => d.members.find((m) => m.id === id).name;

  const causes = [];
  const add = (kind, blame, text, evidence, data = {}) => causes.push({ kind, blame, text, evidence, ...data });

  // The posting against the truth.
  if (d.posting.rank < d.truth.rank) {
    add('rank_under', 'paperwork', `posted rank ${rankName(d.posting.rank)}, actual rank ${rankName(d.truth.rank)}`, [d.i]);
  }
  if (d.posting.level < d.truth.level && subjects.some((m) => m.level < d.truth.level)) {
    add('level_under', 'paperwork', `recommended level ${d.posting.level}, needed level ${d.truth.level}`, [d.i]);
  }

  // Jobs the party could not fill.
  for (const job of d.missingJobs) {
    const misfiled = d.members.find(
      (m) => CLASSES[m.recordCls].best === job && m.recordCls !== m.trueCls && fitOf(m.trueCls, job) < TUNING.fit.coveredAt,
    );
    const recommended = d.posting.slots.some((slot) => slot.some((c) => CLASSES[c].best === job));
    if (misfiled) {
      const lied = misfiled.recordCls === misfiled.claimCls;
      add(
        'class_misrecorded',
        lied ? 'adventurer' : 'paperwork',
        lied
          ? `${misfiled.name} claimed to be ${article(clsName(misfiled.claimCls))}, but is ${article(clsName(misfiled.trueCls))} and could not be the party's ${JOB_NAMES[job]}`
          : `${misfiled.name} was registered as ${article(clsName(misfiled.recordCls))} but is ${article(clsName(misfiled.trueCls))}, so the party had no ${JOB_NAMES[job]}`,
        [d.i],
        { adv: misfiled.id, job },
      );
    }
    if (!recommended) {
      add('job_unrecommended', 'paperwork', `no ${JOB_NAMES[job]} recommended, and the party had none`, [d.i], { job });
    } else if (!misfiled) {
      add('job_ignored', 'adventurer', `the party set out without the ${JOB_NAMES[job]} the posting recommended`, [d.i], { job });
    }
  }

  // Hazards that struck without warning and without anyone to blunt them.
  const seenHazards = [];
  for (const e of relevant) {
    for (const h of e.hazards) {
      if (h.countered || seenHazards.includes(h.hazard)) continue;
      if (!h.posted) {
        seenHazards.push(h.hazard);
        add('hazard_hidden', 'paperwork', `${HAZARDS[h.hazard].name} was not on the posting`, [d.i, e.i], { hazard: h.hazard });
      } else if (!h.helped) {
        const counter = HAZARDS[h.hazard].counter;
        const recommended = d.posting.slots.some((slot) => slot.some((c) => fitOf(c, counter) >= TUNING.fit.coveredAt));
        seenHazards.push(h.hazard);
        if (!recommended) {
          add('counter_unrecommended', 'paperwork', `${HAZARDS[h.hazard].name} was listed, but no one who could deal with it was recommended`, [d.i, e.i], { hazard: h.hazard });
        }
      }
    }
  }

  // The people involved. A choice names the traits behind it, and whether the
  // person was leading.
  const who = (m) => (m.id === d.leader ? `${m.name}, leading,` : m.name);
  const role = (m) => (m.id === d.leader ? 'leader' : 'member');
  for (const m of subjects) {
    if (m.injury > 0) {
      const t = drivers(m, 'injuryTolerance', 1);
      add('went_injured', 'adventurer', `${who(m)} set out still injured${because(t)}`, [d.i], { adv: m.id, role: role(m), traits: t });
    }
    if (m.level >= d.truth.level) continue;
    const trueRank = rankForLevel(m.level);
    if (m.recordRank > trueRank) {
      // Both can be true at once: the newcomer overstated, and the clerk wrote
      // down more than even the claim supported.
      if (m.recordRank > rankForLevel(m.claimLevel)) {
        add('rank_inflated', 'paperwork', `${m.name} was registered at rank ${rankName(m.recordRank)} on a claimed level of ${m.claimLevel}`, [d.i], { adv: m.id });
      }
      if (m.claimLevel > m.level && rankForLevel(m.claimLevel) > trueRank) {
        const t = drivers(m, 'lieChance', 1);
        add('rank_inflated', 'adventurer', `${m.name} claimed level ${m.claimLevel} at registration but is level ${m.level}${because(t)}`, [d.i], { adv: m.id, traits: t });
      }
    }
    if (m.reachedUp) {
      const t = drivers(m, 'reachUp', 1);
      add('reached_up', 'adventurer', `${who(m)} took a rank ${rankName(d.posting.rank)} posting on a rank ${rankName(m.recordRank)} record${because(t)}`, [d.i], { adv: m.id, role: role(m), traits: t });
    }
    if (m.level < d.posting.level) {
      const t = drivers(m, 'selfLevelBias', 1);
      add('below_level', 'adventurer', `${who(m)} is level ${m.level}, below the recommended level ${d.posting.level}${because(t)}`, [d.i], { adv: m.id, role: role(m), traits: t });
    }
  }

  if (d.short && !causes.some((c) => c.kind === 'job_ignored')) {
    const leader = d.members.find((m) => m.id === d.leader);
    const t = leader ? drivers(leader, 'departShort', 1) : [];
    add('short_handed', 'adventurer', `the leader set out with ${d.members.length} of ${d.posting.slots.length} places filled${because(t)}`, [d.i], { traits: t, adv: d.leader });
  }

  for (const e of events) {
    if (e.type === 'press_on' && e.n < lastN) {
      const m = d.members.find((x) => x.id === e.leader);
      const t = drivers(m, 'retreatShift', -1);
      add('pressed_on', 'adventurer', `${nameOf(e.leader)} pressed on at ${Math.round(e.hpFrac * 100)}% health${because(t)}`, [e.i], { adv: e.leader, traits: t });
    }
  }

  // Luck.
  if (decisive && decisive.ratio >= 1 && decisive.roll < 1) {
    add('unlucky_roll', 'luck', `the party was strong enough (power ${decisive.power} against ${decisive.threat}) but the fight went badly`, [decisive.i]);
  }
  if (fatalDown && fatalDown.healer !== null) {
    add('failed_save', 'luck', `${nameOf(fatalDown.healer)} could not save them (a ${Math.round(fatalDown.saveChance * 100)}% chance)`, [fatalDown.i]);
  }
  if (causes.length === 0) {
    add('no_gap', 'luck', 'the posting matched the truth and no risky choice was made; the encounter simply went wrong', [decisive.i]);
  }

  const victim = subject.kind === 'death' ? d.members.find((m) => m.id === subject.adv) : null;
  return {
    kind: subject.kind,
    subject: victim ? victim.id : null,
    name: victim ? victim.name : null,
    quest: d.quest,
    party: d.party,
    title: d.title,
    tick: ret ? ret.t : events[events.length - 1].t,
    outcome: ret ? ret.outcome : null,
    summary: causes.map((c) => c.text).join('; '),
    causes,
    log: [d.i, ...events.map((e) => e.i)],
  };
}
