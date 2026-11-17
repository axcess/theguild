import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newRun, runTicks } from '../tools/runner.js';
import { buildDecisionView } from '../src/sim/index.js';

const TRUTH_ONLY_KEYS = ['truth', 'encounters', 'durationTicks', 'pay', 'jobs'];

function keysDeep(value, out = new Set()) {
  if (Array.isArray(value)) value.forEach((v) => keysDeep(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keysDeep(v, out);
    }
  }
  return out;
}

test('the decision view never carries a quest truth', () => {
  const run = newRun(5, 0.2);
  let checked = 0;
  for (let day = 0; day < 40; day++) {
    runTicks(run, 10); // look at the morning rush
    const view = buildDecisionView(run.sim);
    const keys = keysDeep(view);
    for (const k of TRUTH_ONLY_KEYS) assert.ok(!keys.has(k), `view holds "${k}" on day ${day + 1}`);
    // Each posting in the view must be exactly the posting, nothing more.
    for (const entry of [...view.board, ...view.forming]) {
      const quest = run.sim.quests.find((q) => q.id === entry.quest);
      assert.deepEqual(entry.posting, quest.posting);
    }
    checked += view.board.length + view.forming.length;
    runTicks(run, 14);
  }
  assert.ok(checked > 50, 'the test should have seen many postings');
});

test('the decision view is a copy, so decisions cannot reach back into state', () => {
  const run = runTicks(newRun(5, 0.2), 30);
  const view = buildDecisionView(run.sim);
  const entry = view.board[0];
  assert.ok(entry, 'expected a posting on the board');
  entry.posting.rank = 99;
  const quest = run.sim.quests.find((q) => q.id === entry.quest);
  assert.notEqual(quest.posting.rank, 99);
});

test('the decision module does not touch truth or import anything that holds it', () => {
  const text = readFileSync(new URL('../src/sim/decide.js', import.meta.url), 'utf8');
  assert.doesNotMatch(text, /\.truth\b/);
  const imports = [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  assert.deepEqual(imports.sort(), ['../data/tuning.js', './adventurers.js']);
});
