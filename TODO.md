# TODO

## Current milestone: 1. Simulation core, headless

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

Described in DESIGN.md. Write the checklist for each here when it starts.

2. Desk, first playable.
3. Inspect, registration and rank-ups.
4. Gear, loot and appraisal.
5. Petitions, rumor feed, reputation and funds.
6. City tutorial.
7. Frontier.
8. Staff, policies and audits.
9. Commendations and balance.
