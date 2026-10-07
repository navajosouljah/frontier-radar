// test-site.mjs - a small valid Frontier Radar site for tests. Change a copy to make it invalid.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

export const AIS = [
  { id: 'claude', name: 'Claude', maker: 'Anthropic', color: '#c96442' },
  { id: 'grok', name: 'Grok', maker: 'SpaceXAI (formerly xAI)', color: '#22252c' },
  { id: 'gemini', name: 'Gemini', maker: 'Google', color: '#2f6fde' },
  { id: 'chatgpt', name: 'ChatGPT / OpenAI', maker: 'OpenAI', color: '#10875f' },
  { id: 'jev', name: 'Jev', maker: 'TypeSafe AI', color: '#7a4fd1', note: 'In limited early access since Sep 15, 2026.' },
];
export const item = (over = {}) => ({
  id: 'claude-feature', ai: 'claude', category: 'feature', story: 'claude-feature',
  headline: 'Fixture headline about a feature', summary: 'A fixture summary in plain words.',
  published: '2026-10-07T08:00:00Z', rumor: false,
  sources: [{ url: 'https://www.anthropic.com/news/fixture', outlet: 'Anthropic', kind: 'official' }],
  ...over,
});
export const course = (over = {}) => ({
  name: 'Fixture Course', ai: 'claude', provider: 'Fixture Academy', provider_url: 'https://academy.example.com',
  url: 'https://academy.example.com/claude', price: { amount: 499, currency: 'USD', display: '$499' },
  format: 'Self-paced', length: '6 hours', outcome: 'A working agent',
  reviews: { score: 4.6, count: 40, site: 'Reviews Example', url: 'https://reviews.example.net/fixture' },
  page_checked: '2026-10-01', claims_checked: true,
  ...over,
});
export const project = (over = {}) => ({
  rank: 1, name: 'Fixture App', ai: 'claude', kind: 'app', oneliner: 'Does a fixture thing.',
  url: 'https://fixture.example.com', why: 'Launched this week.',
  sources: [{ url: 'https://news.ycombinator.com/item?id=1', outlet: 'Hacker News' }],
  ...over,
});
export function goodSite() {
  return {
    'data/ai.json': AIS,
    'data/days/2026-10-07/items.json': {
      date: '2026-10-07', top: 'claude-feature',
      items: [
        item({ why: 'Fixture reason it matters.' }),
        item({ id: 'grok-model', ai: 'grok', category: 'model', story: 'grok-model', headline: 'Fixture Grok model',
          sources: [{ url: 'https://x.ai/news/fixture', outlet: 'SpaceXAI', kind: 'official' }] }),
      ],
    },
    'data/ai/claude.json': { flagship: 'Fixture Model', newest: '2026-10-07', plans_from: '$20 / month',
      sources: [{ url: 'https://www.anthropic.com/pricing', outlet: 'Anthropic', kind: 'official' }] },
    'data/experts/2026-10-07.json': {
      date: '2026-10-07',
      debate: { title: 'Fixture debate', consensus: 'Most say X. Skeptics say Y.', story: 'claude-feature' },
      quotes: [{ person: 'Ada Example', role: 'AI researcher', outlet: 'Her blog', url: 'https://example.org/post',
        quote: 'This is a short fixture quote.', stance: 'impressed', ai: 'claude', story: 'claude-feature', said: '2026-10-06' }],
    },
    'data/top20/2026-10-02.json': { date: '2026-10-02', projects: [project()] },
    'data/courses/2026-10-02.json': { date: '2026-10-02', courses: [course()] },
    'data/corrections.json': [],
    'data/gate-log.json': {},
    'data/blocklist.json': [],
    'data/rr-blocklist.json': { fetched: '2026-10-07T11:00:00Z', source: 'https://raw.githubusercontent.com/navajosouljah/repo-radar/main/data/blocklist.json',
      repos: [{ repo: 'fixture/blocked', date: '2026-09-27', kind: 'open-advisories', reason: 'fixture entry' }] },
    'docs/reports/2026-10-07.md': '## Needs JJ\n\nNothing.\n',
    'assets/site.css': '/* test stub */',
  };
}
export function writeSite(files, dir = mkdtempSync(join(tmpdir(), 'fr-'))) {
  for (const [p, v] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), typeof v === 'string' ? v : JSON.stringify(v, null, 2));
  }
  return dir;
}
