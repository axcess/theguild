# Progress

## State

Milestone 1, the headless simulation core, is built and all 23 tests pass. There is
no page yet.

- `src/sim/`: seeded generator, clock, adventurer generation, quest requests, clerk
  actions (register, post, reject), the decision view, adventurer decisions, party
  formation, expedition resolution, permadeath, levelling and incident reports.
- `src/data/`: classes, stats, jobs, ranks, traits, archetypes, names, quest
  templates, hazards, and every tunable number in `tuning.js`.
- `tools/clerk.js`: the scripted stand-in clerk. `tools/runner.js` drives a run.
  `tools/run.js` prints a run's summary, its incident reports and, with `--log`, the
  full event log.

Measured over seeds 1 to 8, 100 days each: a clerk who makes no errors loses 25
adventurers in total (1 to 5 a run, about 3 on average); a careless clerk at error
rate 0.2 loses 61 (3 to 13 a run, about 7.6 on average). The careful clerk is a
little above the 0 to 2 target. Those deaths come from adventurers' own choices:
lying at registration, reaching up a rank, setting out short-handed, pressing on.
Counter refusals (milestone 2) and Inspect (milestone 3) are the player's tools for
those, so the gap is left in deliberately rather than tuned away.

## Decisions

- **Engine:** plain HTML, CSS and JavaScript, not Godot. The game is mostly forms and
  text, and the simulation has to run headless under Node. Revisit only if the desk
  becomes real 3D, and do so before milestone 2.
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

## Decisions needed for milestone 2

From AUDIT.md. Milestone 2 builds the rest while these wait.

- **Hazard counters (A2).** About 27% of hazards can't be countered, because their
  counter job is not one the quest needs. Options: a hazard adds its counter job to
  the quest's true needs; or any member who fits the counter job well blunts it,
  perhaps less well if busy with another job.
- **Gold sink before shops (A3).** Options: upkeep that rises with rank; a fee paid
  to the guild on each quest; resting at an inn for gold.
- **Failed-quest reports.** Keep one for every retreat (about 1.3 a day), or only
  for retreats where someone was hurt.

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
