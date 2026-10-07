import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { goodSite, writeSite, item } from './test-site.mjs';
import { build } from './build.mjs';

const NOW = '2026-10-07T12:05:00Z';
const page = (dir, p) => readFileSync(join(dir, p), 'utf8');
const FOOTER = /not affiliated with Anthropic, SpaceXAI, Google, OpenAI or TypeSafe AI/;

test('builds every page with the footer', () => {
  const dir = writeSite(goodSite());
  const pages = build(dir, { now: NOW });
  for (const p of ['index.html', 'ai/claude.html', 'ai/jev.html', 'experts.html', 'top20.html', 'courses.html', 'archive.html', 'corrections.html', 'days/2026-10-07/index.html']) {
    assert.ok(pages.includes(p), `missing ${p}`);
    assert.ok(existsSync(join(dir, p)));
    assert.match(page(dir, p), FOOTER);
  }
  const home = page(dir, 'index.html');
  assert.match(home, /Fixture headline about a feature/);
  assert.match(home, /Fixture reason it matters/);
  assert.match(home, /data-updated="2026-10-07T12:05:00Z"/);
  assert.match(page(dir, 'ai/grok.html'), /Made by SpaceXAI/);
});
test('jev tab with no items says so', () => {
  const dir = writeSite(goodSite());
  build(dir, { now: NOW });
  assert.match(page(dir, 'ai/jev.html'), /No updates found for Jev yet\. In limited early access since Sep 15, 2026\./);
  assert.match(page(dir, 'ai/jev.html'), /no data found/);
});
test('all-rumor day never promotes a rumor', () => {
  const site = goodSite();
  site['data/days/2026-10-07/items.json'] = { date: '2026-10-07', items: [item({ id: 'r', story: 'r', rumor: true })] };
  const dir = writeSite(site);
  build(dir, { now: NOW });
  const home = page(dir, 'index.html');
  assert.match(home, /No confirmed top story today/);
  assert.match(home, /class="rumor">Rumor/);
});
test('escapes hostile headline', () => {
  const site = goodSite();
  site['data/days/2026-10-07/items.json'].items[1].headline = '<img src=x onerror=alert(1)> [x](javascript:alert(1))';
  const dir = writeSite(site);
  build(dir, { now: NOW });
  const html = page(dir, 'index.html') + page(dir, 'ai/grok.html');
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('href="javascript'));
});
test('stale note: live pages carry the check, archived days say archived', () => {
  const site = goodSite();
  site['data/days/2026-10-06/items.json'] = { date: '2026-10-06', top: 'old', items: [item({ id: 'old', story: 'old', published: '2026-10-06T08:00:00Z', why: 'Old why.' })] };
  site['docs/reports/2026-10-06.md'] = '## Needs JJ\n';
  const dir = writeSite(site);
  build(dir, { now: NOW });
  assert.match(page(dir, 'index.html'), /id="stale" hidden>Not updated today/);
  assert.match(page(dir, 'index.html'), /30\*36e5/);
  assert.match(page(dir, 'days/2026-10-06/index.html'), /Archived edition from Tuesday, Oct 6, 2026/);
  assert.ok(!page(dir, 'days/2026-10-06/index.html').includes('30*36e5'));
});
test('corrections show on the item', () => {
  const site = goodSite();
  site['data/corrections.json'] = [{ date: '2026-10-07', item: 'grok-model', note: 'The model name was wrong.' }];
  const dir = writeSite(site);
  build(dir, { now: NOW });
  assert.match(page(dir, 'ai/grok.html'), /Corrected Oct 7:<\/b> The model name was wrong\./);
  assert.match(page(dir, 'corrections.html'), /The model name was wrong\./);
});
test('a story filed on two days shows once on the AI tab, with every source (review fix 6)', () => {
  const site = goodSite();
  site['data/days/2026-10-06/items.json'] = { date: '2026-10-06', top: 'claude-feature', items: [item({ why: 'Early why.', published: '2026-10-06T08:00:00Z',
    sources: [{ url: 'https://techcrunch.com/first-report', outlet: 'TechCrunch', kind: 'press' }, { url: 'https://www.theverge.com/b', outlet: 'The Verge', kind: 'press' }] })] };
  site['docs/reports/2026-10-06.md'] = '## Needs JJ\n';
  const dir = writeSite(site);
  build(dir, { now: NOW });
  const html = page(dir, 'ai/claude.html');
  assert.equal((html.match(/Fixture headline about a feature/g) || []).length, 1, 'one timeline entry');
  assert.match(html, /https:\/\/techcrunch\.com\/first-report/, 'the earliest source is the one linked');
  assert.equal((html.match(/1 update/g) || []).length, 1, 'the week count sees one story');
});
test('orphan pages from an earlier build are removed', () => {
  const dir = writeSite(goodSite());
  for (const p of ['days/2020-01-01/index.html', 'ai/llama.html', 'old-page.html']) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), '<html>stale</html>');
  }
  build(dir, { now: NOW });
  assert.ok(!existsSync(join(dir, 'days/2020-01-01/index.html')), 'a day page with no data is gone');
  assert.ok(!existsSync(join(dir, 'ai/llama.html')), 'an AI page with no AI is gone');
  assert.ok(!existsSync(join(dir, 'old-page.html')), 'a root page the build did not write is gone');
  assert.ok(existsSync(join(dir, 'assets/site.css')), 'assets are untouched');
});
