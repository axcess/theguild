# The Guild: the finished game

A picture of version 1.0, detailed enough to plan backwards from. DESIGN.md stays
the source of truth for decisions. Anything here that DESIGN.md does not already
settle is marked **Proposal** and needs a yes or no before it is built.

## 1. The game in one paragraph

You are the clerk behind the counter of an adventurers' guild in a world that plays
like an MMO. You never fight. Adventurers walk up with claims you can't fully check,
clients bring jobs that are worse than they say, and you write the paperwork that
sends one to the other. When your paperwork is right, people come home richer. When
it is wrong, someone dies, and the incident report says exactly whose fault it was.
Over one playthrough you go from a junior clerk with a mentor watching, to the only
person in a frontier shack, to the head of a guild hall at the center of a town you
built, auditing staff who now make the mistakes you used to.

## 2. What playing it feels like

**Hour 1: the city branch.** The morning bell rings. A young man in borrowed armor
says he's a level 9 Warrior. Your Inspect is weak: you see a Warrior, plain gear,
and a level "somewhere between 4 and 12". You write him down as rank E. Your mentor,
Maud, reads the form over your shoulder and taps the rank box: "Too generous. Look
at his boots." You change it to F. At the intake desk the tithe-barn keeper says
the rats have started biting the dogs, and he'll pay 20 gold. You post it at rank F,
with no hazards listed. Maud catches that too: the barn sits by the river, and
river rats carry poison. This
is the only part of the game where someone checks your work.

**Hour 5: the frontier.** One desk, a leaking roof, a wall map that is mostly blank.
Eleven adventurers in town, and you know all of them by name. Cecily the Cleric is
the only healer, so every party you send without her worries you. A merchant wants
an escort through the pass. Nobody has mapped the pass. You post it at rank D with
"ambush?" in the hazard box, because a returning scout mentioned tracks. Three days
later two of the four come back. The incident report traces the death to the rank
you wrote, which was one too low. The map fills in a little more from their account.
The widow arrives the next morning as the daily petition.

**Hour 15: the guild town.** You have a counter clerk, an appraiser and a scout
office. The policy book says "no posting above rank C without my sign-off". You
spend the morning on audits: three of yesterday's postings, one of which your new
intake clerk under-ranked. You catch it before anyone picks it up. Headquarters
sends an auditor about last season's death count. Outside, the inn and the smithy
you funded are full. A rank B adventurer you registered at rank F in your first
week walks in. She's one rank-up from S, and from the "raise a legend"
commendation.

## 3. Shape and length

| Act | Real time | In-game time | The player | Ends when |
| --- | --- | --- | --- | --- |
| 1. City branch | 1 to 1.5 hours | about 10 days | Works one station per shift; the mentor catches mistakes | They accept the frontier posting |
| 2. Frontier | 5 to 7 hours | about 2 seasons | Does every job by hand; maps the zone | They can afford their first hire |
| 3. Growth | 8 to 12 hours, then open-ended | 4 to 8 seasons | Hires, sets policies, builds, audits | They take Promotion, or keep playing |

**Proposal: the calendar.** A season is 28 days and a year is 4 seasons. The
"zero-death season" commendation needs a season defined, and headquarters reviews
and quotas run on it.

**Proposal: pace.** At 1x speed, one in-game hour takes about 8 seconds while the
counter is open. Night is skipped unless something happens. A working day takes
about 2.5 minutes, and a season about an hour. Speeds are pause, 1x, 2x and 3x, plus
"skip to the next event", which never freezes the world.

**Proposal: a first playthrough takes 15 to 20 hours.** The game can continue after
Promotion or any commendation.

## 4. The player's tools

### The desk

Everything is an object in a fixed first-person scene. DESIGN.md lists the objects.
This is when each one arrives.

| Object | What it does | Arrives |
| --- | --- | --- |
| Counter | Adventurers approach one at a time; register, advise, approve or refuse pickups | Act 1 |
| Intake tray | New quest requests from clients, with the client's own description | Act 1 |
| Posting form and quest board | Write, pin, reprice and pull postings | Act 1 |
| Ledger and stamps | Accept, reject or re-rank requests; sign rank-ups | Act 1 |
| Payout drawer and appraisal scale | Pay out, appraise loot | Act 1 |
| Incident tray | Incident reports to read and sign | Act 1 |
| News feed | Rumors, party recruitment, complaints | Act 1 |
| Window and wall map | The zone, filled in from reports | Act 2 |
| Policy book | Standing rules that staff follow | Act 3 |
| Audit drawer | Spot-check staff paperwork against what happened | Act 3 |
| Memorial wall | Everyone who died on your paperwork, with their report | Act 1 onward |

### The forms

Each form is a set of fields the simulation compares with the truth.

- **Registration:** class and starting rank. This is the newcomer's guild record.
- **Posting:** rank, hazards, the classes recommended for each place, party size,
  recommended level, reward and a free-text description.
- **Pickup slip:** approve or refuse a party taking a posting, with an optional
  piece of advice ("take a healer").
- **Rank-up:** approve, defer or refuse.
- **Appraisal:** an item's identity, rarity and value, and whether it is cursed.
- **Payout:** the reward actually paid, which can differ from the posted reward.
- **Incident sign-off:** agree with the report's causes, or dispute one. A disputed
  cause goes to headquarters.

### Information

The player starts nearly blind. The game is about earning better information.

- **Inspect** (DESIGN.md tiers 1 to 5) on adventurers, items and requests. Unknown
  values show as blanks or ranges, never as wrong numbers.
- **Scouts:** paid trips that bring back the true rank and hazards of a request.
- **Returning parties' reports:** what they met, which fills in the map.
- **News feed:** gossip that is sometimes true.
- **Records room:** adventurer histories and the archive of incident reports.

## 5. The world

**Adventurers.** They have everything in DESIGN.md's agent spec, including what
milestone 1 left out:
- goals: reach a rank, afford an item, avenge a friend, retire rich
- friends and rivals
- advanced classes from level 20
- retirement

A retired adventurer the player kept alive becomes the best kind of hire.
**Proposal:** an adventurer's age and history decide when they retire, and a
retirement produces a short "career" page for the records room.

**Quests.** They come from the town's needs, dungeon overflow, server events and
headquarters orders. Some arrive as chains: the wolves were driven out by something
worse. Each request has a client who may undersell the danger or be unable to pay.

**Dungeons.** In the frontier, dungeons have monster populations that grow when
ignored and spill into the region. That raises request ranks and hurts the town. The
final dungeon is the "tame the zone" commendation.

**The town economy.** Prices, shortages and requests. Adventurers spend gold on
gear, rest and potions. This is the gold sink milestone 1 lacked.

**Rival branches and headquarters.** These run on the lighter model: counts and
rates, not individual agents. Rivals lure adventurers away with better pay.
Headquarters ranks the branches, sends funding and quotas, and reads every incident
report.

**Server events and patches.** These are scheduled and announced: a new dungeon, a
raid boss, a class made weaker. Each one changes the simulation's numbers for a
stretch of time.

## 6. Consequences and failure

- **Funds:** the branch's money. Income comes from client fees and headquarters
  grants. Spending goes on payouts, wages, facilities and scouts. Paying out more
  than the client paid costs the branch.
- **Town trust:** rises and falls with petitions, deaths and overflow. It decides
  which requests and newcomers come in.
- **Headquarters standing:** comes from incident reports, quotas and rankings.
- **Failure:** if funds or standing stay at zero for too long, the branch is closed.
  **Proposal:** closure comes with a warning season, and is the only true "game
  over". A save from before the closure warning is always kept.
- **Permadeath is never undone.** Every death goes on the memorial wall with its
  report. Deaths caused by staff count against the player at reduced weight (the
  working assumption in DESIGN.md).

## 7. The branch grows

This is DESIGN.md's list in full: staff for each station, the policy book, the
scouting office, the training yard, the records room, and the truck stop (inn,
tavern, smithy, potion shop, infirmary, stables).
**Proposal:** the truck stop's growth is visible from the window, and getting a
town charter is the "build a town" commendation.

## 8. Endgame and replay

- **Commendations** as listed in DESIGN.md. Several can be chased in one playthrough.
- **Promotion** starts a new game in a harder zone, carrying over only the player's
  Inspect level.
- **Proposal: shareable seeds.** A frontier comes from a seed, so players can trade
  zones. "Same seed, same choices, same deaths" becomes something players can use.
- **Proposal: the replay viewer.** From any incident report, re-run the expedition
  encounter by encounter, so players can see the determinism for themselves.

## 9. Presentation

- STYLE.md sets the rules for words and for the look, so the game doesn't read as
  generated.
- Fixed 2D desk scenes built from HTML and CSS, as DESIGN.md says. Placeholder
  shapes and text portraits until an art direction is chosen.
- **Proposal: art and audio.** Painted desk scenes and illustrated portraits with a
  few expressions each; the visible tells (nervous, bragging, injured) are drawn
  onto the portrait. Ambient hall noise, the stamp, the bell.
- **Proposal: accessibility.** Fully playable by keyboard. Text can be scaled.
  Rarity is never shown by color alone. Every pause-worthy event can be set to
  pause the game.
- **Proposal:** all text that players read lives in data files, ready for
  translation.

## 10. Content for 1.0

**Proposal:** these are targets to plan against, not promises.

| Content | Milestone 1 | 1.0 target |
| --- | --- | --- |
| Base classes | 6 | 6 |
| Advanced classes | 0 | 12 |
| Traits | 6 | 15 to 20 |
| Archetypes | 5 | 5 to 7 |
| Quest templates | 9 | about 60, including chains |
| Hazards | 6 | about 15 |
| Items | 0 | about 150 across 5 rarities, including fakes and cursed items |
| Petitions | 0 | about 80 |
| Server events and patches | 0 | about 20 |
| Frontier dungeons | 0 | 6 to 8, plus the final dungeon |
| Facilities | 0 | 9 |
| Full-sim cast | 20 to 40 | 20 to 40, plus the lighter wider world |

## 11. Technical shape of 1.0

- **The simulation core stays headless and deterministic,** with no dependencies.
  The interface reads state and sends actions, as now.
- **Proposal: a save is a seed plus a journal of the player's inputs,** with
  periodic snapshots so loading is quick. Saves stay small, and every save can be
  replayed and checked. The live event log is trimmed, and any stretch of it can be
  rebuilt from the journal for audits and the replay viewer. (Audit finding A1.)
- **Proposal: the action API records who acted** (the player or a named staff
  member). Staff are later just another source of the same actions, so reports can
  blame "the intake clerk's paperwork" without new plumbing.
- **Proposal: performance budget.** One in-game day simulates in under 20 ms, and a
  season skips in under a second on an ordinary laptop.
- **Saves are versioned, with migrations,** so updates never break a game in
  progress.
- **All content lives in data files,** so players can mod it.
- **Platform:** desktop browsers. **Proposal:** a desktop wrapper only once the
  game is otherwise done.

## 12. Working backwards: what the finished game asks of each layer

Each of these is a requirement on work done early, set by something that only
appears late.

| Late feature | What it needs early |
| --- | --- |
| Replay viewer, audits, disputes | An input journal and replay tool (milestone 2) |
| The desk reading the world | A written schema for log events and the views of state |
| Inspect showing ranges | Every hidden value has a "what the guild knows" form. The desk shows unknown fields as blanks from its first day |
| Staff making mistakes | Actions carry an actor; a staff member is a scripted clerk with an error rate, which milestone 1 already has |
| Policies | Actions stay plain data that can be checked against rules before they apply |
| The mentor's checks in Act 1 | A "compare this posting with the truth" function, which incident reports already do |
| The map filling in from reports | Quests have a location once the frontier exists; reports record what was met where |
| Rivals and the wider world | A clear boundary for moving adventurers between the full and the light simulation |
| A 20-hour game | Bounded save size and archiving of closed quests and parties (findings A1 and C5) |
| Raising a legend | A progression pace that reaches rank S within about 6 seasons (finding B3) |

## 13. Roadmap

Following the audit, milestone 2 is now hardening the core. DESIGN.md's later
milestones each move back by one.

| # | Milestone | Proves |
| --- | --- | --- |
| 1 | Simulation core, headless ✓ | Paperwork changes who dies, provably and replayably |
| 2 | Core hardening (from AUDIT.md) | A real player's game can be saved, replayed and audited, and the world is worth playing in |
| 3 | Desk, first playable | One working day is playable and readable |
| 4 | Inspect, registration and rank-ups | Better information visibly saves lives |
| 5 | Gear, loot and appraisal | Items change who survives |
| 6 | Petitions, news feed, reputation and funds | The branch can fail |
| 7 | City tutorial | A new player learns the job without dying to it |
| 8 | Frontier | The zone is unknown and gets mapped through reports |
| 9 | Staff, policies and audits | The player's job turns into auditing |
| 10 | Commendations and balance | A full playthrough holds up from start to finish |

Art, audio and accessibility run alongside, from milestone 3.

## 14. Decisions this vision depends on

Ranked by how soon they block work.

1. **Hazard counters** (audit finding A2). Do they add needed jobs, or can anyone
   suitable counter them? This blocks milestone 2.
2. **The gold sink before shops exist** (A3). This blocks milestone 2.
3. **Failed-quest report volume.** Every retreat gets a report, about 1.3 a day.
   Do we keep that, or report only retreats with an injury? This blocks milestone 2.
4. **Saves as seed plus input journal** (section 11). Needed by milestone 2.
5. **Pace and calendar** (section 3). Needed by milestone 3.
6. **Playthrough length** (section 3). Sets the content targets.
7. **How forgiving branch closure is** (section 6). Needed by milestone 6.
8. **Art direction** (section 9). Needed before any art is made.
9. **Where and how it ships:** a free web build, or paid. Not urgent.

## 15. Not in 1.0

Multiplayer. A real 3D look-around. The player fighting. Real-money purchases.
Voice acting. Procedurally generated portraits.
