import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, runDays } from '../tools/runner.js';

const ACTOR_FIELDS = ['adv', 'leader'];
const ACTOR_LISTS = ['survivors'];

test('dead adventurers never act again', () => {
  for (const seed of [1, 2, 3, 4]) {
    const run = runDays(newRun(seed, 0.3), 100);
    const sim = run.sim;
    const diedAt = new Map();
    for (const e of run.log) {
      if (e.type === 'death') {
        diedAt.set(e.victim, e.i);
        continue;
      }
      const actors = [
        ...ACTOR_FIELDS.map((f) => e[f]).filter((v) => v !== undefined),
        ...ACTOR_LISTS.flatMap((f) => e[f] ?? []),
        ...(e.type === 'depart' ? e.members.map((m) => m.id) : []),
      ];
      for (const id of actors) {
        assert.ok(!diedAt.has(id), `seed ${seed}: ${id} died at log ${diedAt.get(id)} but acts in ${e.i} (${e.type})`);
      }
    }
    assert.ok(diedAt.size > 0, `seed ${seed} should have deaths`);
    for (const id of diedAt.keys()) {
      assert.ok(!sim.adventurers.some((a) => a.id === id), 'the dead are removed from play');
      assert.ok(sim.fallen.some((f) => f.id === id));
    }
  }
});

test('friends and party members grieve a death', () => {
  const { log } = runDays(newRun(2, 0.3), 100);
  const deaths = log.filter((e) => e.type === 'death');
  const grieved = deaths.filter((d) => log.some((e) => e.type === 'grief' && e.for === d.victim));
  assert.ok(grieved.length > 0);
});

test('adventurers gain levels from quests', () => {
  const { log } = runDays(newRun(1, 0), 100);
  const ups = log.filter((e) => e.type === 'level_up');
  assert.ok(ups.length > 0);
  for (const u of ups) assert.ok(u.level >= 2);
});
