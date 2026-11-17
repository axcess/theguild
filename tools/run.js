// Run a seed headless and print what happened.
//
//   node tools/run.js [--seed 1] [--days 100] [--error 0.3] [--reports N] [--log]

import { newRun, runDays, summarize } from './runner.js';
import { formatTime } from '../src/sim/index.js';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

const seed = arg('seed', '1');
const days = Number(arg('days', 100));
const errorRate = Number(arg('error', 0.3));
const showReports = Number(arg('reports', 3));

const run = runDays(newRun(seed, errorRate), days);
const sim = run.sim;
const s = summarize(sim);

console.log(`Seed ${seed}, ${days} days, clerk error rate ${errorRate}`);
console.log(`Arrivals ${s.arrivals}, registered ${s.registered}, cast now ${s.cast}, left town ${s.left}`);
console.log(`Requests ${s.requests}: posted ${s.posted}, rejected ${s.rejected}, expired untaken ${s.expired}`);
console.log(`Expeditions ${s.expeditions}: ${Object.entries(s.outcomes).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`Deaths ${s.deaths}, injuries ${s.injuries}, level-ups ${s.levelUps}, incident reports ${s.reports}`);

const blame = { paperwork: 0, adventurer: 0, luck: 0 };
for (const r of sim.reports) for (const c of r.causes) blame[c.blame] += 1;
console.log(`Causes in reports: paperwork ${blame.paperwork}, adventurer ${blame.adventurer}, luck ${blame.luck}`);

if (sim.fallen.length) {
  console.log('\nThe fallen:');
  for (const f of sim.fallen) console.log(`  ${f.name}, level ${f.level} ${f.cls}, ${formatTime(f.diedAt)}, quest ${f.quest}`);
}

const shown = sim.reports.slice(0, showReports);
for (const r of shown) {
  console.log(`\nIncident report #${r.id} (${r.kind === 'death' ? `death of ${r.name}` : 'failed quest'}), ${formatTime(r.tick)}`);
  console.log(`  Quest ${r.quest}: ${r.title}, outcome ${r.outcome}`);
  for (const c of r.causes) console.log(`  - [${c.blame}] ${c.text} (log ${c.evidence.join(', ')})`);
}

if (arg('log', false)) {
  console.log('\nFull log:');
  for (const e of sim.log) {
    const { i, t, type, ...rest } = e;
    console.log(`${i}\t${formatTime(t)}\t${type}\t${JSON.stringify(rest)}`);
  }
}
