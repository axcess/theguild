# Audits

- Milestone 2, core hardening: below.
- Milestone 1, the headless simulation core: further down.

# Audit: milestone 2, core hardening

Audited 2026-11-17, at commit `cafd6fe`. The findings set the simulation work that
milestone 3 needs before the desk can sit on top.

## Verdict

The hardening holds up. Saves replay exactly from any tick, the live log never
loses an event a report needs, and the economy and party fixes did what they were
meant to. One finding makes a desk control meaningless (D1). Two show the core
can't yet support what the desk is for (D2, D3).

## How it was checked

- Re-read every file changed in milestone 2.
- Checked invariants every 5 ticks over 3 careless runs of 100 days: party and
  quest pointers, and archived quests and trimmed log entries that are still needed.
- Made saves at ticks 0, 1, 5, 23, 24, mid-run and late at night. Verified each
  and loaded it to the same hash.
- Ran two years in one go, measured the save, and replayed it.
- Tried to game the new rules: padding every posting with extra places.
- Measured what the desk would see each day once the run settles.

## What holds

| Check | Result |
| --- | --- |
| Invariant violations, 3 runs × 2,400 ticks | None |
| Saves at awkward ticks verify and load to the same hash | All of them |
| Two years of play | Simulated in 1.7 s, saves in 1.6 MB, replay matches |
| Live state after two years | 420 log events, 51 quests, 99 parties: bounded |

## Findings

### High

**D1. Padding a posting is free safety.** Members beyond the quest's true jobs add
their full strength, and the only cost is a thinner reward share. A careful clerk
who adds two "any class" places to every posting loses 4 adventurers over 6 seeds
instead of 13. Once the player sets party size at the desk, "always pad" would be
the only sensible play, and recommended party size would stop being a judgment.
*Recommendation:* spare hands help at reduced strength (half), so a sixth sword
is worth less than the right one.

**D2. There is no pickup approval.** DESIGN.md's working assumption is that
adventurers pick from the board and the player can approve or refuse at the
counter. Parties currently set out the moment they fill. The counter, the heart of
the desk, has nothing to do but registration.
*Recommendation:* a party that is ready queues at the counter and waits for an
approve or refuse action. The scripted clerk approves.

**D3. Requests have no client's account.** The scripted clerk reads the truth.
The player must not, and there is nothing else to post from but the title.
DESIGN.md says clients undersell danger and Inspect reveals the truth later.
*Recommendation:* each request carries the client's own account: the rank they
think it is (often low), the hazards they mention (some, never invented), and what
they offer (at most what they can pay).

### Medium

**D4. The counter goes quiet once the cast is full.** At 40 adventurers, arrivals
drop to about 0.2 a day, and only about 7 leave in 100 days. The desk will mostly
see pickups. That is acceptable for now. Revisit with the frontier's smaller cast
(Act 2).

**D5. The save grows about 0.8 MB a year,** mostly incident reports, the fallen and
the journal. VISION.md's longest play (about 3 years) fits in local storage, but
the budget test covers only one year.

### Low

- **D6.** A stopgap place is blocked if anyone of the named class is free, even
  someone whose rank doesn't allow the posting. Stopgaps are rare (20 of about
  2,500 fills), so this matters little.
- **D7.** Verifying a save replays the whole game: about 0.8 s per year of play.
  That's fine on demand. Loading uses the snapshot, not replay.
- **D8.** Bad luck is still rarely a cause (carried over from milestone 2).

# Audit: milestone 1, the headless simulation core

Audited 2026-11-17, at commit `e76204d`. The findings here set the scope of
milestone 2 (see TODO.md).

## Status after milestone 2

| Finding | Status |
| --- | --- |
| A1 replay and saves | Fixed: input journal, `save.js`, `tools/replay.js`, a trimmed log; a year saves in about 850 KB |
| A2 hazards | Fixed: anyone fit for the counter job helps; the clerk recommends a counter |
| A3 economy | Fixed: roster-pitched requests, base pay, upkeep by rank, low-rank work for every job; broke departures went from about 20 a run to about 3 |
| A4 party formation | Fixed: cool-down, stopgap places, joining preferred; break-ups halved and no loops |
| B1 report causes | Fixed: going out injured, the traits behind choices, leader or follower, double blame, unrecommended counters |
| B2 brittle test | Fixed: 16 seeds and a paired t statistic |
| B3 progression | Measured, deferred to the calendar decision |
| B4 client budget | Deferred to milestone 6 |
| B5 goals, rivals, retirement | Deferred to milestone 3 or later |
| B6 truth isolation | Fixed: decisions get copies |
| C1, C2 | Fixed |
| C3 event schema | Fixed: `docs/events.md`, checked by a test |
| C4 clerk generator | Moot: replay uses the journal |
| C5 archiving | Fixed |
| C6 golden hash | Left as a tool: `tools/replay.js` checks hashes |

## Verdict

The core does what milestone 1 promised. Runs replay exactly, the decision code
never sees a quest's truth, every incident report cause is backed by the log, and
the clerk's paperwork clearly changes the death rate. It is not yet ready to put a
player in front of. A real player's game cannot be replayed or saved for long. The
economy starves low-rank adventurers. Party formation loops. And about a quarter of
hazards cannot be countered by any party.

## How it was checked

- Read every file under `src/sim/`, `src/data/` and `tools/` again from the start.
- Ran 12 runs of 100 days each: seeds 1 to 6, each with a clerk who makes no errors
  and with a careless clerk at error rate 0.2. Checked state invariants every 7
  ticks: every adventurer's party pointer is valid, statuses are consistent, and
  morale stays in range.
- Hashed the full state of seed 42 after 100 days in two separate Node processes.
- Gathered metrics from the logs: departures by reason and level, party formation
  and break-up, hazard coverage, rank mix of requests against the cast, save size.

## What holds

| Check | Result |
| --- | --- |
| Same seed and inputs, same process | Identical log and state |
| Same seed and inputs, separate processes | Identical state hash (`fb35a083…`) |
| Save to JSON mid-afternoon, load and continue | Identical to an unbroken run |
| Unseeded randomness, clock time or page globals in the core | None |
| Decision view holds quest truth | Never, across 40 sampled mornings |
| Report causes checked against the log | All verified, over 4 careless runs |
| Clerk who makes no errors blamed in a report | Never |
| Invariant violations, 12 runs × 2,400 ticks | None |
| Deaths per 100 days, no errors / error 0.2 (seeds 1–8) | 25 / 61 in total |

## Findings

Ranked by how much they block the game the vision describes (see VISION.md).

### High

**A1. A player's game cannot be replayed, and saves will not fit.**
Replay works only because the scripted clerk can be re-run. A human player's
actions are logged as events but never kept as a replayable input journal, and no
tool replays a run and checks it. CLAUDE.md promises that any death can be
replayed from a seed. That holds for scripted runs, not for players. Separately,
the state is 1.2 to 1.4 MB after 100 days, almost all of it event log. DESIGN.md
puts saves in local storage, which browsers cap at about 5 MB, so a game of about a
year runs out of room.
*Recommendation:* make a save the seed plus a journal of `{tick, action}` inputs,
with periodic snapshots to speed up loading. Compact or rotate the live log.
Add `tools/replay.js`, which rebuilds a run from a save and confirms the hash, and
can print every event of one expedition for an audit.

**A2. About 27% of hazards can never be countered.**
A hazard is blunted only by a party member assigned to its counter job. The member
can only be assigned to a job the quest truly needs. So a wolf pack's ambush (the
counter is a scout, but wolf packs need a tank and a damage dealer) can never be
countered, and neither can poison on rats or swamp herbs, or an ambush at a bandit
camp. Across the runs, 80 of about 300 hazards a run fell into this gap. Spare
members can't counter anything either. That makes listing hazards on the posting
the only defence, and it skews the paperwork lesson.
*Decision needed:* either a hazard adds its counter job to the quest's true needs,
or any member who fits the counter job well can blunt the hazard, perhaps at
reduced effect if they are busy with another job.

**A3. The economy starves the bottom of the roster.**
Survivors end a run with about 165 gold each and nothing to spend it on. Yet about
20 adventurers a run leave town broke, and 80% of them are rank F. Requests are
drawn from templates without regard to who is in town. They come out mostly E and
D rank, while the roster is mostly F and E. A careful clerk posts only about 0.8
rank F quests a day for about 12 rank F adventurers. A quarter of all postings
expire with nobody taking them, mostly high-rank ones.
*Recommendation:* weight the request mix towards the roster's ranks, as a
stand-in for the town economy. Add a placeholder gold sink until shopping exists,
such as upkeep that rises with rank.

**A4. Party formation churns and loops.**
Each run has about 470 parties break up against about 265 departures. 44% of all
party formations are the same leader re-forming the same quest after giving up.
Slots filter strictly by the class on record, so parties of three and four rarely
fill. While a party forms, its quest is off the board for everyone else.
*Recommendation:* make a leader wait before re-taking a quest they gave up on. Let
an empty slot accept a class that fills the job passably, flagged as a weaker fit,
when nobody better is in town. Log one break-up per quest rather than a loop.

### Medium

**B1. Incident reports leave out causes the design names.**
- Going out injured is never a cause, though about 30 adventurers a run set out
  injured.
- Reports name the choice but not the trait behind it. DESIGN.md's example cites
  "party leader overconfident".
- When the clerk inflated a rank and the adventurer also lied, only the clerk is
  blamed.
- A leader's choice and a follower's choice are not told apart.

**B2. The careful-versus-careless test is brittle.**
The careless total was 61 against a threshold of 58. Small tuning changes will flip
the test without anything being wrong. It should keep its strength but become
statistically sound: more seeds, and a comparison of rates rather than a fixed
margin. This is not a weakening.

**B3. Progression is very slow.**
After 100 days the roster holds about 3 rank C adventurers and none higher. The
"raise a legend" commendation (rank F to S) would take years of game time. This
needs a pacing target, which VISION.md proposes.

**B4. The client's budget is unused.**
The truth records what the client can pay, but the clerk posts that exact amount
and nothing compares a posted reward with it. Over- and under-pricing need a
consequence before the desk lets the player set rewards.

**B5. Adventurer goals, rivals, age and retirement are missing.**
DESIGN.md's agent spec lists goals (reach a rank, afford an item, avenge a friend,
retire rich) and rivals. They were not on the milestone 1 checklist and are not
built. Age is generated but unused. Goals are what make adventurers read as people
at the counter.

**B6. Truth isolation relies on convention.**
The decision functions get the live adventurer object, not a copy, and the test
that they never see truth is a static check of imports. That is sound today but
easy to break. Handing decisions a read-only copy of the adventurer would make it
structural.

### Low

- **C1.** A posting that goes back on the board after a party breaks up keeps its
  original post time, so it can expire that same night.
- **C2.** Adventurers in a forming party pay no upkeep and their injuries don't
  heal, because the daily update skips them.
- **C3.** Event types are informal. The desk will read the log, so the events need
  a written schema first.
- **C4.** The scripted clerk has its own seeded generator. That's fine, since it is
  an input, but it differs from the wording "one seed drives all rolls". A replay
  journal (A1) makes this moot.
- **C5.** Lookups scan arrays and the lists never shrink. That's fine at 0.2 s per
  100 days, but closed quests and finished parties should be archived for long
  games.
- **C6.** No test pins the exact behaviour of a seed. A golden hash would catch
  accidental changes, but it would break on every tuning change, so it belongs in
  a tool rather than the test suite.

## What milestone 2 needs from this

TODO.md turns these findings into the milestone 2 checklist: replay and saves, the
hazard rule, the economy fix, party formation, report causes, the clerk test, and
the low-priority fixes. Three findings need a decision before building (A2, A3 and
how many failed-quest reports to raise). They are listed at the end of
PROGRESS.md.
