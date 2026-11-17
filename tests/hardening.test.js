import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, runDays, runTicks } from '../tools/runner.js';
import { makeSave, loadSave, verifySave, stateHash, replay, createState, step, counterOpen, buildDecisionView } from '../src/sim/index.js';
import { buildSelfView } from '../src/sim/view.js';
import { QUEST_TEMPLATES, HAZARDS } from '../src/data/quests.js';
import { CLASS_IDS } from '../src/data/classes.js';
import { TUNING } from '../src/data/tuning.js';
import { fitOf } from '../src/sim/adventurers.js';
import { assignJobs } from '../src/sim/party.js';

test('a save made mid-run replays from its journal to the same state', () => {
  const run = runTicks(newRun(9, 0.2), 45 * 24 + 15);
  const save = makeSave(run.sim);
  assert.ok(save.journal.length > 100);
  assert.equal(save.hash, stateHash(run.sim));
  assert.ok(verifySave(save));
  // Loading the snapshot and playing on matches the live run.
  // The scripted clerk is outside the save, so the loaded copy gets its own copy of it.
  const loaded = { clerk: structuredClone(run.clerk), sim: loadSave(JSON.parse(JSON.stringify(save))), log: [...run.log] };
  runDays(run, 20);
  runDays(loaded, 20);
  assert.equal(stateHash(loaded.sim), stateHash(run.sim));
});

test('a tampered save fails verification', () => {
  const save = makeSave(runDays(newRun(9, 0.2), 20).sim);
  save.journal[3].action.rank = (save.journal[3].action.rank ?? 0) + 1;
  let ok;
  try {
    ok = verifySave(save);
  } catch {
    ok = false;
  }
  assert.equal(ok, false);
});

test('replay regenerates the full event log', () => {
  const run = runDays(newRun(4, 0.2), 30);
  const events = [];
  replay(run.sim.seed, run.sim.journal, run.sim.tick, (e) => events.push(e));
  assert.equal(JSON.stringify(events), JSON.stringify(run.log));
  assert.ok(run.sim.log.length < run.log.length, 'the live log should be trimmed');
});

test('a year of play saves in under 1 MB', () => {
  const run = runDays(newRun(1, 0.2), 365);
  const kb = JSON.stringify(makeSave(run.sim)).length / 1024;
  assert.ok(kb < 1024, `save is ${kb.toFixed(0)} KB`);
});

test('every hazard on every template can be countered by some valid party', () => {
  // A valid party covers the quest's jobs, plus at most one extra place for the
  // hazard, which is what a careful clerk recommends.
  for (const t of QUEST_TEMPLATES) {
    for (const [h] of t.hazards) {
      const counter = HAZARDS[h].counter;
      const counterCls = CLASS_IDS.find((c) => fitOf(c, counter) >= TUNING.fit.coveredAt);
      const jobCls = t.jobs.map((j) => CLASS_IDS.find((c) => fitOf(c, j) === TUNING.fit.best));
      const party = [...jobCls, counterCls].map((cls, i) => ({ id: i + 1, cls }));
      const { missing } = assignJobs(party, t.jobs);
      assert.deepEqual(missing, [], `${t.id}: jobs not covered`);
      assert.ok(party.some((m) => fitOf(m.cls, counter) >= TUNING.fit.coveredAt), `${t.id}: ${h} cannot be countered`);
    }
  }
});

test('few adventurers leave broke', () => {
  let broke = 0;
  const seeds = [1, 2, 3, 4, 5, 6];
  for (const seed of seeds) broke += runDays(newRun(seed, 0.2), 100).sim.departed.filter((d) => d.reason === 'broke').length;
  // Milestone 1 lost about 20 a run this way.
  assert.ok(broke / seeds.length < 8, `${(broke / seeds.length).toFixed(1)} a run`);
});

test('no leader re-forms a quest they gave up on within the cool-down', () => {
  for (const seed of [1, 2, 3]) {
    const { log } = runDays(newRun(seed, 0.2), 100);
    const gaveUp = {};
    for (const e of log) {
      if (e.type === 'party_disband') gaveUp[`${e.leader}/${e.quest}`] = e.t;
      if (e.type === 'party_formed') {
        const at = gaveUp[`${e.leader}/${e.quest}`];
        assert.ok(at === undefined || e.t - at >= TUNING.decision.shunTicks, `seed ${seed}: ${e.leader} re-formed quest ${e.quest}`);
      }
    }
  }
});

test('decisions get copies, not the live adventurer', () => {
  const run = runDays(newRun(3, 0.2), 5);
  const adv = run.sim.adventurers.find((a) => a.record);
  const before = JSON.stringify(adv);
  const self = buildSelfView(adv);
  self.needs.gold = -999;
  self.traits.push('reckless');
  self.record.rank = 6;
  self.friends.push(999);
  assert.equal(JSON.stringify(adv), before, 'changing the copy must not touch the adventurer');
  assert.equal('history' in self, false);
  assert.equal('cls' in self, false, 'decisions judge by record and level, not by class');
  const view = buildDecisionView(run.sim);
  assert.ok(Array.isArray(view.roster));
});

test('actions record who did the paperwork', () => {
  const state = createState(1);
  while (!counterOpen(state.tick)) step(state);
  const adv = state.adventurers[0];
  step(state, [{ type: 'register', adv: adv.id, cls: 'bard', rank: 0, by: 'player' }]);
  const reg = state.log.find((e) => e.type === 'register');
  assert.equal(reg.by, 'player');
  assert.equal(state.journal[0].action.by, 'player');
});

test('reposted quests get a fresh post time', () => {
  const { log } = runDays(newRun(2, 0.2), 60);
  const disbanded = log.filter((e) => e.type === 'party_disband');
  assert.ok(disbanded.length > 0);
  for (const d of disbanded) {
    const expired = log.find((e) => e.type === 'posting_expired' && e.quest === d.quest);
    if (expired) assert.ok(expired.t - d.t >= TUNING.requests.postingExpiryDays * 24 - 24, `quest ${d.quest} expired too soon after going back up`);
  }
});
