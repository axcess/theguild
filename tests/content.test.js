import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Stock names and phrases that make content read as generated. Kept in step with
// the "Avoid" list in STYLE.md.
const AVOID = [
  'Elara', 'Elias', 'Thorne', 'Kael', 'Lyra', 'Seraphina', 'Aria', 'Zephyr', 'Mara', 'Voss',
  'Nyx', 'Aldric', 'Elric', 'Ember', 'Wren', 'Ashdown', 'Ironside', 'Shadowmere', 'Stormwind',
  'whispering', 'shadow', 'ancient evil', 'forsaken', 'mystical', 'ethereal', 'tapestry',
  'realm', 'destiny', 'chosen one',
];

const DATA_DIR = new URL('../src/data/', import.meta.url).pathname;

test('game content avoids stock generated names and phrases', () => {
  for (const file of readdirSync(DATA_DIR).filter((f) => f.endsWith('.js'))) {
    const text = readFileSync(join(DATA_DIR, file), 'utf8');
    for (const word of AVOID) {
      assert.doesNotMatch(text, new RegExp(`\\b${word}\\b`, 'i'), `${file} contains "${word}"`);
    }
  }
});

test('the avoid list in STYLE.md and this test agree', () => {
  const style = readFileSync(new URL('../STYLE.md', import.meta.url), 'utf8');
  for (const word of AVOID) assert.ok(style.includes(word), `STYLE.md is missing "${word}"`);
});
