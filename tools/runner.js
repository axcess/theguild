// Runs the simulation with the scripted clerk. Shared by tools/run.js and the tests.

import { createState, step } from '../src/sim/index.js';
import { TUNING } from '../src/data/tuning.js';
import { createClerk, clerkActions } from './clerk.js';

export function newRun(seed, errorRate) {
  return { sim: createState(seed), clerk: createClerk({ seed, errorRate }) };
}

export function runTicks(run, ticks) {
  const end = run.sim.tick + ticks;
  while (run.sim.tick < end) step(run.sim, clerkActions(run.clerk, run.sim));
  return run;
}

export function runDays(run, days) {
  return runTicks(run, days * TUNING.clock.ticksPerDay);
}

export function summarize(sim) {
  const count = (type) => sim.log.filter((e) => e.type === type).length;
  const outcomes = {};
  for (const e of sim.log) if (e.type === 'return') outcomes[e.outcome] = (outcomes[e.outcome] ?? 0) + 1;
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
