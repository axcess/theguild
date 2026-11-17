import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seedFrom, random } from '../src/sim/rng.js';
import { createState, step, applyAction, phaseOf, counterOpen, hourOf, dayOf } from '../src/sim/index.js';
import { assignJobs } from '../src/sim/party.js';

test('the generator repeats from the same seed and its state is a plain number', () => {
  const a = { rng: seedFrom('x') };
  const b = { rng: seedFrom('x') };
  for (let i = 0; i < 100; i++) {
    const v = random(a);
    assert.equal(v, random(b));
    assert.ok(v >= 0 && v < 1);
  }
  assert.equal(typeof a.rng, 'number');
  assert.notEqual(seedFrom('x'), seedFrom('y'));
});

test('the clock has morning, midday, evening and night, and the counter closes at night', () => {
  assert.equal(phaseOf(6), 'morning');
  assert.equal(phaseOf(12), 'midday');
  assert.equal(phaseOf(17), 'evening');
  assert.equal(phaseOf(23), 'night');
  assert.equal(phaseOf(3), 'night');
  assert.equal(counterOpen(2), false);
  assert.equal(counterOpen(24 + 9), true);
  assert.equal(dayOf(49), 2);
  assert.equal(hourOf(49), 1);
});

test('clerk actions are refused while the counter is closed', () => {
  const state = createState(1);
  const adv = state.adventurers[0];
  const r = applyAction(state, { type: 'register', adv: adv.id, cls: 'warrior', rank: 0 });
  assert.equal(r.ok, false);
  assert.equal(adv.status, 'unregistered');
});

test('registration records what the clerk wrote, which can differ from the truth', () => {
  const state = createState(1);
  while (!counterOpen(state.tick)) step(state);
  const adv = state.adventurers[0];
  const wrong = adv.cls === 'bard' ? 'cleric' : 'bard';
  assert.deepEqual(applyAction(state, { type: 'register', adv: adv.id, cls: wrong, rank: 4 }), { ok: true });
  assert.deepEqual(adv.record, { cls: wrong, rank: 4 });
  assert.notEqual(adv.cls, wrong);
});

test('postings are validated and requests can be rejected', () => {
  const state = createState(1);
  while (state.quests.length < 2) step(state);
  const [a, b] = state.quests;
  assert.equal(applyAction(state, { type: 'post', quest: a.id, posting: { rank: 9 } }).ok, false);
  const posting = { rank: 1, level: 5, reward: 30, hazards: ['ambush'], slots: [['warrior'], []] };
  assert.equal(applyAction(state, { type: 'post', quest: a.id, posting }).ok, true);
  assert.equal(a.status, 'posted');
  assert.equal(applyAction(state, { type: 'reject', quest: b.id }).ok, true);
  assert.equal(b.status, 'rejected');
  assert.equal(applyAction(state, { type: 'reject', quest: b.id }).ok, false);
});

test('jobs go to the members who cover the most of them', () => {
  const m = (id, cls) => ({ id, cls });
  // A greedy pass would give the tank job to the cleric; the best assignment does not.
  const { assign, missing } = assignJobs([m(1, 'cleric'), m(2, 'mage'), m(3, 'warrior')], ['tank', 'healer', 'damage']);
  assert.deepEqual(missing, []);
  assert.deepEqual(assign, { 3: 'tank', 1: 'healer', 2: 'damage' });
  const short = assignJobs([m(1, 'mage')], ['tank', 'damage']);
  assert.deepEqual(short.missing, ['tank']);
});
