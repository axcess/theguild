# Progress

## State

Repository scaffold only. No game code yet. Milestone 1 has not started.

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
