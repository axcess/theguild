// The decision view: everything an adventurer may look at when choosing what to do.
// It is built from postings and guild records only. A quest's truth never goes in.

export function buildDecisionView(state) {
  const postingOf = new Map(state.quests.map((q) => [q.id, q.posting]));
  return {
    tick: state.tick,
    board: state.quests
      .filter((q) => q.status === 'posted')
      .map((q) => ({ quest: q.id, title: q.title, posting: structuredClone(q.posting) })),
    forming: state.parties
      .filter((p) => p.status === 'forming')
      .map((p) => ({
        party: p.id,
        quest: p.quest,
        leader: p.leader,
        posting: structuredClone(postingOf.get(p.quest)),
        slots: p.slots.map((s) => ({ classes: [...s.classes], member: s.member })),
      })),
  };
}
