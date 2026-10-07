// verify.mjs - must pass before anything ships (scripts/ship.sh runs it). Fails closed.
//   1. data rules: items, days, quotes, projects (with the gate), courses (vetting), status sources,
//      corrections, no file dated in the future, a fresh non-empty copy of Repo Radar's blocklist
//   2. every day has its report (docs/reports/<date>.md, starting "## Needs JJ")
//   3. pages: no em or en dashes, every internal link resolves, no javascript: or data: links,
//      every github.com repo link is cleared by the gate (archived days may carry a stale PASS),
//      no link to a blocklisted repo, the not-affiliated footer on every page
//   4. the fence: a push that adds a day changes no script and no rule file (Repo Radar, Oct 2 2026),
//      removes nothing from a blocklist, and turns no gate FAIL or REVIEW into a PASS
// Usage: node scripts/verify.mjs [--root DIR]
import { readFileSync, existsSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { loadSite, latest } from './lib/data.mjs';
import { dayProblems, quoteProblems, projectProblems, trustFrom } from './checks.mjs';
import { courseProblems } from './vetting.mjs';
import { makeGateFor, blockedRepos, ghRepo } from './gatefor.mjs';
import { isHttps, hasDash } from './lib/text.mjs';
import { FOOTER_LINE } from './templates.mjs';

export const MAX_BLOCKLIST_AGE_DAYS = 2;
const SKIP = ['.git', 'node_modules', '.vercel', '.superpowers', 'scripts', 'docs', 'data'];
function walk(root, dir = '', out = []) {
  for (const f of readdirSync(join(root, dir))) {
    if (SKIP.includes(f)) continue;
    const p = dir ? `${dir}/${f}` : f;
    if (statSync(join(root, p)).isDirectory()) walk(root, p, out); else out.push(p);
  }
  return out;
}

export function verify(root, { nowMs = Date.now() } = {}) {
  const problems = [];
  const bad = (w, m) => problems.push(`${w}: ${m}`);
  const s = loadSite(root);
  const today = new Date(nowMs).toISOString().slice(0, 10);

  // 1. data
  if (s.ais.length !== 5) bad('data/ai.json', 'must list exactly the five AIs');
  for (const [kind, list] of [['days', s.days], ['experts', s.experts], ['top20', s.top20], ['courses', s.courses]]) {
    for (const f of list) if (f.date > today) bad(`data/${kind}/${f.date}`, `is dated in the future (today is ${today})`);
  }
  if (!s.sources) bad('data/sources.json', 'missing; the source list decides what counts as official, press, a leak tracker or a rumor account');
  const trust = trustFrom(s.sources || {});
  for (const day of s.days) problems.push(...dayProblems(day, s.aiIds, trust));
  for (const [id, st] of Object.entries(s.status)) {
    if (!st) continue;
    if (!(st.sources || []).length) bad(`data/ai/${id}.json`, 'status boxes need at least one source');
    for (const src of st.sources || []) if (!isHttps(src.url)) bad(`data/ai/${id}.json`, `source must be https (${src.url})`);
  }
  for (const f of s.experts) {
    for (const q of f.quotes || []) problems.push(...quoteProblems(q, f.date, s.aiIds));
    if (f.debate && !(f.quotes || []).some(q => q.story === f.debate.story)) bad(`data/experts/${f.date}.json`, 'the debate has no quotes');
  }
  if (!s.rrBlocklist) bad('data/rr-blocklist.json', "missing or not in the { fetched, source, repos } form that scripts/sync-blocklist.mjs writes: run it");
  else {
    const age = (nowMs - Date.parse(s.rrBlocklist.fetched)) / 864e5;
    if (!(age <= MAX_BLOCKLIST_AGE_DAYS)) bad('data/rr-blocklist.json', `Repo Radar's blocklist copy is ${Math.round(age)} days old (limit ${MAX_BLOCKLIST_AGE_DAYS}): run scripts/sync-blocklist.mjs`);
    if (!s.rrBlocklist.repos.length) bad('data/rr-blocklist.json', "Repo Radar's blocklist copy is empty; the real list is not");
  }
  const gateFor = makeGateFor(s.gateLog, s.blocklists, nowMs);
  const gateForArchive = makeGateFor(s.gateLog, s.blocklists, nowMs, { allowStale: true });
  const newestTop20 = latest(s.top20);
  for (const f of s.top20) {
    if (f.projects.length > 20) bad(`data/top20/${f.date}.json`, 'more than 20 projects');
    const ranks = f.projects.map(p => p.rank).sort((a, b) => a - b);
    if (ranks.some((r, i) => r !== i + 1)) bad(`data/top20/${f.date}.json`, 'ranks must run 1, 2, 3 with no gaps');
    // The live list needs a fresh gate. An archived list may keep a stale PASS, never a FAIL, a blocklisting or a missing gate.
    for (const p of f.projects) problems.push(...projectProblems(p, s.aiIds, f === newestTop20 ? gateFor : gateForArchive));
  }
  for (const f of s.courses) for (const c of f.courses || []) problems.push(...courseProblems(c, f.date, s.aiIds));
  // Every github.com repo cited by an item or a quote renders on a live page (the AI tabs show every
  // item ever filed), so each one needs a current gate, whatever day it was filed under.
  for (const day of s.days) for (const it of day.items) for (const src of it.sources || []) {
    const repo = ghRepo(src.url);
    if (!repo) continue;
    const g = gateFor(repo);
    if (!g.ok) bad(`day ${day.date} item ${it.id}`, `source ${src.url} is the repo ${repo}, which the gate has not cleared (${g.why}): gate it with node scripts/gate.mjs ${repo}, or cite a page that is not on GitHub`);
  }
  for (const f of s.experts) for (const q of f.quotes || []) {
    const repo = ghRepo(q.url);
    if (!repo) continue;
    const g = gateFor(repo);
    if (!g.ok) bad(`quote by ${q.person} (${f.date})`, `link ${q.url} is the repo ${repo}, which the gate has not cleared (${g.why})`);
  }
  const ids = new Set(s.days.flatMap(d => d.items.map(it => it.id)));
  for (const c of s.corrections) if (!ids.has(c.item) || !c.note || !c.date) bad('data/corrections.json', `correction for "${c.item}" needs a real item id, a date and a note`);

  // 2. reports
  for (const day of s.days) {
    const p = `docs/reports/${day.date}.md`;
    if (!existsSync(join(root, p)) || !readFileSync(join(root, p), 'utf8').startsWith('## Needs JJ')) bad(p, 'every day needs its report, starting with "## Needs JJ"');
  }

  // 3. pages
  const blocked = blockedRepos(s.blocklists);
  const todayDay = latest(s.days)?.date;
  for (const f of walk(root).filter(f => f.endsWith('.html'))) {
    const html = readFileSync(join(root, f), 'utf8');
    const archived = /^days\/(\d{4}-\d{2}-\d{2})\//.test(f) && f.slice(5, 15) !== todayDay;
    const gate = archived ? gateForArchive : gateFor;
    if (hasDash(html)) bad(f, 'contains an em or en dash');
    if (!html.includes(FOOTER_LINE)) bad(f, `is missing the not-affiliated footer (${FOOTER_LINE})`);
    for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(javascript|data):/i.test(href)) { bad(f, `unsafe link ${href.slice(0, 40)}`); continue; }
      const repo = ghRepo(href);
      if (repo) {
        if (blocked.has(repo.toLowerCase())) bad(f, `links a blocklisted repo (${repo})`);
        else { const g = gate(repo); if (!g.ok) bad(f, `links the repo ${repo}, which the gate has not cleared (${g.why}): gate it with node scripts/gate.mjs ${repo}, or cite a page that is not on GitHub`); }
      }
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const path = href.split('#')[0].split('?')[0];
      if (path && !existsSync(join(root, normalize(join(dirname(f), path))))) bad(f, `broken link ${href}`);
    }
  }

  // 4. the fence
  const vs = changesVsGitHub(root);
  if (vs?.error) bad('the fence', `can't compare this checkout with GitHub (${vs.error})`);
  else if (vs) problems.push(...fenceProblems(vs.changes));
  return [...new Set(problems)];
}

const PROTECTED = [/^scripts\//, /^CLAUDE\.md$/, /^docs\/(SECURITY_GATE|COURSE_VETTING|DAILY_PLAYBOOK|DATA_FORMAT)\.md$/];
const BLOCKLISTS = ['data/blocklist.json', 'data/rr-blocklist.json'];
const parse = t => { try { return JSON.parse(t); } catch { return null; } };
const repoSet = v => new Set(((Array.isArray(v) ? v : v?.repos) || []).map(b => String(b.repo || '').toLowerCase()).filter(Boolean));

// `changes` is [{ status: 'A'|'M'|'D', path, before?, after? }]; before/after carry the file text for the
// blocklists and the gate log (git's copy on origin/main, and the local copy).
export function fenceProblems(changes) {
  const added = changes.find(c => c.status === 'A' && /^data\/days\/\d{4}-\d{2}-\d{2}\/items\.json$/.test(c.path));
  if (!added) return [];
  const out = changes.filter(c => PROTECTED.some(re => re.test(c.path)))
    .map(c => `${c.path} changed in the same push as a new day (${added.path}). A daily run never edits the scripts or the rule files: put the file back, and if a check is blocking you, stop and report it instead`);
  for (const c of changes) {
    if (c.before == null) continue;
    const after = c.status === 'D' ? '' : c.after; // a deleted file is an empty one
    if (after == null) continue;
    if (BLOCKLISTS.includes(c.path)) {
      const was = repoSet(parse(c.before)), now = repoSet(parse(after));
      for (const r of was) if (!now.has(r)) out.push(`${c.path}: ${r} was removed${c.status === 'D' ? ' (the file was deleted)' : ''} in the same push as a new day (${added.path}). A daily run may add to a blocklist, never remove from it`);
    }
    if (c.path === 'data/gate-log.json') {
      if (c.status === 'D') { out.push(`data/gate-log.json was deleted in the same push as a new day (${added.path}). Only gate.mjs writes it; put it back`); continue; }
      // Records are matched by repo, not by key: gate.mjs re-keys a record when the case of the name changes.
      const byRepo = log => { const m = new Map(); for (const e of Object.values(parse(log) || {})) if (e?.repo) m.set(String(e.repo).toLowerCase(), e); return m; };
      const was = byRepo(c.before), now = byRepo(after);
      for (const [r, e] of was) {
        if (e.verdict && e.verdict !== 'PASS' && now.get(r)?.verdict === 'PASS') out.push(`data/gate-log.json: ${r} went from ${e.verdict} to PASS in the same push as a new day (${added.path}). Only the Mac-side weekly re-check or JJ clears a repo`);
      }
    }
  }
  return out;
}
// Everything that differs from GitHub's main: unpushed commits, uncommitted edits, new files.
function changesVsGitHub(root) {
  const git = (...a) => spawnSync('git', ['-C', root, ...a], { encoding: 'utf8', maxBuffer: 50 << 20 });
  const top = git('rev-parse', '--show-toplevel');
  if (top.status !== 0 || realpathSync(top.stdout.trim()) !== realpathSync(root)) return null; // not a checkout (a test)
  if (git('rev-parse', '--verify', '-q', 'origin/main').status !== 0) return { error: 'no origin/main to compare with' };
  const diff = git('diff', '--name-status', '--no-renames', 'origin/main');
  const fresh = git('ls-files', '--others', '--exclude-standard');
  if (diff.status !== 0 || fresh.status !== 0) return { error: (diff.stderr || fresh.stderr).trim().slice(0, 140) };
  const changes = [
    ...diff.stdout.split('\n').filter(Boolean).map(l => { const [status, ...p] = l.split('\t'); return { status: status[0], path: p.join('\t') }; }),
    ...fresh.stdout.split('\n').filter(Boolean).map(path => ({ status: 'A', path })),
  ];
  for (const c of changes) {
    if (!['M', 'D'].includes(c.status) || !(BLOCKLISTS.includes(c.path) || c.path === 'data/gate-log.json')) continue;
    const before = git('show', `origin/main:${c.path}`);
    if (before.status !== 0) continue;
    c.before = before.stdout;
    c.after = existsSync(join(root, c.path)) ? readFileSync(join(root, c.path), 'utf8') : '';
  }
  return { changes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const root = argv.includes('--root') ? argv[argv.indexOf('--root') + 1] : new URL('..', import.meta.url).pathname;
  const problems = verify(root);
  if (problems.length) { console.error(`VERIFY FAILED - ${problems.length} problem(s):\n  ${problems.join('\n  ')}`); process.exit(1); }
  console.log('verify ok');
}
