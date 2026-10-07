// checks.mjs - the content rules (spec section 5). Each function returns a list of plain-English problems.
import { words, hasDash, isHttps } from './lib/text.mjs';
import { independentCount } from './rank.mjs';
import { repoOf, codeHost, ghRepo } from './gatefor.mjs';

export const CATEGORIES = { model: 'Model', feature: 'Feature', pricing: 'Pricing & plans', apps: 'Apps & integrations', policy: 'Policy, safety & outages' };
export const KINDS = ['official', 'press', 'expert', 'community'];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/;

function sourceProblems(sources, w) {
  if (!Array.isArray(sources) || !sources.length) return [`${w}: needs at least one source`];
  const out = [];
  for (const s of sources) {
    if (!isHttps(s.url)) out.push(`${w}: source link must be https (${s.url})`);
    if (!s.outlet) out.push(`${w}: source ${s.url} has no outlet name`);
  }
  return out;
}

export function itemProblems(it, aiIds, date) {
  const w = `item ${it.id || '(no id)'}`;
  const out = [];
  if (!/^[a-z0-9-]+$/.test(it.id || '')) out.push(`${w}: id must be lowercase letters, digits and hyphens`);
  if (!aiIds.includes(it.ai)) out.push(`${w}: unknown ai "${it.ai}"`);
  if (!CATEGORIES[it.category]) out.push(`${w}: unknown category "${it.category}"`);
  if (!it.headline || it.headline.length > 120) out.push(`${w}: headline missing or over 120 characters`);
  if (!it.summary || it.summary.length > 300) out.push(`${w}: summary missing or over 300 characters`);
  if (!ISO.test(it.published || '')) out.push(`${w}: published must look like 2026-10-07T08:00:00Z`);
  else if (it.published.slice(0, 10) > date) out.push(`${w}: published after the day it is filed under`);
  if (typeof it.rumor !== 'boolean') out.push(`${w}: rumor must be true or false`);
  out.push(...sourceProblems(it.sources, w));
  for (const s of it.sources || []) if (!KINDS.includes(s.kind)) out.push(`${w}: source kind must be one of ${KINDS.join(', ')}`);
  const confirmed = (it.sources || []).some(s => s.kind === 'official') || independentCount(it) >= 2;
  if (it.rumor === false && !confirmed) out.push(`${w}: not confirmed (no official source and fewer than 2 independent outlets): mark it rumor true`);
  for (const f of ['headline', 'summary', 'why']) if (hasDash(it[f])) out.push(`${w}: ${f} has an em or en dash`);
  return out;
}

export function dayProblems(day, aiIds) {
  const w = `day ${day.date}`;
  if (!Array.isArray(day.items)) return [`${w}: items must be a list`];
  const out = [];
  const ids = new Set();
  for (const it of day.items) {
    if (ids.has(it.id)) out.push(`${w}: two items share id ${it.id}`);
    ids.add(it.id);
    out.push(...itemProblems(it, aiIds, day.date));
  }
  const top = day.items.find(it => it.id === day.top);
  if (day.top && !top) out.push(`${w}: top "${day.top}" is not one of the items`);
  if (top?.rumor) out.push(`${w}: the top story can never be a rumor`);
  if (top && !top.why) out.push(`${w}: the top story needs a "why it matters" (why)`);
  return out;
}

export function quoteProblems(q, fileDate, aiIds) {
  const w = `quote by ${q.person || '(no name)'}`;
  const out = [];
  for (const f of ['person', 'role', 'outlet', 'quote']) if (!q[f]) out.push(`${w}: missing ${f}`);
  if (words(q.quote) > 25) out.push(`${w}: quote is ${words(q.quote)} words, the limit is 25`);
  if (!isHttps(q.url)) out.push(`${w}: link must be https`);
  if (!['impressed', 'skeptical', 'other'].includes(q.stance)) out.push(`${w}: stance must be impressed, skeptical or other`);
  if (!aiIds.includes(q.ai)) out.push(`${w}: unknown ai "${q.ai}"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.said || '') || q.said > fileDate) out.push(`${w}: said must be a date on or before ${fileDate}`);
  if (hasDash(q.quote)) out.push(`${w}: has an em or en dash (write " - ")`);
  return out;
}

// A project is `kind: "repo"` (code people install: a GitHub repo, gated) or `kind: "app"` (a hosted
// product, not on a code host). Code on any other host cannot be gated, so it is refused.
export function projectProblems(p, aiIds, gateFor) {
  const w = `project ${p.name || '(no name)'}`;
  const out = [];
  for (const f of ['name', 'oneliner', 'why']) if (!p[f]) out.push(`${w}: missing ${f}`);
  if (!aiIds.includes(p.ai)) out.push(`${w}: unknown ai "${p.ai}"`);
  if (!isHttps(p.url)) out.push(`${w}: link must be https`);
  out.push(...sourceProblems(p.sources, w));
  if (!['repo', 'app'].includes(p.kind)) out.push(`${w}: kind must be repo or app`);
  const hostOf = codeHost(p.url);
  const linked = ghRepo(p.url);
  const repo = repoOf(p);
  if (hostOf && hostOf !== 'github.com') out.push(`${w}: ${hostOf} is a code host the gate cannot check; only GitHub repos can be listed as code`);
  else if (p.kind === 'app' && hostOf) out.push(`${w}: an app may not live on a code host (${hostOf}); if it is code, list it as kind repo`);
  if (p.kind === 'repo') {
    // The link readers click is the repo the gate cleared, nothing else.
    if (!linked) out.push(`${w}: a code project's url must be its GitHub page (https://github.com/owner/name)`);
    else if (p.repo && p.repo.toLowerCase() !== linked.toLowerCase()) out.push(`${w}: repo "${p.repo}" does not match the url (${linked})`);
  }
  if (repo) { const g = gateFor(repo); if (!g.ok) out.push(`${w}: ${repo} is not cleared by the security gate (${g.why})`); }
  if (p.shot) {
    if (!p.shot.src || !p.shot.alt) out.push(`${w}: a picture needs src and alt`);
    else if (!(isHttps(p.shot.src) || /^(?!\/|\.\.)(?!.*\.\.)[\w./-]+\.(png|jpe?g|webp|gif)$/i.test(p.shot.src))) out.push(`${w}: a picture must be an https link or a local image path inside the site`);
  }
  for (const f of ['name', 'oneliner', 'why']) if (hasDash(p[f])) out.push(`${w}: ${f} has an em or en dash`);
  return out;
}
