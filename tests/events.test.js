import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newRun, runDays } from '../tools/runner.js';

const doc = readFileSync(new URL('../docs/events.md', import.meta.url), 'utf8');

function documented() {
  const types = {};
  const sections = doc.split(/^### /m).slice(1);
  for (const section of sections) {
    const type = section.match(/^`([a-z_]+)`/)[1];
    const fields = section.match(/^Fields: (.*)$/m);
    types[type] = fields ? fields[1].split(',').map((f) => f.trim()) : [];
  }
  return types;
}

test('every event type the core can log is documented', () => {
  const types = documented();
  const simDir = new URL('../src/sim/', import.meta.url).pathname;
  for (const file of readdirSync(simDir).filter((f) => f.endsWith('.js'))) {
    const text = readFileSync(join(simDir, file), 'utf8');
    for (const m of text.matchAll(/logEvent\(state, '([a-z_]+)'/g)) {
      assert.ok(types[m[1]], `${file} logs "${m[1]}", which docs/events.md does not describe`);
    }
  }
});

test('every field on every logged event is documented', () => {
  const types = documented();
  for (const seed of [1, 2]) {
    for (const e of runDays(newRun(seed, 0.3), 100).log) {
      assert.ok(types[e.type], `undocumented event type ${e.type}`);
      for (const key of Object.keys(e)) {
        if (key === 'i' || key === 't' || key === 'type') continue;
        assert.ok(types[e.type].includes(key), `${e.type}.${key} is not in docs/events.md`);
      }
    }
  }
});
