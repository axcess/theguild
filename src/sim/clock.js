import { TUNING } from '../data/tuning.js';

const C = TUNING.clock;

export function dayOf(tick) {
  return Math.floor(tick / C.ticksPerDay);
}

export function hourOf(tick) {
  return tick % C.ticksPerDay;
}

export function phaseOf(tick) {
  const hour = hourOf(tick);
  for (const phase of C.phases) {
    if (hour >= phase.from && hour <= phase.to) return phase.id;
  }
  return 'night';
}

// The counter is open in every phase but night.
export function counterOpen(tick) {
  return phaseOf(tick) !== 'night';
}

export function formatTime(tick) {
  return `day ${dayOf(tick) + 1} ${String(hourOf(tick)).padStart(2, '0')}:00`;
}
