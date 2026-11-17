import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SIM_DIR = new URL('../src/sim/', import.meta.url).pathname;
const DATA_DIR = new URL('../src/data/', import.meta.url).pathname;

function sources(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ file: f, text: stripComments(readFileSync(join(dir, f), 'utf8')) }));
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const FORBIDDEN = [
  [/Math\.random/, 'Math.random'],
  [/\bDate\b/, 'Date'],
  [/performance\.now/, 'performance.now'],
  [/\bwindow\b/, 'window'],
  [/\bdocument\b/, 'document'],
  [/localStorage|sessionStorage/, 'browser storage'],
  [/\bnavigator\b/, 'navigator'],
  [/\bprocess\b/, 'process'],
  [/from ['"]node:/, 'Node built-ins'],
];

test('the simulation core uses no unseeded randomness, clock time or page globals', () => {
  for (const { file, text } of [...sources(SIM_DIR), ...sources(DATA_DIR)]) {
    for (const [pattern, name] of FORBIDDEN) {
      assert.doesNotMatch(text, pattern, `${file} uses ${name}`);
    }
  }
});

test('the simulation core imports only from inside src/', () => {
  for (const { file, text } of sources(SIM_DIR)) {
    for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      assert.match(m[1], /^\.\/|^\.\.\/data\//, `${file} imports ${m[1]}`);
    }
  }
});
