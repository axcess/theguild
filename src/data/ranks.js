// Guild ranks, lowest first. A rank is referred to by its index in this list.
// `minLevel` is the true level that the rank stands for, used when a clerk turns a
// level into a rank and when a quest's true danger is turned into a needed level.
export const RANKS = [
  { id: 'F', minLevel: 1 },
  { id: 'E', minLevel: 5 },
  { id: 'D', minLevel: 10 },
  { id: 'C', minLevel: 15 },
  { id: 'B', minLevel: 20 },
  { id: 'A', minLevel: 25 },
  { id: 'S', minLevel: 30 },
];
