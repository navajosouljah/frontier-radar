import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postsFrom, loginFrom, accountsFrom } from './x-scout.mjs';

const SAMPLE = { ok: true, data: [
  { id: '1', text: 'A real post https://t.co/x', author: { screenName: 'btibor91' }, createdAtISO: '2026-10-05T15:16:23+00:00',
    metrics: { likes: 309 }, urls: [{ expanded: 'https://openai.com/x' }], isRetweet: false, retweetedBy: null },
  { id: '2', text: 'Someone else said this', author: { screenName: 'axeldelafosse' }, createdAtISO: '2026-10-05T18:36:32+00:00',
    metrics: { likes: 192 }, urls: [], isRetweet: true, retweetedBy: 'btibor91' },
  { id: '3', text: 'Too old', author: { screenName: 'btibor91' }, createdAtISO: '2026-10-01T00:00:00+00:00', metrics: { likes: 1 }, urls: [], isRetweet: false },
] };

test('postsFrom normalises twitter-cli output and drops posts older than the window', () => {
  const posts = postsFrom(SAMPLE, 'btibor91', Date.parse('2026-10-04T12:00:00Z'));
  assert.equal(posts.length, 2);
  assert.deepEqual(posts[0], { id: '1', url: 'https://x.com/btibor91/status/1', time: '2026-10-05T15:16:23Z', text: 'A real post https://t.co/x', likes: 309, links: ['https://openai.com/x'], retweet_of: null });
  assert.equal(posts[1].retweet_of, 'axeldelafosse');
  assert.equal(posts[1].url, 'https://x.com/axeldelafosse/status/2');
});
test('postsFrom tolerates a failed or empty read', () => {
  assert.deepEqual(postsFrom({ ok: false }, 'x', 0), []);
  assert.deepEqual(postsFrom(null, 'x', 0), []);
});
test('loginFrom reads the two flat keys and nothing else', () => {
  const cfg = 'other: 1\ntwitter_auth_token: "abc"\ntwitter_ct0: def\n';
  assert.deepEqual(loginFrom(cfg), { TWITTER_AUTH_TOKEN: 'abc', TWITTER_CT0: 'def' });
  assert.equal(loginFrom('nothing: here'), null);
});
test('accountsFrom flattens the x groups with their tier', () => {
  const acc = accountsFrom({ x: { _about: 'x', rumor: ['a'], leaks: ['b'], insiders: ['c', 'd'] } });
  assert.deepEqual(acc, [{ handle: 'a', tier: 'rumor' }, { handle: 'b', tier: 'leaks' }, { handle: 'c', tier: 'insiders' }, { handle: 'd', tier: 'insiders' }]);
});
