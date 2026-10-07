import { test } from 'node:test';
import assert from 'node:assert/strict';
import { item, project, goodSite, SOURCES } from './test-site.mjs';
import { itemProblems, dayProblems, quoteProblems, projectProblems, trustFrom, confirmedBy } from './checks.mjs';

const IDS = ['claude', 'grok', 'gemini', 'chatgpt', 'jev'];
const has = (list, re) => list.some(p => re.test(p));
const TRUST = trustFrom(SOURCES);
const src = (url, kind) => ({ url, outlet: 'x', kind });

test('a good item has no problems', () => assert.deepEqual(itemProblems(item(), IDS, '2026-10-07'), []));
test('item rules', () => {
  assert.ok(has(itemProblems(item({ ai: 'llama' }), IDS, '2026-10-07'), /unknown ai/));
  assert.ok(has(itemProblems(item({ category: 'other' }), IDS, '2026-10-07'), /category/));
  assert.ok(has(itemProblems(item({ sources: [] }), IDS, '2026-10-07'), /at least one source/));
  assert.ok(has(itemProblems(item({ sources: [{ url: 'http://a.com', outlet: 'A', kind: 'press' }] }), IDS, '2026-10-07'), /https/));
  assert.ok(has(itemProblems(item({ headline: 'A — B' }), IDS, '2026-10-07'), /dash/));
  assert.ok(has(itemProblems(item({ published: '2026-10-08T01:00:00Z' }), IDS, '2026-10-07'), /after the day/));
});
test('an unconfirmed item must be a rumor', () => {
  const one = item({ sources: [{ url: 'https://blog.example.com/x', outlet: 'Blog', kind: 'community' }] });
  assert.ok(has(itemProblems(one, IDS, '2026-10-07'), /mark it rumor true/));
  assert.deepEqual(itemProblems({ ...one, rumor: true }, IDS, '2026-10-07'), []);
});
test('trust comes from the source list, not from the kind a run writes (review fix 5)', () => {
  assert.ok(confirmedBy(item(), TRUST), 'anthropic.com is on the official list');
  assert.ok(confirmedBy(item({ sources: [src('https://support.claude.com/en/articles/1', 'official')] }), TRUST), 'a subdomain of an official site is official');
  assert.ok(confirmedBy(item({ sources: [src('https://x.com/AnthropicAI/status/1', 'official')] }), TRUST), 'a company insider on X is official');
  assert.ok(confirmedBy(item({ sources: [src('https://techcrunch.com/a', 'press'), src('https://www.theverge.com/b', 'press')] }), TRUST), 'two press outlets confirm');
  assert.ok(confirmedBy(item({ sources: [src('https://techcrunch.com/a', 'press'), src('https://simonwillison.net/b', 'expert')] }), TRUST), 'press plus a named expert outlet confirms');
  assert.ok(!confirmedBy(item({ sources: [src('https://www.testingcatalog.com/a', 'community'), src('https://x.com/apples_jimmy/status/1', 'community')] }), TRUST), 'a leak tracker plus a rumor account is still a rumor');
  assert.ok(!confirmedBy(item({ sources: [src('https://www.testingcatalog.com/a', 'press'), src('https://9to5google.com/b', 'press')] }), TRUST), 'a leak host labelled press still does not count');
  assert.ok(!confirmedBy(item({ sources: [src('https://techcrunch.com/a', 'press'), src('https://techcrunch.com/b', 'press')] }), TRUST), 'one outlet twice is one outlet');
  assert.ok(!confirmedBy(item({ sources: [src('https://techcrunch.com/a', 'press'), src('https://copy.example.com/b', 'press'), src('https://x.com/someone/status/1', 'press')] }), TRUST), 'an unlisted blog and an X post do not confirm');
  assert.ok(!confirmedBy(item({ sources: [src('https://blog.example.com/x', 'official')] }), TRUST), 'calling a random blog official changes nothing');
  const bad = itemProblems(item({ sources: [src('https://blog.example.com/x', 'official')] }), IDS, '2026-10-07', TRUST);
  assert.ok(has(bad, /not on the official source list/), bad.join('\n'));
  assert.ok(has(itemProblems(item({ sources: [src('https://www.testingcatalog.com/a', 'press')], rumor: true }), IDS, '2026-10-07', TRUST), /leak tracker.*community/));
  assert.ok(has(itemProblems(item({ sources: [src('https://x.com/apples_jimmy/status/1', 'press')], rumor: true }), IDS, '2026-10-07', TRUST), /rumor account.*community/));
  assert.deepEqual(itemProblems(item({ sources: [src('https://techcrunch.com/a', 'press')], rumor: true }), IDS, '2026-10-07', TRUST), [], 'a lone press report marked rumor is fine');
  const day = goodSite()['data/days/2026-10-07/items.json'];
  assert.deepEqual(dayProblems(day, IDS, TRUST), []);
});
test('day rules: top must exist, not be a rumor, and say why', () => {
  const day = goodSite()['data/days/2026-10-07/items.json'];
  assert.deepEqual(dayProblems(day, IDS), []);
  assert.ok(has(dayProblems({ ...day, top: 'nope' }, IDS), /not one of the items/));
  const rumorTop = { ...day, items: [{ ...day.items[0], rumor: true }, day.items[1]] };
  assert.ok(has(dayProblems(rumorTop, IDS), /never be a rumor/));
  const noWhy = { ...day, items: [{ ...day.items[0], why: undefined }, day.items[1]] };
  assert.ok(has(dayProblems(noWhy, IDS), /why it matters/));
  assert.ok(has(dayProblems({ ...day, items: [day.items[0], day.items[0]] }, IDS), /share id/));
});
test('quote rules', () => {
  const q = goodSite()['data/experts/2026-10-07.json'].quotes[0];
  assert.deepEqual(quoteProblems(q, '2026-10-07', IDS), []);
  const long = { ...q, quote: Array(26).fill('word').join(' ') };
  assert.ok(has(quoteProblems(long, '2026-10-07', IDS), /26 words/));
  assert.ok(has(quoteProblems({ ...q, person: '' }, '2026-10-07', IDS), /missing person/));
  assert.ok(has(quoteProblems({ ...q, said: '2026-10-08' }, '2026-10-07', IDS), /on or before/));
});
test('project rules: every project says what it is, and code is GitHub only, gated', () => {
  const never = () => ({ ok: false, why: 'never gated' });
  const ok = () => ({ ok: true });
  assert.deepEqual(projectProblems(project(), IDS, never), [], 'a hosted app needs no gate');
  assert.ok(has(projectProblems(project({ kind: undefined }), IDS, ok), /kind must be repo or app/));
  assert.ok(has(projectProblems(project({ kind: 'app', url: 'https://github.com/o/r' }), IDS, ok), /code host/), 'an app may not live on a code host');
  assert.ok(has(projectProblems(project({ kind: 'repo' }), IDS, ok), /must be its GitHub page/));
  assert.ok(has(projectProblems(project({ kind: 'repo', url: 'https://github.com/o/r' }), IDS, never), /not cleared by the security gate/));
  assert.deepEqual(projectProblems(project({ kind: 'repo', url: 'https://github.com/o/r' }), IDS, ok), []);
  assert.ok(has(projectProblems(project({ kind: 'repo', repo: 'o/r', url: 'https://o.github.io/r' }), IDS, ok), /must be its GitHub page/), 'a code project links its repo, not a docs site');
  assert.ok(has(projectProblems(project({ kind: 'repo', repo: 'o/r', url: 'https://github.com/other/thing' }), IDS, ok), /does not match/), 'the link and the repo field must agree');
  assert.ok(has(projectProblems(project({ kind: 'repo', repo: 'good/repo', url: 'https://evil.example/install.sh' }), IDS, ok), /must be its GitHub page/));
  assert.ok(has(projectProblems(project({ shot: { src: 'http://tracker.example/p.png', alt: 'x' } }), IDS, ok), /picture.*https/), 'a plain http picture never renders');
  assert.deepEqual(projectProblems(project({ shot: { src: 'shots/x.png', alt: 'x' } }), IDS, ok), [], 'a local picture is fine');
  assert.ok(has(projectProblems(project({ shot: { src: '../x.png', alt: 'x' } }), IDS, ok), /picture/), 'no climbing out of the site');
  assert.ok(has(projectProblems(project({ kind: 'repo', url: 'https://gitlab.com/o/r' }), IDS, ok), /only GitHub/));
  assert.ok(has(projectProblems(project({ kind: 'app', url: 'https://pypi.org/project/x' }), IDS, ok), /code host/));
  assert.ok(has(projectProblems(project({ kind: 'app', repo: 'o/r' }), IDS, never), /not cleared/), 'a repo field is gated whatever the kind');
});
