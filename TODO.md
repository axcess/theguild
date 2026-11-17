# TODO

## Current milestone: 2. Core hardening

Scope comes from AUDIT.md. No page or interface yet. Items marked "decision" wait
for the answer listed at the end of PROGRESS.md before building.

**Done means:** `npm test` passes; a run can be saved as a seed plus an input
journal, reloaded and replayed to the same state hash; every audit finding below is
fixed or deliberately deferred with a note in PROGRESS.md.

### Build

- [ ] Input journal: every accepted clerk action is recorded with its tick and actor.
      A save is the seed, the journal and the latest snapshot. (A1)
- [ ] `tools/replay.js`: rebuild a run from a save, confirm the state hash, and print
      every event of one expedition on request. (A1)
- [ ] Bounded save size: trim the live log, and archive closed quests and finished
      parties, so a year of play fits well inside browser storage. (A1, C5)
- [ ] Hazard counters: apply the chosen rule. (A2, decision)
- [ ] Economy: weight the request mix toward the roster's ranks, and add a
      placeholder gold sink. (A3, decision)
- [ ] Party formation: a cool-down before a leader retakes a quest they gave up on;
      an empty slot may take a class that fills its job passably when nobody better
      is free. (A4)
- [ ] Incident report causes: going out injured; the trait behind a choice; both a
      clerk's slip and an adventurer's lie when both happened; leader or follower.
      (B1)
- [ ] Failed-quest report volume: apply the chosen rule. (decision)
- [ ] Decisions receive a read-only copy of the adventurer. (B6)
- [ ] A reposted quest gets a fresh post time; adventurers in a forming party pay
      upkeep and heal. (C1, C2)
- [ ] `docs/events.md`: a schema for every log event type, kept in step with the
      code. (C3)

### Tests

- [ ] A save made mid-run and replayed from its journal reaches the same state hash
      as the live run.
- [ ] A year of simulated play stays under the save-size budget.
- [ ] Every hazard on every template can be countered by some valid party.
- [ ] Adventurers who leave broke are no longer mostly rank F (measured over seeds).
- [ ] No leader re-forms the same quest within the cool-down.
- [ ] The careful-versus-careless test becomes statistically sound: more seeds and a
      comparison of rates, with no loss of strength. (B2)
- [ ] All milestone 1 tests keep passing.

### Not in this milestone

Any page or interface. Goals, rivals and retirement (B5) wait for milestone 3 or
later, since they matter most at the counter. Client budgets against posted
rewards (B4) wait for funds in milestone 6. Progression pace (B3) is measured but
not tuned until the calendar is decided.

## Milestone 1. Simulation core, headless

No page, no interface. Everything runs under Node.

**Status: done** on 2026-11-17. See PROGRESS.md for results and open questions.

**Done means:** `npm test` passes, and a test runs 100 simulated days from a seed
twice with the same scripted clerk inputs and gets identical event logs.

### Build

- [x] Seeded random generator. Its state is part of the simulation state.
- [x] Clock: ticks, days, and the morning, midday and evening phases.
- [x] Data files: the six classes, six stats, five jobs, guild ranks, traits,
      archetypes, name lists and a first set of quest templates.
- [x] Adventurer generation: true identity, stats, level, traits, archetype, needs
      (gold, rest, injuries, morale) and a history log.
- [x] Arrivals: newcomers turn up over time until the cast reaches 20 to 40.
- [x] Registration action: the clerk records a class and a guild rank, which can
      differ from the truth.
- [x] Quest requests generated from templates, each with a hidden truth: danger
      rank, hazards, jobs needed, level needed, what the client can pay.
- [x] Posting action: the clerk writes the posted rank, hazards, recommended classes,
      party size, recommended level and reward. Also a reject action.
- [x] Adventurer decisions each tick: take a quest, rest, look for a party, leave
      town. They score options from the posting only, skewed by their traits.
- [x] Party formation, enough for quests that need more than one person.
- [x] Expedition resolution as a chain of encounters tested against the truth, with
      outcomes of success, partial success, retreat, injury and death.
- [x] Experience and levelling from quests.
- [x] Permadeath: the adventurer is removed, and friends and party members react
      through morale.
- [x] Incident reports for every death and failed quest, with causes traced from the
      log and each attributed to the clerk's paperwork, the adventurer's own choice,
      or bad luck.
- [x] A scripted stand-in clerk, kept outside the simulation core, that registers
      newcomers and posts requests with a tunable error rate.
- [x] `tools/run.js`: run a seed for a number of days and print a summary, the
      incident reports and, on request, the full log.

### Tests

- [x] Same seed and same inputs give identical logs and final state over 100 days.
- [x] A different seed gives a different log.
- [x] Saving the state to JSON mid-run, loading it and continuing gives the same log
      as an uninterrupted run.
- [x] No use of `Math.random`, `Date` or page globals anywhere under `src/sim/`.
- [x] The decision code is never handed a quest's truth.
- [x] An accurate clerk loses clearly fewer adventurers than a careless one, across
      several seeds.
- [x] Each cause in an incident report matches a real gap between posting and truth,
      or a real choice or roll, in the log.
- [x] Dead adventurers never act again.

### Not in this milestone

Any page or interface, gear and loot, inspect tiers, rank-ups, counter approval of
pickups, petitions, funds and reputation, the town economy, dungeon growth, rival
branches, staff, save and load in the browser. Shopping and training as adventurer
options wait for the systems they depend on.

## Later milestones

Described in DESIGN.md and VISION.md. Write the checklist for each here when it
starts.

3. Desk, first playable.
4. Inspect, registration and rank-ups.
5. Gear, loot and appraisal.
6. Petitions, rumor feed, reputation and funds.
7. City tutorial.
8. Frontier.
9. Staff, policies and audits.
10. Commendations and balance.
