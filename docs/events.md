# Event log schema

Every event has:

- `i`: its number. Numbers start at 0, never repeat, and survive log trimming.
- `t`: the tick it happened on.
- `type`: one of the types below.

The live state keeps only recent events (`state.log`, starting at
`state.logBase`). Anything older can be rebuilt by replaying the save's journal
(`tools/replay.js`). Incident reports point at events by number.

The "Fields" line under each type is checked by `tests/events.test.js`: every
field an event carries must be listed here, and every event type the core can log
must have a section.

Ids: `adv` is an adventurer, `quest` a quest, `party` a party. Ranks are indexes
into `src/data/ranks.js` (0 is F).

## People

### `arrive`
A newcomer reaches town, unregistered.
Fields: adv, name, claim

`claim` is what they will tell the clerk: `{ cls, level }`. It can be a lie.

### `register`
The clerk records a newcomer.
Fields: by, adv, cls, rank, claim

`cls` and `rank` are what was written down. `by` is who wrote it.

### `rest`
An adventurer stops to rest off fatigue or injury.
Fields: adv

### `level_up`
Fields: adv, level

### `injured`
An adventurer comes back hurt. `injury` is their new injury level, from 1 to 3.
Fields: adv, party, quest, injury

### `grief`
A friend or party member of someone who died loses morale.
Fields: adv, for, morale

`for` is the adventurer who died.

### `leave`
An adventurer leaves town for good.
Fields: adv, reason

`reason` is one of `broke`, `lost heart`, `moved on` or `never registered`.

### `death`
Fields: victim, name, party, quest

## Quests

### `request`
A client brings a request. `truth` is the hidden truth and must never reach the
desk or the decision code.
Fields: quest, title, client, truth

### `post`
The clerk posts a request.
Fields: by, quest, posting

`posting` holds `rank`, `level`, `reward`, `hazards`, `slots` (one list of
recommended classes per place, empty for any class) and `description`.

### `reject`
Fields: by, quest

### `request_lapsed`
A request was neither posted nor rejected in time.
Fields: quest

### `posting_expired`
Nobody took a posting in time.
Fields: quest

## Parties and expeditions

### `party_formed`
An adventurer takes a posting and starts a party.
Fields: party, quest, leader, slot, reachedUp, stopgap

`reachedUp` means the posting was one rank above the adventurer's record.
`stopgap` means they took a place recommended for another class, because they can
fill its job passably and nobody of that class was free.

### `party_join`
Fields: party, quest, adv, slot, reachedUp, stopgap

### `party_disband`
The party gave up waiting. The posting goes back on the board, and its members
won't retake it for a while.
Fields: party, quest, leader

### `depart_short`
The leader sets out without every place filled.
Fields: party, leader, filled, size

### `depart`
The party sets out. This event is the reference point for incident reports. It
snapshots the posting, the truth, and each member's true and recorded identity.
Fields: party, quest, title, leader, short, posting, truth, missingJobs, members

Each member holds `id`, `name`, `trueCls`, `level`, `injury`, `recordCls`,
`recordRank`, `claimCls`, `claimLevel`, `traits`, `archetype`, `job`, `fit` and
`reachedUp`.

### `encounter`
One fight on the expedition. `ratio` is the party's power against the threat;
`roll` is that ratio after chance, and a roll under 1 hurts.
Fields: party, quest, n, power, threat, ratio, roll, severity, hazards, missingJobs, hits

`severity` is `clean`, `hard` or `failed`. Each hazard entry holds `hazard`,
`countered` (someone was assigned to the counter job), `helped` (someone else in
the party fits it) and `posted`. Each hit holds `adv`, `dmg` and the `hp` left.

### `downed`
A member was brought to zero. A healer may save them.
Fields: party, quest, n, adv, healer, saveChance, roll, died

### `press_on`
The leader carried on although the party was below the health at which a
level-headed leader turns back.
Fields: party, quest, n, leader, hpFrac, threshold, neutral

### `retreat`
Fields: party, quest, n, forced, leader, hpFrac

`forced` means an encounter was lost. Otherwise the leader chose to turn back,
and `hpFrac` is the party's health at the time.

### `return`
Fields: party, quest, outcome, cleared, encounters, survivors, dead, payEach, xpEach

`outcome` is `success`, `partial`, `retreat` or `wiped`.

### `incident_report`
A report was written. The report itself is in `state.reports`.
Fields: report, kind, quest, subject

`kind` is `death` or `failed_quest`.
