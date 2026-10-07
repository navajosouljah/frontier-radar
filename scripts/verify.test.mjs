import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { goodSite, writeSite, course, project, item } from './test-site.mjs';
import { build } from './build.mjs';
import { verify, fenceProblems } from './verify.mjs';

const NOW = Date.parse('2026-10-07T12:05:00Z');
const run = site => { const dir = writeSite(site); build(dir, { now: '2026-10-07T12:05:00Z' }); return verify(dir, { nowMs: NOW }); };
const has = (list, re) => list.some(p => re.test(p));
const pass = (repo, checked = '2026-10-01') => ({ repo, checked, verdict: 'PASS',
  checks: { advisories: { source: 'github-api', url: `https://github.com/${repo}/security/advisories`, count: 0 } } });

test('a good site passes', () => assert.deepEqual(run(goodSite()), []));
test('a rumor as top story is refused', () => {
  const s = goodSite();
  s['data/days/2026-10-07/items.json'].items[0].rumor = true;
  assert.ok(has(run(s), /never be a rumor/));
});
test('a long quote is refused', () => {
  const s = goodSite();
  s['data/experts/2026-10-07.json'].quotes[0].quote = Array(30).fill('word').join(' ');
  assert.ok(has(run(s), /30 words/));
});
test('an income-promise course is refused', () => {
  const s = goodSite();
  s['data/courses/2026-10-02.json'].courses = [course({ outcome: 'Passive income in 30 days' })];
  assert.ok(has(run(s), /income or guaranteed/));
});
test('a blocklisted repo is refused everywhere', () => {
  const s = goodSite();
  s['data/rr-blocklist.json'].repos = [{ repo: 'bad/repo', reason: 'open advisories' }];
  s['data/top20/2026-10-02.json'].projects = [project({ kind: 'repo', url: 'https://github.com/bad/repo' })];
  const p = run(s);
  assert.ok(has(p, /not cleared by the security gate/));
  assert.ok(has(p, /links a blocklisted repo/));
});
test('a github link inside a news item or a quote must be a cleared repo (fix 2)', () => {
  const s = goodSite();
  s['data/days/2026-10-07/items.json'].items[1].sources.push({ url: 'https://github.com/some/tool/releases', outlet: 'GitHub', kind: 'community' });
  assert.ok(has(run(s), /some\/tool.*never gated/), 'ungated');
  s['data/gate-log.json'] = { 'some/tool': pass('some/tool') };
  assert.deepEqual(run(s), [], 'gated and fresh');
  const q = goodSite();
  q['data/experts/2026-10-07.json'].quotes[0].url = 'https://github.com/other/thing/issues/1';
  assert.ok(has(run(q), /other\/thing.*never gated/), 'a quote link is checked too');
});
test('an archived Top 20 list may carry a stale PASS, never a FAIL or a missing gate (fix 3)', () => {
  const s = goodSite();
  s['data/top20/2026-09-04.json'] = { date: '2026-09-04', projects: [project({ kind: 'repo', url: 'https://github.com/old/repo' })] };
  s['data/gate-log.json'] = { 'old/repo': pass('old/repo', '2026-07-01') };
  assert.deepEqual(run(s), [], 'a stale PASS on an archived list is fine');
  s['data/gate-log.json']['old/repo'].verdict = 'FAIL';
  assert.ok(has(run(s), /old\/repo is not cleared.*FAIL/));
  delete s['data/gate-log.json']['old/repo'];
  assert.ok(has(run(s), /old\/repo is not cleared.*never gated/));
  const t = goodSite();
  t['data/top20/2026-10-02.json'].projects = [project({ kind: 'repo', url: 'https://github.com/old/repo' })];
  t['data/gate-log.json'] = { 'old/repo': pass('old/repo', '2026-07-01') };
  assert.ok(has(run(t), /old\/repo is not cleared.*days old/), 'the live list needs a fresh gate');
});
test("Repo Radar's blocklist copy must be fresh and non-empty (fix 7)", () => {
  const s = goodSite();
  s['data/rr-blocklist.json'].fetched = '2026-10-04T11:00:00Z';
  assert.ok(has(run(s), /rr-blocklist.*3 days old/));
  const e = goodSite();
  e['data/rr-blocklist.json'].repos = [];
  assert.ok(has(run(e), /rr-blocklist.*empty/));
  const m = goodSite();
  delete m['data/rr-blocklist.json'];
  assert.ok(has(run(m), /rr-blocklist.*missing/));
});
test('a file dated in the future is refused', () => {
  const s = goodSite();
  s['data/courses/2026-10-09.json'] = { date: '2026-10-09', courses: [course({ page_checked: '2026-10-07' })] };
  assert.ok(has(run(s), /courses\/2026-10-09.*future/));
  const t = goodSite();
  t['data/top20/2026-10-09.json'] = { date: '2026-10-09', projects: [project()] };
  assert.ok(has(run(t), /top20\/2026-10-09.*future/));
  const d = goodSite();
  d['data/days/2026-10-08/items.json'] = { date: '2026-10-08', items: [item({ id: 'x', story: 'x', published: '2026-10-08T01:00:00Z' })] };
  d['docs/reports/2026-10-08.md'] = '## Needs JJ\n';
  assert.ok(has(run(d), /days\/2026-10-08.*future/));
});
test('a missing day report is refused', () => {
  const s = goodSite();
  delete s['docs/reports/2026-10-07.md'];
  assert.ok(has(run(s), /docs\/reports\/2026-10-07\.md/));
});
test('a dash in a page is refused', () => {
  const dir = writeSite(goodSite());
  build(dir, { now: '2026-10-07T12:05:00Z' });
  writeFileSync(join(dir, 'experts.html'), 'a — b <footer>not affiliated with Anthropic, SpaceXAI, Google, OpenAI or TypeSafe AI</footer>');
  assert.ok(has(verify(dir, { nowMs: NOW }), /em or en dash/));
});
test('the old company name is refused on a page', () => {
  const dir = writeSite(goodSite());
  build(dir, { now: '2026-10-07T12:05:00Z' });
  writeFileSync(join(dir, 'experts.html'), '<footer>not affiliated with Anthropic, xAI, Google, OpenAI or TypeSafe AI</footer>');
  assert.ok(has(verify(dir, { nowMs: NOW }), /not-affiliated footer/));
});
test('a correction must point at a real item', () => {
  const s = goodSite();
  s['data/corrections.json'] = [{ date: '2026-10-07', item: 'nope', note: 'x' }];
  assert.ok(has(run(s), /correction.*nope/));
});
test('the fence: scripts and rule files', () => {
  const day = { status: 'A', path: 'data/days/2026-10-08/items.json' };
  assert.deepEqual(fenceProblems([day, { status: 'M', path: 'index.html' }]), []);
  assert.equal(fenceProblems([day, { status: 'M', path: 'scripts/verify.mjs' }]).length, 1);
  assert.equal(fenceProblems([day, { status: 'M', path: 'docs/COURSE_VETTING.md' }]).length, 1);
  assert.deepEqual(fenceProblems([{ status: 'M', path: 'scripts/verify.mjs' }]), [], 'a script change on its own is fine');
});
test('the fence: blocklists only grow and gate verdicts never flip to PASS in a day push (fix 4)', () => {
  const day = { status: 'A', path: 'data/days/2026-10-08/items.json' };
  const J = JSON.stringify;
  const shrink = { status: 'M', path: 'data/blocklist.json', before: J([{ repo: 'a/b', reason: 'x' }, { repo: 'c/d', reason: 'y' }]), after: J([{ repo: 'a/b', reason: 'x' }]) };
  assert.match(fenceProblems([day, shrink])[0], /c\/d.*removed/);
  const grow = { ...shrink, before: shrink.after, after: shrink.before };
  assert.deepEqual(fenceProblems([day, grow]), [], 'adding an entry is fine');
  const rrShrink = { status: 'M', path: 'data/rr-blocklist.json', before: J({ fetched: 'x', repos: [{ repo: 'a/b' }] }), after: J({ fetched: 'y', repos: [] }) };
  assert.match(fenceProblems([day, rrShrink])[0], /a\/b.*removed/);
  const flip = { status: 'M', path: 'data/gate-log.json', before: J({ 'a/b': { repo: 'a/b', verdict: 'FAIL' } }), after: J({ 'a/b': { repo: 'a/b', verdict: 'PASS' } }) };
  assert.match(fenceProblems([day, flip])[0], /a\/b.*FAIL to PASS/);
  const fresh = { status: 'M', path: 'data/gate-log.json', before: J({ 'a/b': { repo: 'a/b', verdict: 'FAIL' } }), after: J({ 'a/b': { repo: 'a/b', verdict: 'FAIL' }, 'c/d': { repo: 'c/d', verdict: 'PASS' } }) };
  assert.deepEqual(fenceProblems([day, fresh]), [], 'a new gate record is fine');
  assert.deepEqual(fenceProblems([shrink, flip]), [], 'without a new day the fence does not apply');
  const renamed = { status: 'M', path: 'data/gate-log.json', before: J({ 'Owner/Repo': { repo: 'Owner/Repo', verdict: 'REVIEW' } }), after: J({ 'owner/repo': { repo: 'owner/repo', verdict: 'PASS' } }) };
  assert.match(fenceProblems([day, renamed])[0], /owner\/repo.*REVIEW to PASS/i, 'a re-keyed record is the same repo');
  const deleted = { status: 'D', path: 'data/blocklist.json', before: J([{ repo: 'a/b', reason: 'x' }]) };
  assert.match(fenceProblems([day, deleted])[0], /a\/b.*removed/, 'deleting the file removes every entry');
  const wiped = { status: 'D', path: 'data/gate-log.json', before: J({ 'a/b': { repo: 'a/b', verdict: 'FAIL' } }) };
  assert.match(fenceProblems([day, wiped])[0], /gate-log.*deleted/, 'the gate log may not be deleted in a day push');
});
test('the fence reads real git changes against origin/main (renamed keys, deleted files, new days)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'fr-git-'));
  const origin = join(tmp, 'origin.git'), work = join(tmp, 'work');
  const sh = (cwd, ...a) => { const r = spawnSync('git', ['-C', cwd, ...a], { encoding: 'utf8' }); if (r.status !== 0) throw new Error(r.stderr); return r.stdout; };
  spawnSync('git', ['init', '-q', '--bare', '-b', 'main', origin]);
  spawnSync('git', ['init', '-q', '-b', 'main', work]);
  sh(work, 'config', 'user.email', 't@t'); sh(work, 'config', 'user.name', 't');
  writeSite(goodSite(), work);
  writeFileSync(join(work, 'data/gate-log.json'), JSON.stringify({ 'Owner/Repo': { repo: 'Owner/Repo', verdict: 'REVIEW' } }));
  writeFileSync(join(work, 'data/blocklist.json'), JSON.stringify([{ repo: 'own/block', date: '2026-09-01', kind: 'conduct', reason: 'malware' }]));
  sh(work, 'add', '-A'); sh(work, 'commit', '-q', '-m', 'base'); sh(work, 'remote', 'add', 'origin', origin); sh(work, 'push', '-q', 'origin', 'main');
  build(work, { now: '2026-10-07T12:05:00Z' });
  assert.deepEqual(verify(work, { nowMs: NOW }).filter(p => p.startsWith('the fence') || /same push/.test(p)), [], 'nothing changed yet');
  // A new day, a re-keyed PASS and a deleted blocklist, all uncommitted, as a daily run would leave them.
  writeSite({ 'data/days/2026-10-08/items.json': { date: '2026-10-08', items: [item({ id: 'n', story: 'n', published: '2026-10-08T01:00:00Z' })] }, 'docs/reports/2026-10-08.md': '## Needs JJ\n' }, work);
  writeFileSync(join(work, 'data/gate-log.json'), JSON.stringify({ 'owner/repo': { repo: 'owner/repo', verdict: 'PASS' } }));
  rmSync(join(work, 'data/blocklist.json'));
  const problems = verify(work, { nowMs: Date.parse('2026-10-08T12:05:00Z') });
  assert.ok(problems.some(p => /owner\/repo.*REVIEW to PASS/i.test(p)), problems.join('\n'));
  assert.ok(problems.some(p => /blocklist\.json: own\/block was removed \(the file was deleted\)/.test(p)), problems.join('\n'));
});
