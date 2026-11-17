import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, runDays, summarize } from '../tools/runner.js';

const SEEDS = Array.from({ length: 16 }, (_, i) => i + 1);

function deaths(errorRate) {
  return SEEDS.map((seed) => runDays(newRun(seed, errorRate), 100).sim.fallen.length);
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
};

// Same seeds, same world, only the clerk's accuracy differs. The careless clerk
// must lose at least twice as many on average, and the per-seed difference must be
// clearly beyond noise (a paired t statistic of at least 3).
test('an accurate clerk loses clearly fewer adventurers than a careless one', () => {
  const careful = deaths(0);
  const careless = deaths(0.2);
  const diff = careless.map((x, i) => x - careful[i]);
  const t = mean(diff) / (sd(diff) / Math.sqrt(diff.length));
  const msg = `careful ${careful.join(',')} vs careless ${careless.join(',')}, t ${t.toFixed(2)}`;
  assert.ok(mean(careless) >= 2 * mean(careful), msg);
  assert.ok(t >= 3, msg);
});

test('a 100-day run looks alive: a mix of outcomes, some deaths, cast neither wiped out nor untouched', () => {
  for (const seed of [1, 2, 3]) {
    const s = summarize(runDays(newRun(seed, 0.2), 100));
    assert.ok(s.outcomes.success > 50, `seed ${seed}: successes ${s.outcomes.success}`);
    assert.ok((s.outcomes.retreat ?? 0) > 5, `seed ${seed}: retreats`);
    assert.ok(s.injuries > 10, `seed ${seed}: injuries`);
    assert.ok(s.deaths >= 1 && s.deaths <= 20, `seed ${seed}: deaths ${s.deaths}`);
    assert.ok(s.cast >= 15 && s.cast <= 40, `seed ${seed}: cast ${s.cast}`);
    assert.ok(s.levelUps > 0, `seed ${seed}: level-ups`);
  }
});
