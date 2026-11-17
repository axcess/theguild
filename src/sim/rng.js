// The single seeded generator (mulberry32). Its whole state is one unsigned 32-bit
// integer kept in `holder.rng`, so it survives a JSON round trip with the rest of
// the simulation state.

export function seedFrom(seed) {
  // FNV-1a over the seed's text, so numbers and strings both work.
  const text = String(seed);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

export function random(holder) {
  holder.rng = (holder.rng + 0x6d2b79f5) >>> 0;
  let t = holder.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randInt(holder, min, max) {
  return min + Math.floor(random(holder) * (max - min + 1));
}

export function randRange(holder, min, max) {
  return min + random(holder) * (max - min);
}

export function chance(holder, p) {
  return random(holder) < p;
}

export function pick(holder, list) {
  return list[Math.floor(random(holder) * list.length)];
}

// Picks from `list` with weights from `weightOf(item)`.
export function weightedPick(holder, list, weightOf) {
  let total = 0;
  for (const item of list) total += weightOf(item);
  let r = random(holder) * total;
  for (const item of list) {
    r -= weightOf(item);
    if (r < 0) return item;
  }
  return list[list.length - 1];
}
