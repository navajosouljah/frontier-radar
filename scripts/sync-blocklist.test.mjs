import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeBlocklist } from './sync-blocklist.mjs';

const a = { repo: 'a/b', date: '2026-09-01', kind: 'open-advisories', reason: 'x' };
const b = { repo: 'c/d', date: '2026-09-02', kind: 'open-advisories', reason: 'y' };
test('grow-only (the cloud run) keeps every old entry and adds the new ones', () => {
  const out = mergeBlocklist([a, b], [{ ...a, reason: 'updated' }, { repo: 'e/f', reason: 'z' }], { replace: false });
  assert.deepEqual(out.map(r => r.repo), ['a/b', 'c/d', 'e/f']);
  assert.equal(out[0].reason, 'updated', 'the fetched copy of a kept entry wins');
});
test('replace (the Mac scout) takes the fetched list as is', () => {
  assert.deepEqual(mergeBlocklist([a, b], [b], { replace: true }).map(r => r.repo), ['c/d']);
});
test('a first copy is the fetched list', () => {
  assert.deepEqual(mergeBlocklist(null, [a], { replace: false }), [a]);
});
