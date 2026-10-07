// sync-blocklist.mjs - copy Repo Radar's blocklist (public repo) into data/rr-blocklist.json as
// { fetched, source, repos }. verify.mjs refuses a copy older than 2 days or with no repos, so a run
// that cannot refresh it stops at verify instead of shipping with a stale copy.
//
// Two modes. The cloud run uses the default, grow-only: entries are added, never dropped, because the
// fence refuses a push that adds a day and removes a blocklist entry. The Mac-side scout runs with
// --replace on Mondays and takes Repo Radar's list as it is, drops included (no day is added then).
// On a failed fetch the previous copy stays; with no previous copy the run must stop.
// Usage: node scripts/sync-blocklist.mjs [--replace]
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SOURCE = 'https://raw.githubusercontent.com/navajosouljah/repo-radar/main/data/blocklist.json';
const OUT = new URL('../data/rr-blocklist.json', import.meta.url).pathname;

// The list to keep: the fetched list, plus (unless replace) every previous entry the fetched list dropped.
export function mergeBlocklist(prev, fetched, { replace = false } = {}) {
  if (replace || !prev) return fetched;
  const key = r => String(r.repo || '').toLowerCase();
  const latest = new Map(fetched.map(r => [key(r), r]));
  const kept = prev.map(r => latest.get(key(r)) || r); // previous order, the fetched copy of a kept entry wins
  const seen = new Set(kept.map(key));
  return [...kept, ...fetched.filter(r => !seen.has(key(r)))];
}

async function main() {
  const replace = process.argv.includes('--replace');
  try {
    const res = await fetch(SOURCE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fetched = await res.json();
    if (!Array.isArray(fetched) || !fetched.length) throw new Error('not a non-empty list');
    if (fetched.some(r => !r.repo)) throw new Error('an entry has no repo');
    const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;
    const repos = mergeBlocklist(Array.isArray(prev) ? prev : prev?.repos || null, fetched, { replace });
    writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString(), source: SOURCE, repos }, null, 2) + '\n');
    console.log(`rr-blocklist: ${repos.length} repos (${fetched.length} fetched${replace ? ', replaced' : ', grow-only'})`);
  } catch (e) {
    if (existsSync(OUT)) console.error(`WARN could not refresh Repo Radar's blocklist (${e.message}); keeping the last copy`);
    else { console.error(`STOP: no copy of Repo Radar's blocklist and the fetch failed (${e.message})`); process.exit(1); }
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
