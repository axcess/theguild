# Brief: build milestone 1, the headless simulation core

You are starting the first code in this repository. It holds a design doc, project
rules and a plan, and nothing else yet. Read CLAUDE.md, DESIGN.md, TODO.md and
PROGRESS.md in full before writing anything. PROGRESS.md records decisions already
made and the assumptions filling gaps in the design. Treat those as settled unless
you find they cannot work, in which case say so.

## What this is for

The Guild is a management sim where the player is a guild clerk whose paperwork
decides which adventurers live. This milestone is the simulation underneath that,
with no interface: adventurers arrive, get registered, pick quests off the board, go
out, and come back or die, and every death produces a report explaining why.

Later milestones put a desk interface on top of this, so two things matter more than
anything else here:

- **Replayability.** The same seed and the same clerk inputs must give exactly the
  same run. The player will be shown why someone died and the game has to be able to
  prove it, so a single unseeded roll or order-dependent loop breaks the core promise.
- **The gap between truth and paperwork.** Every quest has a hidden truth and a
  posting. Adventurers must decide from the posting alone, and expeditions must
  resolve against the truth alone. Deaths should come out of the difference. If the
  decision code can see the truth, the game has no point, so structure the code so
  that it is never handed it.

## Where the difficulty is

The checklist in TODO.md is the scope. These are the parts that are easy to get
subtly wrong:

- **The player is an input, not part of the simulation.** The core accepts clerk
  actions (register, post, reject) and advances time. It never makes a clerk decision
  itself. The scripted stand-in clerk used by tests and by `tools/run.js` sits
  outside `src/sim/` and feeds actions in the same way the interface will later.
- **Determinism leaks.** Everything random goes through the one seeded generator,
  whose state lives in the simulation state. Watch for iteration order over objects
  and sets, sorting without a full tie-break, and anything keyed on wall-clock time.
- **State is plain data.** It must survive a JSON round trip mid-run and carry on
  identically. No class instances, closures, Maps or Sets inside the state.
- **Incident reports are derived, not narrated.** Build each report by reading the
  event log and comparing the posting with the truth, so that every listed cause
  points at something that really happened. Log enough during resolution to make
  that possible. A report that invents a plausible cause is worse than none.
- **Paperwork has to matter measurably.** A careful clerk should lose clearly fewer
  adventurers than a careless one over the same seeds. Numbers do not need to be
  balanced, but if posting accuracy makes no difference to deaths, the resolution
  model is wrong.
- **The run should look alive.** Over 100 days, expect a mix of successes, retreats,
  injuries and some deaths, with the cast neither wiped out nor untouched. Use
  `tools/run.js` to look at real runs across several seeds and judge this yourself,
  not only through the tests.

## How to work

- Stay inside the milestone. TODO.md lists what is out of scope. Gear, inspect, and
  anything on a page come later, and building hooks for them now is not wanted.
- Keep tunable numbers and all content in `src/data/`, since they will be rebalanced
  often.
- Write the determinism test early and keep it passing as you add systems. It is
  much easier to keep determinism than to find where it was lost.
- Commit as each piece works, with the tests passing.
- Where the design leaves something undecided, pick the simplest option that fits
  the design pillars, record it in PROGRESS.md, and carry on. Stop and ask only if
  DESIGN.md contradicts itself or the choice would be expensive to undo.
- Do not weaken a test to make it pass. If a test in TODO.md looks wrong, say so.

## When you finish

Tick off TODO.md, update PROGRESS.md, commit and push. Then report:

- What is built, and the output of `npm test`.
- A summary of one 100-day run from `tools/run.js`: arrivals, quests by outcome,
  deaths, and one full incident report.
- The careful-versus-careless clerk comparison, with numbers.
- Every assumption you added, and anything in DESIGN.md you think needs a decision
  before milestone 2.
- Anything you did not finish or could not verify, stated plainly.
