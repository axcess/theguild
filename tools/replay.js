// Replay and audit a run.
//
//   node tools/replay.js --seed 1 --days 40 [--error 0.2] [--save out.json]
//       Runs the scripted clerk, saves, then replays the save from its journal and
//       checks the state hash.
//   node tools/replay.js --load save.json [--party 12] [--report 3]
//       Replays a saved game from its seed and journal and checks it. With --party,
//       prints every event of that expedition; with --report, the events behind
//       that incident report.

import { readFileSync, writeFileSync } from 'node:fs';
import { makeSave, verifySave, replay, formatTime } from '../src/sim/index.js';
import { newRun, runDays } from './runner.js';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
}

let save;
if (arg('load', null)) {
  save = JSON.parse(readFileSync(arg('load'), 'utf8'));
} else {
  const run = runDays(newRun(arg('seed', '1'), Number(arg('error', 0.2))), Number(arg('days', 40)));
  save = makeSave(run.sim);
  if (arg('save', null)) writeFileSync(arg('save'), JSON.stringify(save));
}

const kb = (JSON.stringify(save).length / 1024).toFixed(0);
console.log(`Save: seed ${save.seed}, ${formatTime(save.tick)}, ${save.journal.length} journal entries, ${kb} KB, hash ${save.hash}`);
const ok = verifySave(save);
console.log(ok ? 'Replay from the journal matches the save exactly.' : 'REPLAY DOES NOT MATCH THE SAVE.');

const partyArg = arg('party', null);
const reportArg = arg('report', null);
if (partyArg || reportArg) {
  let wanted;
  if (reportArg) {
    const report = save.snapshot.reports.find((r) => r.id === Number(reportArg));
    if (!report) throw new Error(`no report ${reportArg}`);
    wanted = new Set(report.log);
    console.log(`\nIncident report #${report.id}: ${report.summary}`);
  }
  const party = Number(partyArg);
  console.log('');
  replay(save.seed, save.journal, save.tick, (e) => {
    if (wanted ? wanted.has(e.i) : e.party === party) {
      const { i, t, type, ...rest } = e;
      console.log(`${i}\t${formatTime(t)}\t${type}\t${JSON.stringify(rest)}`);
    }
  });
}
process.exitCode = ok ? 0 : 1;
