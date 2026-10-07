// gatefor.mjs - is a code project cleared to appear? Same rule as Repo Radar's build.mjs gateFor:
// not blocklisted, a PASS verdict, advisory evidence on record, and a gate no older than 30 days.
// `allowStale` (archived Top 20 lists) keeps an old PASS but still refuses the rest.
const key = r => String(r || '').toLowerCase();
export const MAX_GATE_AGE_DAYS = 30;

export function makeGateFor(gateLog, blocklists, nowMs = Date.now(), { allowStale = false } = {}) {
  const blocked = blocklists.flat();
  return repo => {
    const b = blocked.find(x => key(x.repo) === key(repo));
    if (b) return { ok: false, why: `on the blocklist (${b.reason})` };
    const g = Object.values(gateLog).find(e => key(e.repo) === key(repo));
    if (!g) return { ok: false, why: 'never gated' };
    if (g.verdict !== 'PASS') return { ok: false, why: `gate verdict is ${g.verdict}` };
    const adv = g.checks?.advisories || {};
    if (!adv.source || adv.count == null || !adv.url) return { ok: false, why: 'PASS without advisory evidence' };
    const age = (nowMs - Date.parse(g.checked)) / 864e5;
    if (age > MAX_GATE_AGE_DAYS && !allowStale) return { ok: false, why: `gate is ${Math.round(age)} days old` };
    return { ok: true };
  };
}
export const blockedRepos = blocklists => new Set(blocklists.flat().map(b => key(b.repo)));
// The GitHub repo behind a project: its `repo` field, or a github.com link.
export const repoOf = p => p.repo || (String(p.url || '').match(/^https:\/\/github\.com\/([^/#?]+\/[^/#?]+)/) || [])[1] || null;
// Places code is downloaded from. Only GitHub can be gated; the rest are refused as code projects.
export const CODE_HOSTS = ['github.com', 'gitlab.com', 'codeberg.org', 'bitbucket.org', 'huggingface.co', 'npmjs.com', 'pypi.org', 'crates.io', 'sourceforge.net'];
export function codeHost(url) {
  try { const h = new URL(url).hostname.replace(/^www\./, '').toLowerCase(); return CODE_HOSTS.find(c => h === c || h.endsWith('.' + c)) || null; }
  catch { return null; }
}
