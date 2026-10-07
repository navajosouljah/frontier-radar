// x-scout.mjs - reads the X accounts in data/sources.json with the Mac's saved login (twitter-cli) and
// writes data/x/<today>.json for the cloud run, which cannot sign in to X. Runs on JJ's Mac only
// (scripts/scout.sh, launchd com.jjgilmore.frontier-radar-scout, 5:30 AM Mountain).
// The login values come from ~/.agent-reach/config.yaml and are never printed or written anywhere.
// Usage: node scripts/x-scout.mjs [--hours 36] [--max 25]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);
const ROOT = new URL('..', import.meta.url).pathname;

// Posts in the window, in the shape docs/DATA_FORMAT.md describes. A retweet links to the original.
export function postsFrom(json, handle, sinceMs) {
  if (!json || !json.ok || !Array.isArray(json.data)) return [];
  return json.data
    .map(p => {
      const author = p.author?.screenName || handle;
      return {
        id: String(p.id),
        url: `https://x.com/${author}/status/${p.id}`,
        time: new Date(p.createdAtISO || p.createdAt).toISOString().replace(/\.\d{3}Z$/, 'Z'),
        text: String(p.text || ''),
        likes: p.metrics?.likes ?? 0,
        links: (p.urls || []).map(u => u.expanded || u.url || u).filter(u => typeof u === 'string'),
        retweet_of: p.isRetweet ? author : null,
      };
    })
    .filter(p => Date.parse(p.time) >= sinceMs);
}
// The two flat keys agent-reach saves. Nothing else is read, and the values are never logged.
export function loginFrom(text) {
  const get = k => (String(text).match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?\\s*$`, 'm')) || [])[1];
  const token = get('twitter_auth_token'), ct0 = get('twitter_ct0');
  return token && ct0 ? { TWITTER_AUTH_TOKEN: token.trim(), TWITTER_CT0: ct0.trim() } : null;
}
export const accountsFrom = sources => Object.entries(sources.x || {})
  .filter(([tier, v]) => !tier.startsWith('_') && Array.isArray(v))
  .flatMap(([tier, handles]) => handles.map(handle => ({ handle, tier })));

async function main() {
  const argv = process.argv.slice(2);
  const opt = (n, d) => (argv.includes(n) ? +argv[argv.indexOf(n) + 1] : d);
  const hours = opt('--hours', 36), max = opt('--max', 25);
  const cfg = `${homedir()}/.agent-reach/config.yaml`;
  const login = existsSync(cfg) ? loginFrom(readFileSync(cfg, 'utf8')) : null;
  if (!login) { console.error(`x-scout: no X login in ${cfg} (run: agent-reach configure twitter-cookies)`); process.exit(1); }
  const sources = JSON.parse(readFileSync(`${ROOT}data/sources.json`, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const since = Date.now() - hours * 36e5;
  const accounts = [];
  for (const { handle, tier } of accountsFrom(sources)) {
    try {
      const { stdout } = await run('twitter', ['user-posts', handle, '-n', String(max), '--json'], { env: { ...process.env, ...login }, maxBuffer: 20 << 20, timeout: 60e3 });
      const start = stdout.indexOf('{');
      const posts = postsFrom(JSON.parse(stdout.slice(start)), handle, since);
      accounts.push({ handle, tier, posts });
      console.log(`${handle.padEnd(16)} ${tier.padEnd(8)} ${posts.length} posts in the last ${hours}h`);
    } catch (e) {
      accounts.push({ handle, tier, error: 'could not read' });
      console.log(`${handle.padEnd(16)} ${tier.padEnd(8)} could not read (${String(e.message).split('\n')[0].slice(0, 80)})`);
    }
  }
  mkdirSync(`${ROOT}data/x`, { recursive: true });
  const out = `${ROOT}data/x/${today}.json`;
  writeFileSync(out, JSON.stringify({ date: today, read_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), hours, accounts }, null, 2) + '\n');
  const ok = accounts.filter(a => !a.error).length;
  console.log(`wrote data/x/${today}.json: ${ok} of ${accounts.length} accounts read, ${accounts.reduce((n, a) => n + (a.posts?.length || 0), 0)} posts`);
  if (!ok) process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
