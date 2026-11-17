# TODO

## Current milestone: 4. Inspect, registration and rank-ups

Not started. Write its checklist here when it starts, after auditing milestone 3.

## Milestone 3. Desk, first playable

**Status: done** on 2026-11-17. Played through in Chromium; see PROGRESS.md.

The first page. The player sits at the desk and works one full day: registering
newcomers, reading requests, writing postings, approving or refusing pickups, and
reading what comes back. The simulation stays headless. The page only reads views
of the state and sends actions.

**Done means:** `npm test` passes; serving the folder and opening `index.html`
gives a desk where one full working day, from opening to closing, can be played
with the mouse alone; it has been played through in a real browser and looked at;
and it follows STYLE.md.

### Simulation first (from the milestone 2 audit)

- [x] Spare hands: members beyond the quest's true jobs help at half strength. (D1)
- [x] Pickup approval: a ready party queues at the counter and waits for an
      `approve` or `refuse` action; a refused party breaks up and won't retake the
      quest for a while. The scripted clerk approves. (D2)
- [x] The client's account on every request: the rank they think it is, the
      hazards they mention, what they offer. (D3)
- [x] Board actions: `pull` a posting off the board, `reprice` its reward.
- [x] A desk view: everything the page may show, built without the truth. The
      counter queue (newcomers to register, parties to approve, oldest first), the
      intake tray, the board, parties out, incident reports, today's ledger.

### The page

- [x] `index.html` and `src/ui/`: one fixed desk scene, made of paper, ink and wood
      as STYLE.md says.
- [x] Counter: the person at the front of the queue, with a text portrait and
      what they say. A registration form (class and rank) or a pickup slip
      (approve or refuse).
- [x] Intake tray: requests in the client's words. Pick one to write it up.
- [x] Posting form: rank, recommended level, hazards, places with recommended
      classes, reward. Pin it to the board, or reject the request.
- [x] Quest board: pinned postings and their state, with pull and reprice.
- [x] Incident tray and the day's ledger.
- [x] Time: pause, 1x, 2x, 3x and "next event". The night runs on quickly, and the
      world never freezes while skipping.
- [x] A new game from a seed.

### Tests

- [x] The desk view never holds a quest's truth or an adventurer's hidden
      identity (true class, level, stats, traits).
- [x] A client's account never overstates: stated rank at or below the truth,
      hazards mentioned are real, the offer is within the budget.
- [x] A ready party does not set out until approved; a refused one never does.
- [x] Padding a posting with spare places no longer cuts deaths sharply.
- [x] "Next event" stops when someone reaches the counter or a request arrives.
- [x] The page code changes the simulation only through actions.
- [x] All earlier tests keep passing.

### Not in this milestone

Inspect and visible tells beyond an obvious injury (milestone 4). Saving and loading
in the browser. Gear, petitions, funds, the mentor. Art beyond placeholder shapes
and text portraits.

## Milestone 2. Core hardening

**Status: done** on 2026-11-17. Results in PROGRESS.md and AUDIT.md.

Scope comes from AUDIT.md. No page or interface yet. Items marked "decision" used the
rules recorded in PROGRESS.md.

**Done means:** `npm test` passes; a run can be saved as a seed plus an input
journal, reloaded and replayed to the same state hash; every audit finding below is
fixed or deliberately deferred with a note in PROGRESS.md.

### Build

- [x] Input journal: every accepted clerk action is recorded with its tick and actor.
      A save is the seed, the journal and the latest snapshot. (A1)
- [x] `tools/replay.js`: rebuild a run from a save, confirm the state hash, and print
      every event of one expedition on request. (A1)
- [x] Bounded save size: trim the live log, and archive closed quests and finished
      parties, so a year of play fits well inside browser storage. (A1, C5)
- [x] Hazard counters: apply the chosen rule. (A2, decision)
- [x] Economy: weight the request mix toward the roster's ranks, and add a
      placeholder gold sink. (A3, decision)
- [x] Party formation: a cool-down before a leader retakes a quest they gave up on;
      an empty slot may take a class that fills its job passably when nobody better
      is free. (A4)
- [x] Incident report causes: going out injured; the trait behind a choice; both a
      clerk's slip and an adventurer's lie when both happened; leader or follower.
      (B1)
- [x] Failed-quest report volume: apply the chosen rule. (decision)
- [x] Decisions receive a read-only copy of the adventurer. (B6)
- [x] A reposted quest gets a fresh post time; adventurers in a forming party pay
      upkeep and heal. (C1, C2)
- [x] `docs/events.md`: a schema for every log event type, kept in step with the
      code. (C3)

### Tests

- [x] A save made mid-run and replayed from its journal reaches the same state hash
      as the live run.
- [x] A year of simulated play stays under the save-size budget.
- [x] Every hazard on every template can be countered by some valid party.
- [x] Few adventurers leave broke: under 8 a run on average, down from about 20.
      (Restated from "no longer mostly rank F"; see PROGRESS.md.)
- [x] No leader re-forms the same quest within the cool-down.
- [x] The careful-versus-careless test becomes statistically sound: more seeds and a
      comparison of rates, with no loss of strength. (B2)
- [x] All milestone 1 tests keep passing.

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

5. Gear, loot and appraisal.
6. Petitions, rumor feed, reputation and funds.
7. City tutorial.
8. Frontier.
9. Staff, policies and audits.
10. Commendations and balance.
