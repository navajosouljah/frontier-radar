import { test } from 'node:test';
import assert from 'node:assert/strict';
import { item } from './test-site.mjs';
import { mergeStories, independentCount, score, dayNow, rankDay } from './rank.mjs';

const src = (url, kind = 'press', extra = {}) => ({ url, outlet: 'x', kind, ...extra });

test('mergeStories joins items with the same story key', () => {
  const a = item({ id: 'a', story: 's', published: '2026-10-07T09:00:00Z', rumor: true, sources: [src('https://techcrunch.com/1')] });
  const b = item({ id: 'b', story: 's', published: '2026-10-07T07:00:00Z', rumor: false,
    sources: [src('https://techcrunch.com/1'), src('https://www.anthropic.com/news/1', 'official')] });
  const out = mergeStories([a, b]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, 'a');
  assert.equal(out[0].sources.length, 2);
  assert.equal(out[0].published, '2026-10-07T07:00:00Z');
  assert.equal(out[0].rumor, false, 'official confirmation removes the rumor tag');
});
test('independentCount ignores repeats and counts hosts once', () => {
  const it = item({ sources: [src('https://techcrunch.com/1'), src('https://techcrunch.com/2'),
    src('https://theverge.com/1'), src('https://copycat.com/1', 'press', { repeats: 'https://theverge.com/1' })] });
  assert.equal(independentCount(it), 2);
});
test('score favours sources, official and freshness', () => {
  const now = dayNow('2026-10-07');
  const one = item({ sources: [src('https://a.com/1')], published: '2026-10-07T11:00:00Z' });
  const two = item({ sources: [src('https://a.com/1'), src('https://b.com/1')], published: '2026-10-07T11:00:00Z' });
  const off = item({ sources: [src('https://a.com/1', 'official')], published: '2026-10-07T11:00:00Z' });
  const old = item({ sources: [src('https://a.com/1')], published: '2026-10-05T11:00:00Z' });
  assert.ok(score(two, now) > score(one, now));
  assert.ok(score(off, now) > score(one, now));
  assert.ok(score(one, now) > score(old, now));
});
test('rankDay uses the chosen top, keeps it out of trending, caps at 10', () => {
  const items = Array.from({ length: 13 }, (_, i) => item({ id: `i${i}`, story: `s${i}` }));
  const r = rankDay({ date: '2026-10-07', top: 'i5', items });
  assert.equal(r.top.id, 'i5');
  assert.equal(r.trending.length, 10);
  assert.ok(!r.trending.some(x => x.id === 'i5'));
});
test('rankDay never picks a rumor as top', () => {
  const r = rankDay({ date: '2026-10-07', top: 'r', items: [item({ id: 'r', story: 'r', rumor: true }), item({ id: 'c', story: 'c' })] });
  assert.equal(r.top.id, 'c');
  const all = rankDay({ date: '2026-10-07', items: [item({ id: 'r', story: 'r', rumor: true })] });
  assert.equal(all.top, null);
  assert.equal(all.trending.length, 1);
});
