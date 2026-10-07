// sync-blocklist.mjs - copy Repo Radar's blocklist (public repo) into data/rr-blocklist.json as
// { fetched, source, repos }. verify.mjs refuses a copy older than 2 days or with no repos, so a run
// that cannot refresh it stops at verify instead of shipping with a stale copy.
// On a failed fetch the previous copy stays; with no previous copy the run must stop.
import { writeFileSync, existsSync } from 'node:fs';

const SOURCE = 'https://raw.githubusercontent.com/navajosouljah/repo-radar/main/data/blocklist.json';
const OUT = new URL('../data/rr-blocklist.json', import.meta.url).pathname;
try {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const repos = await res.json();
  if (!Array.isArray(repos) || !repos.length) throw new Error('not a non-empty list');
  if (repos.some(r => !r.repo)) throw new Error('an entry has no repo');
  writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString(), source: SOURCE, repos }, null, 2) + '\n');
  console.log(`rr-blocklist: ${repos.length} repos`);
} catch (e) {
  if (existsSync(OUT)) console.error(`WARN could not refresh Repo Radar's blocklist (${e.message}); keeping the last copy`);
  else { console.error(`STOP: no copy of Repo Radar's blocklist and the fetch failed (${e.message})`); process.exit(1); }
}
