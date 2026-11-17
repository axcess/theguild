# The Guild

A single-player management sim where you run an adventurers' guild branch from behind
the counter. You never fight. Your paperwork decides who comes home.

- [DESIGN.md](DESIGN.md): the game design, and the source of truth.
- [VISION.md](VISION.md): the finished game, to plan backwards from.
- [STYLE.md](STYLE.md): look and voice, and what to avoid.
- [AUDIT.md](AUDIT.md): the milestone 1 audit, which sets milestone 2.
- [TODO.md](TODO.md): the current milestone and what it needs.
- [PROGRESS.md](PROGRESS.md): what is built, and the decisions made along the way.
- [CLAUDE.md](CLAUDE.md): the project rules for work sessions.

Plain HTML, CSS and JavaScript with no build step and no dependencies.

```bash
npm test
```

Play at the desk: serve the folder and open it in a browser.

```bash
python3 -m http.server 8000
```

Then go to http://localhost:8000.

Run a seed and read its incident reports, or replay and verify a save:

```bash
node tools/run.js --seed 1 --error 0.2
```

```bash
node tools/replay.js --seed 1 --days 40 --report 3
```
