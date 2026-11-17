# Brief: continue the current milestone, or start the next one

Read CLAUDE.md, DESIGN.md, TODO.md and PROGRESS.md, look at the recent git log, and
run `npm test` before changing anything. If the tests fail at the start, fix that
first and say what was wrong.

**If the current milestone in TODO.md has unticked items,** carry on with them.

**If every item is ticked,** start the next milestone from DESIGN.md:

1. Write its checklist into TODO.md in the same shape as the previous one: what
   "done" means, what to build, what to test, and what is out of scope.
2. List in PROGRESS.md any open question from DESIGN.md that this milestone depends
   on, with the working assumption you are using.
3. Then build it.

Earlier milestones must keep working. The simulation core stays headless and
deterministic, and the 100-day replay test must keep passing. The interface reads
simulation state and sends player actions, and never changes state directly.

For any milestone with a page, check it in a real browser before calling it done:
serve the folder, play through what the milestone promises, and look at the result.
Passing tests alone do not show that a screen is usable.

Where the design leaves something undecided, pick the simplest option that fits the
design pillars, record it in PROGRESS.md, and carry on. Stop and ask only if
DESIGN.md contradicts itself or the choice would be expensive to undo.

When you finish, update TODO.md and PROGRESS.md, commit and push, and report what is
built, the test output, how you checked it, every assumption you added, and anything
unfinished or unverified.
