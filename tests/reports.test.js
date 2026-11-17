import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, runDays } from '../tools/runner.js';
import { CLASSES } from '../src/data/classes.js';
import { TUNING } from '../src/data/tuning.js';
import { rankForLevel } from '../src/sim/index.js';
import { fitOf } from '../src/sim/adventurers.js';
import { TRAITS } from '../src/data/traits.js';
import { ARCHETYPES } from '../src/data/archetypes.js';
import { HAZARDS } from '../src/data/quests.js';

const runs = [1, 2, 3, 4].map((seed) => runDays(newRun(seed, 0.3), 100));

// A failed quest is reported when the party was wiped out, or retreated with someone
// dead or newly injured. A clean retreat is only logged.
test('every death and every failed quest has an incident report', () => {
  for (const { sim, log } of runs) {
    const deaths = log.filter((e) => e.type === 'death');
    const hurt = (e) => e.dead.length > 0 || log.some((x) => x.type === 'injured' && x.party === e.party);
    const failed = log.filter((e) => e.type === 'return' && (e.outcome === 'wiped' || (e.outcome === 'retreat' && hurt(e))));
    const cleanRetreats = log.filter((e) => e.type === 'return' && e.outcome === 'retreat' && !hurt(e));
    for (const r of cleanRetreats) {
      assert.ok(!sim.reports.some((rep) => rep.kind === 'failed_quest' && rep.quest === r.quest), `clean retreat ${r.quest} was reported`);
    }
    for (const d of deaths) {
      assert.ok(sim.reports.some((r) => r.kind === 'death' && r.subject === d.victim), `no report for death of ${d.victim}`);
    }
    for (const f of failed) {
      assert.ok(sim.reports.some((r) => r.kind === 'failed_quest' && r.quest === f.quest), `no report for quest ${f.quest}`);
    }
    assert.equal(sim.reports.length, deaths.length + failed.length);
    assert.ok(deaths.length > 0, 'expected deaths with a careless clerk');
  }
});

// Each cause is checked against the log entries it names, independently of how
// the report was written.
function verifyCause(log, report, cause) {
  const ev = cause.evidence.map((i) => log[i]);
  const depart = log[report.log[0]];
  assert.equal(depart.type, 'depart');
  assert.equal(depart.party, report.party);
  for (const e of ev) assert.ok(e.party === report.party, `evidence ${e.i} is from another party`);
  const member = (id) => depart.members.find((m) => m.id === id);

  // Named traits must belong to the person, and a role must match who led.
  if (cause.traits) {
    const m = member(cause.adv);
    const names = [...m.traits.map((t) => TRAITS[t].name), ARCHETYPES[m.archetype].name];
    for (const t of cause.traits) if (!names.includes(t)) return false;
  }
  if (cause.role && cause.role !== (cause.adv === depart.leader ? 'leader' : 'member')) return false;

  switch (cause.kind) {
    case 'rank_under':
      return depart.posting.rank < depart.truth.rank;
    case 'level_under':
      return depart.posting.level < depart.truth.level;
    case 'class_misrecorded': {
      const m = member(cause.adv);
      const blameOk = cause.blame === (m.recordCls === m.claimCls ? 'adventurer' : 'paperwork');
      return (
        blameOk &&
        m.recordCls !== m.trueCls &&
        CLASSES[m.recordCls].best === cause.job &&
        fitOf(m.trueCls, cause.job) < TUNING.fit.coveredAt &&
        depart.missingJobs.includes(cause.job)
      );
    }
    case 'job_unrecommended':
    case 'job_ignored': {
      const recommended = depart.posting.slots.some((s) => s.some((c) => CLASSES[c].best === cause.job));
      return depart.missingJobs.includes(cause.job) && recommended === (cause.kind === 'job_ignored');
    }
    case 'hazard_hidden': {
      const enc = ev.find((e) => e.type === 'encounter');
      const h = enc.hazards.find((x) => x.hazard === cause.hazard);
      return (
        h && !h.countered && !h.posted &&
        depart.truth.hazards.includes(cause.hazard) && !depart.posting.hazards.includes(cause.hazard)
      );
    }
    case 'rank_inflated': {
      const m = member(cause.adv);
      if (!(m.recordRank > rankForLevel(m.level))) return false;
      return cause.blame === 'paperwork'
        ? m.recordRank > rankForLevel(m.claimLevel)
        : m.claimLevel > m.level && rankForLevel(m.claimLevel) > rankForLevel(m.level);
    }
    case 'went_injured':
      return member(cause.adv).injury > 0;
    case 'counter_unrecommended': {
      const enc = ev.find((e) => e.type === 'encounter');
      const h = enc.hazards.find((x) => x.hazard === cause.hazard);
      const counter = HAZARDS[cause.hazard].counter;
      const recommended = depart.posting.slots.some((sl) => sl.some((c) => fitOf(c, counter) >= TUNING.fit.coveredAt));
      return h && h.posted && !h.countered && !h.helped && !recommended;
    }
    case 'reached_up': {
      const m = member(cause.adv);
      return m.reachedUp && depart.posting.rank > m.recordRank;
    }
    case 'below_level':
      return member(cause.adv).level < depart.posting.level;
    case 'short_handed':
      return depart.short && depart.members.length < depart.posting.slots.length;
    case 'pressed_on':
      return ev[0].type === 'press_on' && ev[0].hpFrac < ev[0].neutral && ev[0].leader === cause.adv;
    case 'unlucky_roll':
      return ev[0].type === 'encounter' && ev[0].ratio >= 1 && ev[0].roll < 1;
    case 'failed_save':
      return ev[0].type === 'downed' && ev[0].died && ev[0].healer !== null;
    case 'no_gap':
      return ev[0].type === 'encounter' && report.causes.length === 1;
    default:
      return false;
  }
}

test('each cause in an incident report matches something real in the log', () => {
  const blames = { paperwork: 0, adventurer: 0, luck: 0 };
  let checked = 0;
  for (const { sim, log } of runs) {
    for (const report of sim.reports) {
      assert.ok(report.causes.length > 0, `report ${report.id} has no causes`);
      for (const cause of report.causes) {
        assert.ok(['paperwork', 'adventurer', 'luck'].includes(cause.blame));
        assert.ok(cause.evidence.length > 0);
        assert.ok(verifyCause(log, report, cause), `report ${report.id}: unsupported cause ${JSON.stringify(cause)}`);
        blames[cause.blame] += 1;
        checked += 1;
      }
    }
  }
  assert.ok(checked > 100);
  assert.ok(blames.paperwork > 0 && blames.adventurer > 0 && blames.luck > 0, JSON.stringify(blames));
});

test('a clerk who makes no errors is never blamed', () => {
  for (const seed of [1, 2, 3]) {
    const sim = runDays(newRun(seed, 0), 100).sim;
    for (const r of sim.reports) {
      for (const c of r.causes) {
        assert.notEqual(c.blame, 'paperwork', `seed ${seed} report ${r.id}: ${c.text}`);
      }
    }
  }
});
