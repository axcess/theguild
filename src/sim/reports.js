// Incident reports, derived only from the event log. Every cause names the log
// entries that prove it, and is attributed to the clerk's paperwork, the
// adventurers' own choices, or bad luck.

import { RANKS } from '../data/ranks.js';
import { CLASSES } from '../data/classes.js';
import { JOB_NAMES } from '../data/jobs.js';
import { HAZARDS } from '../data/quests.js';
import { TUNING } from '../data/tuning.js';
import { rankForLevel, fitOf } from './adventurers.js';

const rankName = (r) => RANKS[r].id;
const clsName = (c) => CLASSES[c].name;
const article = (word) => (/^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`);

// subject is { kind: 'death', adv } or { kind: 'failed_quest' }.
export function deriveIncident(log, departIdx, subject) {
  const d = log[departIdx];
  const events = [];
  for (let i = departIdx + 1; i < log.length; i++) {
    const e = log[i];
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
      if (h.countered || h.posted || seenHazards.includes(h.hazard)) continue;
      seenHazards.push(h.hazard);
      add('hazard_hidden', 'paperwork', `${HAZARDS[h.hazard].name} was not on the posting`, [d.i, e.i], { hazard: h.hazard });
    }
  }

  // The people involved.
  for (const m of subjects) {
    if (m.level >= d.truth.level) continue;
    const trueRank = rankForLevel(m.level);
    if (m.recordRank > trueRank) {
      if (m.recordRank > rankForLevel(m.claimLevel)) {
        add('rank_inflated', 'paperwork', `${m.name} was registered at rank ${rankName(m.recordRank)} on a claimed level of ${m.claimLevel}`, [d.i], { adv: m.id });
      } else {
        add('rank_inflated', 'adventurer', `${m.name} claimed level ${m.claimLevel} at registration but is level ${m.level}`, [d.i], { adv: m.id });
      }
    }
    if (m.reachedUp) {
      add('reached_up', 'adventurer', `${m.name} took a rank ${rankName(d.posting.rank)} posting on a rank ${rankName(m.recordRank)} record`, [d.i], { adv: m.id });
    }
    if (m.level < d.posting.level) {
      add('below_level', 'adventurer', `${m.name} is level ${m.level}, below the recommended level ${d.posting.level}`, [d.i], { adv: m.id });
    }
  }

  if (d.short && !causes.some((c) => c.kind === 'job_ignored')) {
    add('short_handed', 'adventurer', `the leader set out with ${d.members.length} of ${d.posting.slots.length} places filled`, [d.i]);
  }

  for (const e of events) {
    if (e.type === 'press_on' && e.n < lastN) {
      add('pressed_on', 'adventurer', `${nameOf(e.leader)} pressed on at ${Math.round(e.hpFrac * 100)}% health`, [e.i], { adv: e.leader });
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
