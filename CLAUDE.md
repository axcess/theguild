# The Guild: project rules

Read DESIGN.md before starting any work. It is the source of truth for game design.
Where it lists an open question, use the working assumption and note it in PROGRESS.md.

## Architecture rules, and why

- The simulation core is plain JavaScript and never touches the page, because tests
  run it headless under Node.
- All randomness goes through the single seeded generator, because any death must be
  replayable from a seed for auditing.
- Classes, stats, items and quest templates live in data files, because they will be
  rebalanced often.
- Plain HTML, CSS and JavaScript. No framework and no build step.

## Working rules

- Build only what the current milestone in TODO.md asks for. No extra features or
  abstractions for later.
- Do not remove or weaken a test to make it pass. If a test looks wrong, say so.
- Solutions must work for all valid inputs, not only the test cases.
- Start each session by reading PROGRESS.md, TODO.md and the recent git log, then run
  the tests.
- End each session by updating PROGRESS.md and TODO.md and committing.
- If DESIGN.md is unclear or contradicts itself, ask before building on it.

## Layout and commands

- `src/sim/`: the simulation core. ES modules, no page access, no dependencies.
- `src/data/`: game content as ES modules that export plain data.
- `src/ui/`: the page. It reads the desk view and changes the simulation only
  through `act` and `step`.
- `index.html`: the desk.
- `tests/`: tests for Node's built-in runner, named `*.test.js`.
- `tools/`: headless scripts, such as running a seed and printing its log.
- `prompts/`: the briefs used to start work sessions.
- `docs/`: reference documents, such as the event log schema.
- Run the tests with `npm test`. There are no dependencies to install.
- The page loads the same ES modules, so serve the folder (`python3 -m http.server`)
  instead of opening the file directly.
