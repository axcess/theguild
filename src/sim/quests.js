// Quest requests: each is rolled from a template into a hidden truth. The posting
// is added later by a clerk action.

import { QUEST_TEMPLATES } from '../data/quests.js';
import { CLIENTS } from '../data/names.js';
import { RANKS } from '../data/ranks.js';
import { TUNING } from '../data/tuning.js';
import { randInt, randRange, chance, pick, weightedPick } from './rng.js';
import { logEvent } from './state.js';
import { rankForLevel } from './adventurers.js';

export function generateRequest(state) {
  const R = TUNING.requests;
  // Most requests are pitched at what the people in town can handle, standing in
  // for a town economy that grows work around its adventurers.
  let template = null;
  let rank = null;
  const roster = state.adventurers.filter((a) => a.record);
  if (roster.length > 0 && chance(state, R.rosterBias)) {
    const target = rankForLevel(pick(state, roster).level);
    const fits = QUEST_TEMPLATES.filter((t) => t.ranks[0] <= target && target <= t.ranks[1]);
    if (fits.length > 0) {
      template = weightedPick(state, fits, (t) => t.weight);
      rank = target;
    }
  }
  if (!template) {
    template = weightedPick(state, QUEST_TEMPLATES, (t) => t.weight);
    rank = randInt(state, template.ranks[0], template.ranks[1]);
  }
  const truth = {
    rank,
    level: RANKS[rank].minLevel + randInt(state, 0, 4),
    jobs: [...template.jobs],
    hazards: template.hazards.filter(([, p]) => chance(state, p)).map(([h]) => h),
    encounters: randInt(state, template.encounters[0], template.encounters[1]),
    durationTicks: randInt(state, template.hours[0], template.hours[1]),
    pay: Math.round((R.payBasePerJob + R.payPerRankPerJob * rank) * template.jobs.length * randRange(state, 0.8, 1.2)),
  };
  const quest = {
    id: state.nextId.quest++,
    template: template.id,
    title: template.title,
    client: pick(state, CLIENTS),
    requestedAt: state.tick,
    status: 'requested', // requested, posted, rejected, lapsed, expired, taken, away, closed
    truth,
    posting: null,
    postedAt: null,
    closedAt: null,
    party: null,
    outcome: null,
  };
  state.quests.push(quest);
  logEvent(state, 'request', {
    quest: quest.id,
    title: quest.title,
    client: quest.client,
    truth: structuredClone(truth),
  });
  return quest;
}
