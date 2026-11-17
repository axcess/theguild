import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newRun, runDays } from '../tools/runner.js';
import { buildDeskView } from '../src/sim/index.js';
import * as R from '../src/ui/render.js';

const UI_DIR = new URL('../src/ui/', import.meta.url).pathname;
const files = readdirSync(UI_DIR).filter((f) => f.endsWith('.js'));

test('the page imports the simulation only through its public entry point', () => {
  for (const f of files) {
    const text = readFileSync(join(UI_DIR, f), 'utf8');
    for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      assert.match(m[1], /^\.\.\/sim\/index\.js$|^\.\.\/data\/[a-z]+\.js$|^\.\/[a-z]+\.js$/, `${f} imports ${m[1]}`);
    }
  }
});

test('the page changes the simulation only through actions', () => {
  // The simulation state lives in `sim`. Nothing may assign into it or mutate its
  // lists; `act` and `step` are the only ways in.
  for (const f of files) {
    const text = readFileSync(join(UI_DIR, f), 'utf8');
    assert.doesNotMatch(text, /\bsim\.[\w.[\]"']+\s*(=(?!=)|\+=|-=|\+\+|--)/, `${f} assigns into the simulation`);
    assert.doesNotMatch(text, /\bsim\.[\w.]+\.(push|pop|shift|unshift|splice|sort|reverse|fill)\(/, `${f} mutates simulation lists`);
    assert.doesNotMatch(text, /applyAction|advance\(/, `${f} goes around act/step`);
  }
});

test('rendering a real day works and escapes what it prints', () => {
  const run = runDays(newRun(2, 0.3), 12);
  const view = buildDeskView(run.sim);
  view.requests.push({ quest: 999, title: '<script>alert(1)</script>', client: 'A & B', account: { rank: 0, hazards: [], offer: 5 }, requestedAt: 0 });
  const html = [
    R.renderCalendar(view),
    R.renderCounter(view, {}),
    R.renderIntake(view, null),
    R.renderPostingForm(view.requests.at(-1), { rank: 0, level: 1, hazards: [], slots: [''], reward: 5 }),
    R.renderBoard(view),
    R.renderLedger(view),
    R.renderIncidentTray(view, new Set()),
    ...view.reports.slice(0, 3).map(R.renderReport),
  ].join('\n');
  assert.ok(!html.includes('<script>'), 'raw markup leaked through');
  assert.ok(html.includes('&lt;script&gt;') && html.includes('A &amp; B'));
  assert.ok(view.reports.length > 0, 'expected reports to render');
  for (const e of view.ledger) assert.ok(R.ledgerLine(e, view).length > 0, `no ledger wording for ${e.type}`);
});
