// Runs the simulation with the scripted clerk. Shared by tools/run.js and the tests.
// The live state only keeps recent events, so a run also gathers the full log as it
// goes, for inspection.

import { createState, step } from '../src/sim/index.js';
import { TUNING } from '../src/data/tuning.js';
import { createClerk, clerkActions } from './clerk.js';

export function newRun(seed, errorRate) {
  const run = { sim: createState(seed), clerk: createClerk({ seed, errorRate }), log: [] };
  collect(run);
  return run;
}

function collect(run) {
  const { log, logBase } = run.sim;
  const last = run.log.length ? run.log[run.log.length - 1].i : -1;
  for (let k = Math.max(0, last + 1 - logBase); k < log.length; k++) run.log.push(log[k]);
}

export function runTicks(run, ticks) {
  const end = run.sim.tick + ticks;
  while (run.sim.tick < end) {
    step(run.sim, clerkActions(run.clerk, run.sim));
    collect(run);
  }
  return run;
}

export function runDays(run, days) {
  return runTicks(run, days * TUNING.clock.ticksPerDay);
}

export function summarize(run) {
  const { sim, log } = run;
  const count = (type) => log.filter((e) => e.type === type).length;
  const outcomes = {};
  for (const e of log) if (e.type === 'return') outcomes[e.outcome] = (outcomes[e.outcome] ?? 0) + 1;
  return {
    days: Math.floor(sim.tick / TUNING.clock.ticksPerDay),
    arrivals: count('arrive'),
    registered: count('register'),
    requests: count('request'),
    posted: count('post'),
    rejected: count('reject'),
    expired: count('posting_expired'),
    expeditions: count('depart'),
    outcomes,
    deaths: sim.fallen.length,
    left: sim.departed.length,
    cast: sim.adventurers.length,
    injuries: count('injured'),
    levelUps: count('level_up'),
    reports: sim.reports.length,
  };
}
