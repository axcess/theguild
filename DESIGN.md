# The Guild — Game Design Doc

As of November 16, 2026.

## Overview

The Guild is a single-player, first-person management sim where the player runs an adventurers' guild branch in a simulated MMO-style world. The player is never the hero. They are the clerk behind the counter who decides which adventurer gets which quest, and their paperwork decides who comes home.

The world is not a real MMO. Every adventurer is a simulated character who behaves like an MMO player. Reference point: Kairosoft's Dungeon Village, seen from the desk instead of from above.

**Design pillars**

- **Influence, not control.** Adventurers make their own decisions. The player steers them only through postings, rewards, rank approvals, registration and advice.
- **Paperwork has consequences.** Every form the player fills in feeds the simulation. A wrong rank or a missing class recommendation can get someone killed, permanently.
- **Information is the real resource.** The player starts nearly blind and earns better information through the Inspect skill, scouts and reports.
- **Manual first, automated later.** The player does every job by hand, then hires staff and sets policies to take over the jobs they have mastered.
- **A world that moves without you.** Dungeons, the town, rival branches and headquarters all change whether or not the player is watching.

## Game structure

The game runs in three acts, and each act changes what the player spends their time doing.

1. **Act 1: the city branch (tutorial).** The player is a junior clerk in an established branch in a large city. They rotate through one station per shift: counter, quest intake, appraisal, records, payouts. A senior mentor checks their work, so mistakes are caught before anyone dies. This is the only time the player has that safety net. The act ends with an offer nobody else wants: open a new branch in a dangerous frontier zone.
2. **Act 2: the frontier (manual).** The player arrives alone at a shack with one desk and does every job by hand. Few adventurers come through, so each one is known by name. The zone is unmapped, and the map fills in from returning parties' reports, so early postings are guesses.
3. **Act 3: growth and automation.** The player hires staff, sets policies and builds facilities. Their role shifts from doing the work to auditing it: spot-checking paperwork, reading incident reports and handling escalated exceptions.

## Core loop

Play happens on three layers, each on its own timescale.

**The desk (minute to minute).** A fixed first-person view from behind the counter. Everything the player does is an object on or around the desk.

- **Counter:** adventurers approach one at a time with a portrait, dialogue and visible tells (nervous, bragging, injured).
- **Quest board:** behind the player. They turn around to pin, reprice or pull postings.
- **Ledger and stamps:** accept, reject or re-rank quest requests, and sign off on rank-ups.
- **Window and wall map:** the world sim at a glance, such as smoke over a dungeon or a caravan arriving.
- **News and rumors:** a scrolling "world chat" feed of gossip, party recruitment and complaints. It is flavor and also an information source.

**The daily petition (day to day).** Each morning one or two visitors bring a choice with consequences: the mayor wants wolves cleared for free, a merchant offers a shady sponsorship, headquarters sends an auditor, a widow blames the player for a death. Outcomes change reputation, funding, and which quests and adventurers show up.

**The branch (week to week).** Hiring, facilities, policies and community relations. See Branch growth.

**A working day**

1. Open the hall and take the morning petition.
2. Review new quest requests from townsfolk, then rank, price and post them.
3. Work the counter queue: register newcomers, advise, approve or refuse quest pickups.
4. Read returning parties' reports, appraise loot and pay out.
5. Close the books and read any incident reports.

**Time.** The day has a morning rush, a quiet midday and evening returns. Speeds are pause, 1x, 2x and 3x, plus "skip to next event". Skipping does not freeze the simulation: parties still succeed or die while the player waits. The exact time model is still open (see Open questions).

## Simulation engine

Every adventurer is an independent agent in a tick-based simulation that runs with no screen attached. The interface only reads the simulation's state and sends it the player's decisions.

**Adventurer agents.** Each has:

- Identity: name, class, level, guild rank, age.
- Stats and gear (see Classes, stats and gear).
- Traits that skew judgment, such as cautious, reckless, greedy, loyal, overconfident.
- An MMO "player" archetype: grinder, speedrunner, roleplayer, loot goblin, or weekend casual.
- Needs: gold, rest, injuries, morale.
- Goals: reach a rank, afford an item, avenge a friend, retire rich.
- Relationships: friends, rivals, party history.
- A history log of everything that happened to them. The log feeds inspect, incident reports and retirement.

**Decisions.** Each tick an adventurer scores their options (take a quest, rest, train, shop, look for a party, leave town) and picks the best by their own judgment. They see only posted information, filtered through their traits. An overconfident rookie rates a hard quest as easier than it is.

**Quest resolution.** Expeditions resolve off-screen as a chain of encounters. Each encounter tests the party against what the quest truly demands: total power, the jobs covered, gear, injuries and morale. Outcomes are success, partial success, retreat, injury and death.

**World simulation.**

- Dungeons have monster populations that grow when ignored and can overflow into the region.
- The town has an economy: prices, shortages, and requests that become quests.
- Rival branches compete for adventurers and for headquarters' favor.
- Scheduled "server events" and "patches" shake things up: a new dungeon opens, a raid boss appears, a class gets weaker.

**Two levels of detail.** Adventurers registered at the player's branch get the full simulation. The wider world runs on a lighter model (counts and rates) to keep it cheap.

**Seeded randomness.** One seed drives all random rolls. The same seed and the same player inputs must produce the same result, so any death can be replayed and audited, and tests are repeatable.

## Truth versus paperwork

Every quest exists twice: the hidden truth, and the posting the player writes. Adventurers only ever see the posting, and the gap between the two is the main source of deaths.

|  | Hidden truth | Player's posting |
| --- | --- | --- |
| Difficulty | Actual danger rank | Posted rank (F to S) |
| Threat | Actual monsters and hazards | Written description |
| Party needs | Jobs truly required | Recommended classes and party size |
| Experience | Level truly needed | Recommended level |
| Pay | What the client can afford | Posted reward |

The same gap exists for people. An adventurer has true stats and experience, and the guild record holds whatever the player wrote down at registration and at each rank-up.

**Ways the player gets someone killed**

- Posting a quest below its true rank.
- Leaving out a needed job, such as a healer.
- Registering a newcomer with the wrong class or an inflated rank.
- Approving a rank-up too early.
- Writing a description that hides or misses a hazard.

**Permadeath.** A dead adventurer is gone for good, along with their gear, relationships and history. Friends and party members react.

**Incident reports.** Each death or failed quest produces a report that traces causes from the simulation log, for example "posted rank E, actual rank C, no healer recommended, party leader overconfident". Each cause is attributed to the player's paperwork, a staff member's paperwork, the adventurer's own choice, or bad luck. Headquarters reads the same report, and it affects the branch's record.

## Classes, stats and gear

An adventurer is described by a class (what they are), the job they fill on a given quest, and a guild rank the player controls. This is a first pass, and the numbers are for balancing later.

**Six base classes.** Advanced classes branch out at a level threshold. The branch names are placeholders.

| Class | Best job | Can also fill | Key stats | Advanced branches |
| --- | --- | --- | --- | --- |
| Warrior | Tank | Damage | Strength, Vitality | Knight, Berserker |
| Rogue | Scout | Damage | Agility, Luck | Assassin, Trickster |
| Ranger | Damage (ranged) | Scout | Agility, Spirit | Sharpshooter, Beastmaster |
| Mage | Damage (magic) | Support | Intellect, Spirit | Elementalist, Summoner |
| Cleric | Healer | Support | Spirit, Vitality | Priest, Paladin |
| Bard | Support | Scout | Luck, Intellect | Skald, Dancer |

**Jobs.** Tank, healer, damage, scout, support. Each quest truly needs some set of jobs. A class can fill a job outside its strengths, but badly, and that mismatch raises risk.

**Stats.** Six generic primary stats: Strength, Agility, Intellect, Vitality, Spirit, Luck. Derived values (health, attack, defense, healing, scouting) are calculated from primary stats, level and gear.

**Guild rank.** F, E, D, C, B, A, S. Rank is paperwork, not truth: the player grants it at registration and approves each rank-up. Rank gates which postings an adventurer may take.

**Gear.** Slots are weapon, armor, accessory and consumables. Items have a level, stat bonuses and a rarity. Gear drops as loot, is bought in town, and is lost with a dead adventurer unless a party member carries it back.

| Rarity | Color |
| --- | --- |
| Common | Gray |
| Uncommon | Green |
| Rare | Blue |
| Epic | Purple |
| Legendary | Orange |

Keep classes, stats, items and rarities in data files, so they can be rebalanced or renamed without touching the simulation code.

## Inspect

Inspect is the player character's own skill and their main progression: as it levels up, more of the hidden truth becomes visible, so the player makes better decisions.

| Tier | What inspecting an adventurer reveals |
| --- | --- |
| 1 | Name, class, visible gear |
| 2 | Level, gear rarity colors |
| 3 | Full stats and item details |
| 4 | Traits, hidden injuries, and whether they are lying about their experience |
| 5 | Growth potential, and who they would work well with |

The same skill applies to two other things:

- **Loot and items:** spotting fakes, cursed items and true value at appraisal.
- **Quest requests:** spotting a client who is underselling the danger or cannot pay.

At low tiers the interface shows unknown values as blanks or ranges (for example "Level 8 to 14"), never as wrong numbers. Inspect improves with use and with promotions. Staff have their own inspect level, which limits how good their paperwork can be.

## Branch growth

The frontier branch grows from a one-desk shack into the center of a small town, and each addition either automates a chore or changes the simulation.

**Staff.** Each hire takes over one station (counter, intake, appraisal, records, payouts). Staff work at their own skill and inspect levels and make mistakes the player has to catch. Retired adventurers the player kept alive are the best hires, as scouts, trainers and appraisers.

**Policies.** Standing rules that staff follow, such as "never post above rank C without my sign-off", a minimum party size, or a mandatory healer above a given rank.

**Guild facilities.**

- Scouting office: automatic danger estimates for new requests.
- Training yard: fewer rookie deaths, faster early levels.
- Records room: better incident reports and adventurer histories.

**The truck stop.** Services that grow up around the hall for adventurers passing through:

| Facility | Effect on the simulation |
| --- | --- |
| Inn | Faster rest and morale recovery |
| Tavern | Party formation, rumors, occasional trouble |
| Smithy | Gear repair and upgrades |
| Potion shop | Consumables that reduce deaths |
| Infirmary | Injuries heal faster and fewer become permanent |
| Stables | Shorter travel, wider quest range |

Better services attract more and higher-rank adventurers.

**Community.** The surrounding town supplies quests, staff, supplies and goodwill. It suffers when dungeons overflow or adventurers cause trouble, and its trust in the branch rises or falls with the player's choices in daily petitions.

**Headquarters.** Sends funding, quotas, audits and the occasional unwelcome order. It reads incident reports and ranks the branch against rivals.

## End goals

There is no single win condition. Headquarters tracks a set of commendations, and one playthrough can chase several.

- **Tame the zone:** clear the final dungeon and downgrade the region's danger rating.
- **Raise a legend:** take one adventurer from rank F to rank S alive.
- **Build a town:** grow the truck stop into a chartered town.
- **Top the rankings:** beat rival branches on the headquarters leaderboard.
- **Zero-death season:** a full season without losing anyone.
- **Promotion:** earn a regional director seat, which can start a new game in a harder zone.

## Tech constraints and build milestones

The game is plain HTML, CSS and JavaScript for now, built simulation-first so each milestone can be tested before any interface exists.

**Constraints**

- No framework and no build step. The game runs from static files in a browser.
- The simulation core is plain JavaScript with no access to the page, so it can run headless under Node for tests. The interface reads simulation state and sends player actions, and never changes state directly.
- All randomness comes from one seeded generator. Same seed plus same inputs gives the same outcome.
- Game content (classes, stats, items, quest templates, petitions) lives in data files.
- Saves are JSON in the browser's local storage, with a version number.
- First-person means fixed 2D desk scenes built from HTML and CSS, with placeholder art until an art direction is chosen.

**Milestones.** Each one ends with passing tests and something that can be run and checked.

1. **Simulation core, headless.** Seeded randomness, clock, adventurer generation, classes and stats, quest truth and posting, expedition resolution, death, incident reports. Proven by running 100 simulated days from a seed twice and getting identical logs.
2. **Desk, first playable.** Counter queue, quest request intake, posting form, quest board, time controls. One full working day is playable.
3. **Inspect, registration and rank-ups.** Tiered information, with blanks and ranges at low tiers.
4. **Gear, loot and appraisal.** Items, rarity, loot from quests, inspect on items.
5. **Petitions, rumor feed, reputation and funds.** The daily event layer and its consequences.
6. **City tutorial.** Station rotation with the mentor's checks, ending in the frontier offer.
7. **Frontier.** Zone map that fills in from reports, dungeon growth, guild facilities and the truck stop.
8. **Staff, policies and audits.** Hiring, standing rules, staff mistakes, the player's auditing tools.
9. **Commendations and balance.** End goals, rival branches, headquarters ranking, tuning.

## Open questions

These are not decided yet. Each has a working assumption so building is not blocked, and milestone 1 does not depend on any of them except quest pickup.

| Question | Working assumption until decided |
| --- | --- |
| Fixed 2D desk scenes, or real 3D look-around? | Fixed 2D scenes the player clicks between |
| Time model: variable speed, skip to next event, or both? | Both, and skipping does not freeze the simulation |
| Do adventurers pick quests, or does the player assign them? | They pick from the board, and the player can recommend or refuse at the counter |
| How does the player learn a quest's truth? | Inspect on the request, paid scouts, and returning parties' reports |
| Is the frontier zone hand-designed or generated from a seed? | Generated from a seed, using hand-written templates |
| Do staff's fatal mistakes count against the player's record? | Yes, at reduced weight |
| What makes the player lose or struggle? | Funds and headquarters' standing, and the branch can be closed |
| How big is the cast? | 20 to 40 fully simulated regulars, plus a lightweight wider world |
| Tone? | Light on the surface, with deaths that are treated seriously |
| Art direction and assets? | Placeholder shapes and text portraits for now |
