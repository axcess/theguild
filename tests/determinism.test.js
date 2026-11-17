import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, runDays, runTicks } from '../tools/runner.js';

const CARELESS = 0.2;

test('same seed and same clerk inputs give identical logs and state over 100 days', () => {
  const a = runDays(newRun(42, CARELESS), 100);
  const b = runDays(newRun(42, CARELESS), 100);
  assert.equal(JSON.stringify(a.log), JSON.stringify(b.log));
  assert.equal(JSON.stringify(a.sim), JSON.stringify(b.sim));
  assert.ok(a.log.length > 1000, 'the run should have produced a real log');
});

test('a different seed gives a different log', () => {
  const a = runDays(newRun(42, CARELESS), 100);
  const b = runDays(newRun(43, CARELESS), 100);
  assert.notEqual(JSON.stringify(a.log), JSON.stringify(b.log));
});

test('saving to JSON mid-run and continuing gives the same log as an unbroken run', () => {
  const whole = runDays(newRun(7, CARELESS), 100);

  // Stop mid-afternoon, not on a day boundary.
  const first = runTicks(newRun(7, CARELESS), 37 * 24 + 13);
  const resumed = JSON.parse(JSON.stringify(first));
  runTicks(resumed, 63 * 24 - 13);

  assert.equal(JSON.stringify(resumed.log), JSON.stringify(whole.log));
  assert.equal(JSON.stringify(resumed.sim), JSON.stringify(whole.sim));
});

test('state survives a JSON round trip unchanged at any point', () => {
  const run = runDays(newRun(11, CARELESS), 30);
  assert.deepEqual(JSON.parse(JSON.stringify(run.sim)), run.sim);
});
