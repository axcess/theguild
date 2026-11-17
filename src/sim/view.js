// What decisions may see. The decision view is built from postings and guild
// records only; a quest's truth never goes in. The self view is a copy of what an
// adventurer knows about themselves. Both are copies, so a decision cannot reach
// back into the state.

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
    // Who is free right now, by the guild's records.
    roster: state.adventurers
      .filter((a) => a.status === 'idle' && a.record)
      .map((a) => ({ id: a.id, recordCls: a.record.cls })),
  };
}

export function buildSelfView(adv) {
  return {
    id: adv.id,
    level: adv.level,
    traits: [...adv.traits],
    archetype: adv.archetype,
    status: adv.status,
    needs: { ...adv.needs },
    record: adv.record ? { ...adv.record } : null,
    friends: [...adv.friends],
    shunned: adv.shunned.map((s) => ({ ...s })),
  };
}
