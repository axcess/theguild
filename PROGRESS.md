# Progress

## State

Milestones 1 and 2 are done: the headless simulation core, hardened after the
audit. All 37 tests pass. There is no page yet; milestone 3, the desk, is next.

- `src/sim/`: seeded generator, clock, adventurer generation, quest requests, clerk
  actions (register, post, reject, each recording who acted), the decision and self
  views, adventurer decisions, party formation, expedition resolution, permadeath,
  levelling, incident reports, and saves with replay (`save.js`).
- `src/data/`: classes, stats, jobs, ranks, traits, archetypes, names, quest
  templates, hazards, and every tunable number in `tuning.js`.
- `tools/clerk.js` is the scripted stand-in clerk; `tools/runner.js` drives a run
  and gathers its full log. `tools/run.js` prints a run. `tools/replay.js` saves,
  replays and verifies a run, and prints the events behind an expedition or an
  incident report.
- `docs/events.md` is the schema of every log event, checked by a test.

Measured over seeds 1 to 12, 100 days each, after milestone 2:

| | Careful clerk (no errors) | Careless clerk (error 0.2) |
| --- | --- | --- |
| Deaths per run | 1.8 (0 to 4) | 5.3 (1 to 10) |
| Expeditions per run | 362 | 364 |
| Retreats per run | 27 | 77 |
| Incident reports per run | 12 | 38 |
| Left town broke per run | 3.5 | 2.8 |
| Parties broken up per run | 235 | 252 |

Over 16 seeds the careless clerk loses 2.4 times as many adventurers (paired
t statistic 3.6). A year of play saves in about 850 KB.

## Decisions

- **Engine:** plain HTML, CSS and JavaScript, not Godot. The game is mostly forms and
  text, and the simulation has to run headless under Node. Revisit only if the desk
  becomes real 3D, and do so before the desk (milestone 3).
- **Modules:** ES modules, shared by Node and the browser. The page must be served,
  not opened from disk.
- **Data files:** ES modules exporting plain data, so they load the same way in Node
  and in the browser.
- **Tests:** Node's built-in test runner. No dependencies.
- **Simulation state:** plain JSON-compatible data, including the random generator's
  state, because saves are JSON and a death must be replayable.

## Working assumptions in use

From DESIGN.md's open questions:

- Adventurers pick quests from the board themselves. Counter approval and refusal
  arrive in milestone 2.

Gaps in DESIGN.md filled for milestone 1, to be confirmed:

- Milestone 1 has no player, so a scripted stand-in clerk supplies registrations and
  postings. It lives outside the simulation core and is an input like any other.
- A posting's hazards are a list of tags the simulation can compare with the truth.
  The free-text description is for display only.
- Quest requests and newcomers arrive at simple fixed rates until the town economy
  and the wider world exist.
- Adventurers keep the rank given at registration. Rank-ups arrive in milestone 3.
- One tick is one in-game hour, as a tunable constant. The time model is still open.

Added while building milestone 1, to be confirmed:

- **The scripted clerk reads a request's truth** and then degrades it at its error
  rate. It stands in for a clerk who investigates. Registration uses only what the
  newcomer claims. The real player will never see the truth directly.
- **Postings are slots.** Each slot lists the recommended classes for one place in
  the party, or none for "any class". Party size is the number of slots. A careful
  clerk writes one slot per truly needed job, listing the classes whose best job it
  is. A careless one blanks slots to "any".
- **Who blames whom.** A gap between the posting and the truth is always paperwork.
  A record that differs from what the newcomer claimed is paperwork. A record that
  matches a lie is the adventurer's choice. So are reaching up a rank, going in under
  the recommended level, setting out short-handed and pressing on when hurt. A
  strong party losing a roll, or a healer's save failing, is bad luck.
- **Hazards** each have a counter job. A party that covers that job blunts the
  hazard. If the hazard was on the posting, the party comes prepared and takes a
  little less harm. If it was neither, it hits hard.
- **Jobs are assigned by true class** when a party sets out, choosing the assignment
  that covers the most jobs. A job counts as covered at fit 0.7 or better.
- **Outcomes.** Every encounter cleared is success. A lost encounter forces a
  retreat. A retreat after clearing at least half the encounters is partial success,
  paid half. A party where everyone dies is "wiped", and gets a failed-quest report.
- **Forming parties.** A leader takes a posting and waits up to 18 hours for the
  slots to fill. Then they set out short-handed if their traits allow it, or the
  party breaks up and the posting goes back on the board.
- **Money.** Adventurers pay 2 gold a day in upkeep and leave town if they fall to
  -40. This is the main source of departures. There is no guild money yet.
- **The clerk rejects requests** more than one rank above the best rank on the
  roster. Rejecting is otherwise unused.

Decided with the user on 2026-11-17, before milestone 1:

- **Wrong class on registration:** it matters twice. Parties fill job slots from the
  guild record, and postings that recommend classes filter by the registered class.
- **Rank gate:** an adventurer may take postings up to one rank above their
  registered rank. Reckless and overconfident traits make reaching up more likely.
- **Registration input:** newcomers state a class and level. Some exaggerate,
  depending on their traits. The clerk records the claim, plus its own errors.
- **Death-rate target over 100 days:** about 3 to 8 deaths with a careless clerk and
  about 0 to 2 with a careful one.
- **Incident reports:** every death, and every quest that ends in retreat. Partial
  success and injuries are logged but get no report.
- **Leaving town:** permanent. New arrivals keep the cast between 20 and 40.
- **Day shape:** 24 ticks. Morning, midday and evening phases, plus a night when the
  counter is closed but expeditions and travel continue.

## Session log

- 2026-11-17: Scaffold, design doc, project rules, milestone 1 plan and briefs.
- 2026-11-17: Decided the seven open milestone 1 questions with the user. Built
  milestone 1: simulation core, data files, scripted clerk, run tool and 23 tests.
  Tuned death rates against the targets across 12 seeds.
- 2026-11-17: Audited milestone 1 (AUDIT.md) and wrote the vision of the finished
  game (VISION.md). Milestone 2 is now core hardening, built from the audit.
  DESIGN.md's later milestones each move back by one.
- 2026-11-17: Content pass so the game doesn't read as generated: names from a
  single medieval English register, quest titles in the client's voice, named
  clients. Added STYLE.md (look and voice) and a content test for stock names and
  phrases. Names and titles are cosmetic, so runs and balance are unchanged.
- 2026-11-17: Built milestone 2, core hardening, with the user's go-ahead on the
  recommended decisions. All audit findings are fixed or deferred with a note. 37
  tests.

## Milestone 2 decisions, taken 2026-11-17

The user accepted the recommendations:

- **Hazard counters (A2).** Anyone in the party who fits the counter job well
  blunts a hazard: fully if they are assigned to that job, partly (`helped`) if
  they are busy with another. A careful clerk adds an extra place to the posting
  when no recommended class can deal with a listed hazard. Leaving it out is a
  paperwork cause (`counter_unrecommended`).
- **Gold sink (A3).** Upkeep is 1 gold a day plus 1 for each rank of true level
  above F. Requests are pitched at the rank of someone in town 60% of the time.
  Every job pays a base of 18 plus 12 per rank, so rank F work covers rank F
  upkeep.
- **Failed-quest reports.** Only when the party was wiped out, or retreated with
  someone dead or newly injured. A clean retreat is logged but not reported.

Added while building milestone 2, to be confirmed:

- **Low-rank work for every job.** Ranks F and E had solo work only for damage
  dealers and scouts, so warriors, clerics and bards starved. Added four templates:
  the lazar house (healer), the bridge gate (tank), the players' wagon (support and
  tank) and the hill beacon (support and scout).
- **Joining beats leading.** Joining a party that is already forming scores 8
  points higher than starting a new one. Without this, idle adventurers each
  started their own three-person party and all of them broke up.
- **Stopgaps.** An empty place recommended for one class may be taken by a class
  that fills its job passably, but only when nobody of a recommended class is free.
  This is logged as `stopgap`.
- **Giving up.** Members of a party that breaks up won't take that quest again for
  48 hours, and the posting goes back on the board with a fresh post time.
- **Saves.** A save is the seed, the journal of accepted actions, and a snapshot.
  The live log keeps 7 days plus anything a party still out will need for its
  reports. Finished quests and parties leave the live state after 7 days.
  Adventurers who leave town keep a short record instead of their full history.
  The scripted clerk's own state is not part of a save, since a real player
  replaces it.
- **Who acted.** Every action carries `by` (default `clerk`), so staff can later
  be blamed for their own paperwork.

Test changes in milestone 2, none of them weakening:

- The failed-quest report test follows the new rule, and also checks that clean
  retreats are *not* reported.
- The careful-versus-careless test now uses 16 seeds and requires at least twice
  the deaths and a paired t statistic of at least 3. This replaces a fixed margin
  that the measured numbers cleared by only 3 deaths (audit finding B2).
- The audit's "broke leavers no longer mostly rank F" became "under 8 broke a run,
  down from about 20". Once few leave broke, the rank F share of a handful of cases
  is noise; the count is what mattered.

## Working assumptions for milestone 3

- **Pace** (open question on the time model): at 1x, one in-game hour takes about
  8 seconds while the counter is open, as VISION.md proposes. 2x and 3x divide
  that. Night runs at about a quarter of a second an hour at any speed. "Next
  event" never freezes the world.
- **Pickups:** a ready party waits at the counter for as long as it takes. The
  queue is in front of the player, so nobody slips past it.
- **Clients understate.** A client often names a lower rank than the truth, and
  mentions some of the hazards but never invents one. They offer at most what they
  can pay.
- **Tells:** only an obvious injury shows at the counter until Inspect arrives.

## Open after milestone 2

- **Progression (B3)** is about 23 level-ups per run and is not yet tuned. It
  waits for the calendar in VISION.md section 3.
- **Client budgets (B4)** wait for funds in milestone 6. **Goals, rivals and
  retirement (B5)** wait for the counter in milestone 3 or later.
- **Luck is rarely the cause.** Over a careless run, bad luck appears in only a
  few reports. That fits "paperwork has consequences" but may feel harsh. Revisit
  in balance.

## Earlier questions, now covered by the audit

- **Departures.** About a quarter of all arrivals leave within 100 days, mostly
  because they ran out of money. Is that the churn we want, or should the guild
  feel more like a home base?
- **Retreats.** Retreats are common (about a third of expeditions with a careless
  clerk), so failed-quest reports outnumber death reports by a lot. Do we want a
  report for every retreat, or only for retreats with an injury?
- **What the player sees of a request.** The stand-in clerk reads the truth. The
  desk needs a request form showing what the client says, which can understate the
  danger. DESIGN.md says Inspect on requests reveals this, but milestone 2 comes
  before Inspect. What should the client's form show at milestone 2?
