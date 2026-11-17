// The desk view: everything the page may show, and nothing it may not. It is
// built from guild knowledge only: what people claimed, what the clerk wrote,
// what clients said, what came back. A quest's truth and an adventurer's true
// identity never go in. Incident reports are the exception by design: they are
// what the guild learns after the fact.

import { dayOf, hourOf, phaseOf, counterOpen } from './clock.js';
import { step } from './sim.js';

// Which fields of each log event the ledger may show. Anything not listed (the
// truth on a request, the encounter rolls of an expedition) stays out.
const LEDGER_FIELDS = {
  arrive: ['adv'],
  register: ['adv', 'cls', 'rank'],
  request: ['quest', 'title', 'client'],
  post: ['quest'],
  reject: ['quest'],
  pull: ['quest'],
  reprice: ['quest', 'reward'],
  party_formed: ['party', 'quest', 'leader'],
  party_join: ['party', 'quest', 'adv'],
  party_disband: ['party', 'quest', 'leader', 'reason'],
  pickup_requested: ['party', 'quest', 'leader'],
  pickup_approved: ['party', 'quest'],
  pickup_refused: ['party', 'quest'],
  depart: ['party', 'quest'],
  return: ['party', 'quest', 'outcome', 'survivors', 'dead', 'payEach'],
  injured: ['adv', 'quest'],
  death: ['victim', 'quest'],
  leave: ['adv'],
  level_up: ['adv'],
  posting_expired: ['quest'],
  request_lapsed: ['quest'],
  incident_report: ['report', 'kind', 'quest'],
};

function tellsOf(adv) {
  return adv.needs.injury > 0 ? ['injured'] : [];
}

export function buildDeskView(state) {
  const names = {};
  for (const a of state.adventurers) names[a.id] = a.name;
  for (const a of state.fallen) names[a.id] = a.name;
  for (const a of state.departed) names[a.id] = a.name;
  const titles = {};
  for (const q of state.quests) titles[q.id] = q.title;
  for (const e of state.log) if (e.title && e.quest !== undefined) titles[e.quest] = e.title;

  const person = (a) => ({
    id: a.id,
    name: a.name,
    record: a.record ? { ...a.record } : null,
    tells: tellsOf(a),
  });

  const queue = [];
  for (const a of state.adventurers) {
    if (a.status !== 'unregistered') continue;
    queue.push({ kind: 'newcomer', since: a.arrivedAt, adv: a.id, name: a.name, claim: { ...a.claim }, tells: tellsOf(a) });
  }
  for (const p of state.parties) {
    if (p.status !== 'awaiting') continue;
    const q = state.quests.find((x) => x.id === p.quest);
    const members = p.slots.filter((s) => s.member !== null).map((s) => ({
      ...person(state.adventurers.find((a) => a.id === s.member)),
      place: [...s.classes],
      leader: s.member === p.leader,
    }));
    queue.push({
      kind: 'pickup',
      since: p.readyAt,
      party: p.id,
      quest: p.quest,
      title: q.title,
      posting: structuredClone(q.posting),
      short: p.short,
      members,
    });
  }
  queue.sort((a, b) => a.since - b.since || (a.kind === b.kind ? (a.adv ?? a.party) - (b.adv ?? b.party) : a.kind === 'newcomer' ? -1 : 1));

  const partyOf = (q) => state.parties.find((p) => p.id === q.party);
  const board = state.quests
    .filter((q) => q.status === 'posted' || q.status === 'taken')
    .map((q) => {
      const p = q.status === 'taken' ? partyOf(q) : null;
      return {
        quest: q.id,
        title: q.title,
        client: q.client,
        posting: structuredClone(q.posting),
        postedAt: q.postedAt,
        state: p ? p.status : 'posted', // posted, forming, awaiting
        filled: p ? p.slots.filter((s) => s.member !== null).length : 0,
      };
    });

  const dayStart = state.tick - hourOf(state.tick);
  const ledger = [];
  for (const e of state.log) {
    if (e.t < dayStart || !LEDGER_FIELDS[e.type]) continue;
    const entry = { i: e.i, t: e.t, type: e.type };
    for (const f of LEDGER_FIELDS[e.type]) if (e[f] !== undefined) entry[f] = structuredClone(e[f]);
    ledger.push(entry);
  }

  return {
    tick: state.tick,
    day: dayOf(state.tick) + 1,
    hour: hourOf(state.tick),
    phase: phaseOf(state.tick),
    counterOpen: counterOpen(state.tick),
    names,
    titles,
    queue,
    requests: state.quests
      .filter((q) => q.status === 'requested')
      .map((q) => ({ quest: q.id, title: q.title, client: q.client, account: structuredClone(q.account), requestedAt: q.requestedAt })),
    board,
    out: state.parties
      .filter((p) => p.status === 'away')
      .map((p) => ({ party: p.id, quest: p.quest, title: titles[p.quest], members: [...p.members], departedAt: state.log.find((e) => e.i === p.departLog)?.t ?? null })),
    reports: structuredClone(state.reports),
    ledger,
    cast: state.adventurers.filter((a) => a.record).length,
    fallen: state.fallen.length,
  };
}

// What the player would want to stop for: someone at the counter, a new request,
// a new incident report.
function attention(state) {
  const v = buildDeskView(state);
  return {
    queue: v.queue.map((q) => `${q.kind}:${q.adv ?? q.party}`),
    requests: v.requests.map((r) => r.quest),
    reports: v.reports.length,
  };
}

// Lets time pass, without any clerk action, until something new needs the
// player while the counter is open, or `maxTicks` pass. The world keeps moving
// the whole time. Returns the number of ticks that passed.
export function skipToNextEvent(state, maxTicks = 48) {
  const before = attention(state);
  for (let n = 1; n <= maxTicks; n++) {
    step(state, []);
    if (!counterOpen(state.tick)) continue;
    const now = attention(state);
    const fresh =
      now.queue.some((k) => !before.queue.includes(k)) ||
      now.requests.some((r) => !before.requests.includes(r)) ||
      now.reports > before.reports;
    if (fresh) return n;
  }
  return maxTicks;
}
