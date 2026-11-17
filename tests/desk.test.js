import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newRun, runDays, runTicks } from '../tools/runner.js';
import { clerkActions } from '../tools/clerk.js';
import { buildDeskView, skipToNextEvent, createState, step, counterOpen } from '../src/sim/index.js';

// Keys that hold hidden facts. `level` and `cls` are allowed only where they are
// what someone claimed, what the clerk wrote, or what was posted.
const HIDDEN = ['truth', 'stats', 'traits', 'archetype', 'xp', 'needs', 'history', 'encounters', 'durationTicks', 'pay', 'trueCls', 'friends'];
const SAFE_PARENTS = { level: ['claim', 'posting'], cls: ['claim', 'record', 'ledger'] };

function walk(value, parent, path, visit) {
  if (Array.isArray(value)) value.forEach((v) => walk(v, parent, path, visit));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      visit(k, parent, path);
      walk(v, k, `${path}.${k}`, visit);
    }
  }
}

test('the desk view never holds a quest truth or anyone\'s hidden identity', () => {
  const run = newRun(6, 0.3);
  let seen = 0;
  for (let i = 0; i < 60; i++) {
    runTicks(run, 7 + (i % 5));
    const { reports, ...view } = buildDeskView(run.sim); // reports are after-the-fact findings, shown by design
    walk(view, 'view', 'view', (key, parent, path) => {
      assert.ok(!HIDDEN.includes(key), `desk view holds "${key}" at ${path}`);
      if (SAFE_PARENTS[key]) {
        const ok = SAFE_PARENTS[key].includes(parent) || (parent === 'ledger' && key === 'cls');
        assert.ok(ok || path.startsWith('view.ledger'), `"${key}" under "${parent}" at ${path}`);
      }
    });
    seen += view.queue.length + view.requests.length + view.board.length;
  }
  assert.ok(seen > 100);
});

test('a client never overstates: rank, hazards and offer stay within the truth', () => {
  const { log } = runDays(newRun(2, 0.2), 100);
  const requests = log.filter((e) => e.type === 'request');
  assert.ok(requests.length > 200);
  let understated = 0;
  for (const r of requests) {
    assert.ok(r.account.rank <= r.truth.rank);
    for (const h of r.account.hazards) assert.ok(r.truth.hazards.includes(h));
    assert.ok(r.account.offer <= r.truth.pay);
    if (r.account.rank < r.truth.rank || r.account.hazards.length < r.truth.hazards.length) understated++;
  }
  assert.ok(understated > requests.length * 0.3, 'clients should often undersell');
});

function runWithPickups(seed, decide) {
  const run = newRun(seed, 0);
  while (run.sim.tick < 30 * 24) {
    const actions = clerkActions(run.clerk, run.sim).map((a) => (a.type === 'approve' ? decide(a) : a)).filter(Boolean);
    step(run.sim, actions);
  }
  return run.sim;
}

test('a ready party waits at the counter until approved, and a refused one never sets out', () => {
  const waiting = runWithPickups(1, () => null);
  assert.ok(!waiting.log.some((e) => e.type === 'depart'), 'nobody may leave without approval');
  assert.ok(waiting.parties.some((p) => p.status === 'awaiting'));

  const refused = runWithPickups(1, (a) => ({ type: 'refuse', party: a.party }));
  assert.ok(!refused.log.some((e) => e.type === 'depart'));
  const disbands = refused.log.filter((e) => e.type === 'party_disband' && e.reason === 'refused');
  assert.ok(disbands.length > 0);
});

test('padding a posting with spare places no longer cuts deaths sharply', () => {
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const plain = seeds.map((s) => runDays(newRun(s, 0), 100).sim.fallen.length);
  const padded = seeds.map((s) => {
    const run = newRun(s, 0);
    while (run.sim.tick < 100 * 24) {
      const actions = clerkActions(run.clerk, run.sim).map((a) =>
        a.type === 'post' ? { ...a, posting: { ...a.posting, slots: [...a.posting.slots, [], []] } } : a,
      );
      step(run.sim, actions);
    }
    return run.sim.fallen.length;
  });
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  // Before the fix, two spare places cut deaths by about 70%.
  assert.ok(sum(padded) >= 0.6 * sum(plain), `plain ${sum(plain)}, padded ${sum(padded)}`);
});

test('"next event" stops when someone new reaches the counter or a request arrives', () => {
  const state = createState(4);
  for (let day = 0; day < 6; day++) {
    const before = buildDeskView(state);
    const ticks = skipToNextEvent(state, 48);
    const after = buildDeskView(state);
    assert.ok(ticks >= 1 && ticks < 48, `day ${day}: skipped ${ticks} ticks`);
    assert.ok(counterOpen(state.tick));
    const newQueue = after.queue.some((q) => !before.queue.some((b) => b.kind === q.kind && (b.adv ?? b.party) === (q.adv ?? q.party)));
    const newRequest = after.requests.some((r) => !before.requests.some((b) => b.quest === r.quest));
    assert.ok(newQueue || newRequest || after.reports.length > before.reports.length);
    // Clear the counter as a player would, so the next skip looks for something new.
    const actions = after.queue.filter((q) => q.kind === 'newcomer').map((q) => ({ type: 'register', adv: q.adv, cls: q.claim.cls, rank: 0, by: 'player' }));
    step(state, actions);
  }
});

test('board actions: pull a posting, reprice one', () => {
  const run = runTicks(newRun(3, 0), 7);
  const onBoard = () => run.sim.quests.filter((q) => q.status === 'posted');
  while (!(onBoard().length >= 2 && counterOpen(run.sim.tick))) runTicks(run, 1);
  const posted = onBoard();
  step(run.sim, [
    { type: 'pull', quest: posted[0].id, by: 'player' },
    { type: 'reprice', quest: posted[1].id, reward: 77, by: 'player' },
  ]);
  assert.equal(posted[0].status, 'pulled');
  assert.equal(posted[1].posting.reward, 77);
  assert.ok(!buildDeskView(run.sim).board.some((b) => b.quest === posted[0].id));
});
