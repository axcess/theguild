import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, runDays, summarize } from '../tools/runner.js';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

function deaths(errorRate) {
  return SEEDS.map((seed) => runDays(newRun(seed, errorRate), 100).sim.fallen.length);
}

test('an accurate clerk loses clearly fewer adventurers than a careless one', () => {
  const careful = deaths(0);
  const careless = deaths(0.2);
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  const msg = `careful ${careful.join(',')} vs careless ${careless.join(',')}`;
  // At least twice the deaths in total, and more on most seeds.
  assert.ok(sum(careless) >= 2 * sum(careful) + 8, msg);
  const worse = SEEDS.filter((_, i) => careless[i] > careful[i]).length;
  assert.ok(worse >= SEEDS.length * 0.75, msg);
});

test('a 100-day run looks alive: a mix of outcomes, some deaths, cast neither wiped out nor untouched', () => {
  for (const seed of [1, 2, 3]) {
    const s = summarize(runDays(newRun(seed, 0.2), 100).sim);
    assert.ok(s.outcomes.success > 50, `seed ${seed}: successes ${s.outcomes.success}`);
    assert.ok((s.outcomes.retreat ?? 0) > 5, `seed ${seed}: retreats`);
    assert.ok(s.injuries > 10, `seed ${seed}: injuries`);
    assert.ok(s.deaths >= 1 && s.deaths <= 20, `seed ${seed}: deaths ${s.deaths}`);
    assert.ok(s.cast >= 15 && s.cast <= 40, `seed ${seed}: cast ${s.cast}`);
    assert.ok(s.levelUps > 0, `seed ${seed}: level-ups`);
  }
});
