// catalog.mjs - every code repo Frontier Radar lists (every Top 20 file, newest first), for gate.mjs
// --catalog and --recheck. Archived lists are included so a repo that later fails drops out everywhere.
import { loadSite } from './lib/data.mjs';
import { repoOf } from './gatefor.mjs';

const s = loadSite(new URL('..', import.meta.url).pathname);
const seen = new Map();
for (const t of [...s.top20].reverse()) {
  for (const p of t.projects || []) {
    const repo = p.kind === 'repo' ? repoOf(p) : null;
    if (!repo) continue;
    const k = repo.toLowerCase();
    if (!seen.has(k)) seen.set(k, { repo, where: [] });
    seen.get(k).where.push(`top20 ${t.date}`);
  }
}
// Repos cited by news items and quotes render on live pages too, so the weekly re-check covers them.
const cite = (url, where) => { const m = String(url || '').match(/^https:\/\/github\.com\/([^/#?]+)\/([^/#?]+)/); if (!m) return;
  const repo = `${m[1]}/${m[2]}`.replace(/\.git$/, ''), k = repo.toLowerCase();
  if (!seen.has(k)) seen.set(k, { repo, where: [] }); if (!seen.get(k).where.includes(where)) seen.get(k).where.push(where); };
for (const d of s.days) for (const it of d.items) for (const src of it.sources || []) cite(src.url, `day ${d.date} item ${it.id}`);
for (const f of s.experts) for (const q of f.quotes || []) cite(q.url, `quote ${f.date} ${q.person}`);
const list = [...seen.values()];
if (process.argv.includes('--json')) console.log(JSON.stringify(list, null, 2));
else for (const e of list) console.log(`${e.repo}\t${e.where.join(', ')}`);
