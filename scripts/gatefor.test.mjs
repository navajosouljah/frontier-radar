import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeGateFor, blockedRepos, repoOf, codeHost } from './gatefor.mjs';

const NOW = Date.parse('2026-10-07T12:00:00Z');
const pass = (repo, checked = '2026-10-01') => ({ repo, checked, verdict: 'PASS',
  checks: { advisories: { source: 'github-api', url: `https://github.com/${repo}/security/advisories`, count: 0 } } });

test('a fresh PASS with evidence clears', () => {
  const g = makeGateFor({ 'a/b': pass('a/b') }, [[], []], NOW);
  assert.deepEqual(g('A/B'), { ok: true });
});
test('blocklisted, never gated, FAIL, no evidence, stale', () => {
  const log = {
    'a/fail': { ...pass('a/fail'), verdict: 'FAIL' },
    'a/bare': { repo: 'a/bare', checked: '2026-10-01', verdict: 'PASS', checks: {} },
    'a/old': pass('a/old', '2026-08-01'),
    'a/blocked': pass('a/blocked'),
  };
  const g = makeGateFor(log, [[], [{ repo: 'A/Blocked', reason: 'open advisories' }]], NOW);
  assert.match(g('a/blocked').why, /blocklist/);
  assert.match(g('a/none').why, /never gated/);
  assert.match(g('a/fail').why, /FAIL/);
  assert.match(g('a/bare').why, /evidence/);
  assert.match(g('a/old').why, /days old/);
});
test('allowStale keeps an old PASS for archived lists but never a FAIL, a blocklisting or a missing gate', () => {
  const log = { 'a/old': pass('a/old', '2026-08-01'), 'a/fail': { ...pass('a/fail'), verdict: 'FAIL' } };
  const g = makeGateFor(log, [[{ repo: 'a/blocked', reason: 'malware' }], []], NOW, { allowStale: true });
  assert.deepEqual(g('a/old'), { ok: true });
  assert.match(g('a/fail').why, /FAIL/);
  assert.match(g('a/blocked').why, /blocklist/);
  assert.match(g('a/none').why, /never gated/);
});
test('blockedRepos, repoOf and codeHost', () => {
  assert.ok(blockedRepos([[{ repo: 'X/Y' }], []]).has('x/y'));
  assert.equal(repoOf({ url: 'https://github.com/owner/name' }), 'owner/name');
  assert.equal(repoOf({ url: 'https://github.com/owner/name/tree/main' }), 'owner/name');
  assert.equal(repoOf({ url: 'https://app.example.com', repo: 'o/r' }), 'o/r');
  assert.equal(repoOf({ url: 'https://app.example.com' }), null);
  assert.equal(codeHost('https://gitlab.com/o/r'), 'gitlab.com');
  assert.equal(codeHost('https://www.npmjs.com/package/x'), 'npmjs.com');
  assert.equal(codeHost('https://huggingface.co/o/m'), 'huggingface.co');
  assert.equal(codeHost('https://github.com/o/r'), 'github.com');
  assert.equal(codeHost('https://app.example.com'), null);
});
