// data.mjs - reads Frontier Radar's data folder into one object (docs/DATA_FORMAT.md).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export function loadSite(root) {
  const read = (p, d) => (existsSync(join(root, p)) ? JSON.parse(readFileSync(join(root, p), 'utf8')) : d);
  const dated = dir => (existsSync(join(root, dir))
    ? readdirSync(join(root, dir)).map(f => f.replace(/\.json$/, '')).filter(d => DATE.test(d)).sort()
    : []);
  const ais = read('data/ai.json', []);
  // Repo Radar's blocklist copy is { fetched, source, repos } (scripts/sync-blocklist.mjs); a bare list is tolerated.
  const rr = read('data/rr-blocklist.json', null);
  const rrRepos = Array.isArray(rr) ? rr : rr?.repos || [];
  return {
    root, ais,
    aiIds: ais.map(a => a.id),
    status: Object.fromEntries(ais.map(a => [a.id, read(`data/ai/${a.id}.json`, null)])),
    days: dated('data/days').map(d => read(`data/days/${d}/items.json`)),
    experts: dated('data/experts').map(d => read(`data/experts/${d}.json`)),
    top20: dated('data/top20').map(d => read(`data/top20/${d}.json`)),
    courses: dated('data/courses').map(d => read(`data/courses/${d}.json`)),
    sources: read('data/sources.json', null),
    corrections: read('data/corrections.json', []),
    gateLog: read('data/gate-log.json', {}),
    blocklists: [read('data/blocklist.json', []), rrRepos],
    rrBlocklist: rr && !Array.isArray(rr) ? rr : null,
  };
}
export const latest = list => list[list.length - 1] || null;
// The newest file dated on or before `date` (what the site showed that day).
export const asOf = (list, date) => [...list].reverse().find(x => x.date <= date) || null;
