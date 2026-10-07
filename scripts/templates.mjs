// templates.mjs - the HTML for every Frontier Radar page, matching docs/mockup-approved-2026-10-05.html.
import { esc, inline, human, dShort, dLong } from './lib/text.mjs';
import { CATEGORIES } from './checks.mjs';

export const FOOTER_LINE = 'Frontier Radar is independent and not affiliated with Anthropic, SpaceXAI, Google, OpenAI or TypeSafe AI.';

const NAV = ais => [['today', 'Today', 'index.html'], ...ais.map(a => [a.id, a.name, `ai/${a.id}.html`]),
  ['experts', 'What experts say', 'experts.html'], ['top20', 'Top 20 projects', 'top20.html'], ['courses', 'Courses', 'courses.html']];

export function shell({ title, depth, active, updated, edition, archived, ais, body }) {
  const up = '../'.repeat(depth);
  const nav = NAV(ais).map(([id, label, href]) => `<a class="tab${id === active ? ' on' : ''}" href="${up}${href}">${esc(label)}</a>`).join('');
  const stale = archived
    ? `<div class="stale">Archived edition from ${esc(dLong(edition))}. <a href="${up}index.html">See today</a></div>`
    : `<div class="stale" id="stale" hidden>Not updated today. You are reading the ${esc(dLong(edition))} edition.</div>`;
  const check = archived ? '' : `<script>(function(){var u=Date.parse(document.body.dataset.updated);if(!(Date.now()-u<30*36e5))document.getElementById('stale').hidden=false;})();</script>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Frontier Radar</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}assets/site.css"></head>
<body data-updated="${esc(updated)}">
<div class="wrap"><div class="site">
<div class="top"><a class="brand" href="${up}index.html">Frontier<span>Radar</span></a>
<div class="stamp">${esc(dLong(edition))} &middot; <a href="${up}archive.html">Archive</a></div></div>
${stale}
<nav>${nav}</nav>
<main class="page on">${body}</main>
<footer>${FOOTER_LINE} Every item links to its source. <a href="${up}corrections.html">Corrections</a> &middot; <a href="${up}archive.html">Archive</a></footer>
</div></div>
${check}
</body></html>
`;
}

export const tagEl = a => `<span class="ai" style="background:${esc(a.color)}">${esc(a.name)}</span>`;
const tag = (ais, id) => tagEl(ais.find(a => a.id === id) || { name: id, color: '#555' });
const rumor = it => (it.rumor ? '<span class="rumor">Rumor</span>' : '');
const srcMeta = it => `${it.sources.some(s => s.kind === 'official') ? 'Official' : esc(it.sources[0].outlet)}${it.sources.length > 1 ? ` + ${it.sources.length - 1} more` : ''}`;
const firstLink = it => `<a href="${esc(it.sources[0].url)}">Source</a>`;
const corrected = (it, corrections) => {
  const c = corrections.find(x => x.item === it.id);
  return c ? `<div class="corrected"><b>Corrected ${esc(dShort(c.date))}:</b> ${inline(c.note)}</div>` : '';
};

export function todayBody({ ais, date, ranked, experts, top20, courses, corrections, up }) {
  const t = ranked.top;
  const lead = t
    ? `<div class="lead"><div class="kicker">Top story</div>${tag(ais, t.ai)}<h2>${inline(t.headline)}</h2>
<p class="why"><b>Why it matters:</b> ${inline(t.why || t.summary)}</p>
<div class="meta">${srcMeta(t)} &middot; ${esc(dShort(t.published))} &middot; ${firstLink(t)}</div>${corrected(t, corrections)}</div>`
    : '<div class="lead"><div class="kicker">Top story</div><p class="empty">No confirmed top story today. The items beside this are still worth a look.</p></div>';
  const trend = ranked.trending.length
    ? `<ol class="trend">${ranked.trending.map((it, i) => `<li><span class="n">${i + 1}</span><div>${tag(ais, it.ai)}${rumor(it)}<b>${inline(it.headline)}</b><span class="meta">${srcMeta(it)} &middot; ${esc(dShort(it.published))} &middot; ${firstLink(it)}</span>${corrected(it, corrections)}</div></li>`).join('')}</ol>`
    : '<p class="empty">No other news today.</p>';
  const q = (experts?.quotes || []).slice(0, 3).map(x => `<p>${tag(ais, x.ai)} "${inline(x.quote)}"</p><p class="who">${esc(x.person)} &middot; <a href="${esc(x.url)}">${esc(x.outlet)}</a></p>`).join('') || '<p class="empty">No expert takes yet.</p>';
  const p = (top20?.projects || []).slice().sort((a, b) => a.rank - b.rank).slice(0, 3).map(x => `<p><b>${x.rank}.</b> ${esc(x.name)}: ${inline(x.oneliner)}</p>`).join('') || '<p class="empty">The first Top 20 arrives on Friday.</p>';
  const fresh = courses && courses.date === date && courses.courses.length ? courses.courses[0] : null;
  const c = fresh ? `<p>${tag(ais, fresh.ai)} ${esc(fresh.name)}</p><p class="who">Vetted &middot; ${esc(fresh.price.display)} &middot; ${esc(fresh.format)}</p>` : '<p>Courses are refreshed on Fridays.</p>';
  return `<div class="hero">${lead}<div><h3 class="sec">Trending now</h3>${trend}</div></div>
<div class="teasers"><div class="box"><h4>What experts say</h4>${q}<a class="more" href="${up}experts.html">All expert takes</a></div>
<div class="box"><h4>Top 20 this week</h4>${p}<a class="more" href="${up}top20.html">See the full 20</a></div>
<div class="box"><h4>Courses</h4>${c}<a class="more" href="${up}courses.html">All courses</a></div></div>`;
}

export function aiBody({ ai, items, status, corrections, edition }) {
  const weekAgo = Date.parse(`${edition}T12:00:00Z`) - 7 * 864e5;
  const n = items.filter(it => Date.parse(it.published) >= weekAgo).length;
  const box = (label, v) => `<div><small>${label}</small>${v ? inline(v) : 'no data found'}</div>`;
  const srcs = (status?.sources || []).map(s => `<a href="${esc(s.url)}">${esc(s.outlet)}</a>`).join(', ');
  const filters = `<div class="filters"><button class="on" data-cat="all">All</button>${Object.entries(CATEGORIES).map(([k, v]) => `<button data-cat="${k}">${esc(v)}</button>`).join('')}</div>`;
  const tl = items.length
    ? `<div class="tl" style="--c:${esc(ai.color)}">${items.map(it => `<div class="item" data-cat="${esc(it.category)}"><span class="cat">${esc(CATEGORIES[it.category])}</span>${rumor(it)} <span class="meta">${esc(dShort(it.published))}</span><br><b>${inline(it.headline)}</b><br><span class="why">${inline(it.summary)}</span> ${firstLink(it)}${corrected(it, corrections)}</div>`).join('')}</div>
<script>document.querySelector('.filters').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;document.querySelectorAll('.filters button').forEach(function(x){x.classList.toggle('on',x===b)});document.querySelectorAll('.tl .item').forEach(function(i){i.hidden=b.dataset.cat!=='all'&&i.dataset.cat!==b.dataset.cat})});</script>`
    : `<p class="empty">No updates found for ${esc(ai.name)} yet.${ai.note ? ' ' + esc(ai.note) : ''}</p>`;
  return `${tagEl(ai)}<h2 class="aih">${esc(ai.name)}</h2><div class="meta">Made by ${esc(ai.maker)}${ai.note ? ' &middot; ' + esc(ai.note) : ''}</div>
<div class="status">${box('Flagship model', status?.flagship)}${box('Newest release', status?.newest && dShort(status.newest))}${box('Plans from', status?.plans_from)}<div><small>This week</small>${n} update${n === 1 ? '' : 's'}</div></div>
${srcs ? `<p class="status-src">Status from: ${srcs}</p>` : ''}${items.length ? filters : ''}${tl}`;
}

export function expertsBody({ ais, experts }) {
  if (!experts) return '<p class="empty">No expert takes yet.</p>';
  const d = experts.debate;
  const qb = x => `<blockquote><p>${tag(ais, x.ai)} "${inline(x.quote)}"</p><div class="who">${esc(x.person)} &middot; ${esc(x.role)} &middot; <a href="${esc(x.url)}">${esc(x.outlet)}</a> &middot; ${esc(dShort(x.said))}</div></blockquote>`;
  const inDebate = x => d && x.story === d.story && x.stance !== 'other';
  const col = st => experts.quotes.filter(x => inDebate(x) && x.stance === st).map(qb).join('') || '<p class="empty">No quotes found.</p>';
  const head = d ? `<div class="consensus"><div class="kicker">Biggest debate this week</div><h3>${inline(d.title)}</h3><p class="why"><b>Consensus:</b> ${inline(d.consensus)}</p></div>
<div class="vs"><div><div class="kicker">Impressed</div>${col('impressed')}</div><div><div class="kicker">Skeptical</div>${col('skeptical')}</div></div>` : '';
  const more = experts.quotes.filter(x => !inDebate(x)).map(qb).join('');
  return `${head}${more ? `<h3 class="sec">More takes</h3>${more}` : ''}`;
}

export function top20Body({ ais, top20, up }) {
  if (!top20 || !top20.projects.length) return '<p class="empty">The first Top 20 arrives on Friday.</p>';
  const pic = p => (p.shot
    ? `<img class="shot" src="${esc(/^https:/.test(p.shot.src) ? p.shot.src : up + p.shot.src)}" alt="${esc(p.shot.alt)}" loading="lazy">`
    : '<div class="shot">no real picture found</div>');
  const card = p => `<div class="box">${pic(p)}<span class="rank">${p.rank}</span>${tag(ais, p.ai)}<p><b><a href="${esc(p.url)}">${esc(p.name)}</a></b><br>${inline(p.oneliner)}</p><p class="meta">Why it's here: ${inline(p.why)}</p></div>`;
  return `<p class="meta">Refreshed every Friday (this list: ${esc(dLong(top20.date))}). Every code project passed the security check.</p><div class="projects">${top20.projects.slice().sort((a, b) => a.rank - b.rank).map(card).join('')}</div>`;
}

export function coursesBody({ ais, courses }) {
  const list = courses?.courses || [];
  const intro = `<p class="meta">Refreshed every Friday${courses ? ` (this list: ${esc(dLong(courses.date))})` : ''}. A course is listed only after it passes vetting: a real named provider, a working page with the price shown, independent reviews, and no income promises.</p>`;
  return intro + ais.map(a => {
    const rows = list.filter(c => c.ai === a.id).map(c => `<div class="course"><div><b><a href="${esc(c.url)}">${esc(c.name)}</a></b> <span class="vetted">Vetted</span><br><span class="who">${esc(c.provider)} &middot; ${esc(c.format)}${c.length ? ' &middot; ' + esc(c.length) : ''} &middot; You leave with: ${inline(c.outcome)}</span><br><span class="meta">Reviews: ${c.reviews.score} from ${human(c.reviews.count)} reviews on <a href="${esc(c.reviews.url)}">${esc(c.reviews.site)}</a></span></div><div class="price">${esc(c.price.display)}</div></div>`).join('');
    return `<div class="ai-group">${tagEl(a)}</div>${rows || `<p class="empty">No vetted courses yet for ${esc(a.name)}.${a.note ? ' ' + esc(a.note) : ''}</p>`}`;
  }).join('');
}

export const archiveBody = ({ days }) => `<h2 class="aih">Archive</h2><ul>${days.slice().reverse().map(d => `<li><a href="days/${d.date}/index.html">${esc(dLong(d.date))}</a></li>`).join('')}</ul>`;

export const correctionsBody = ({ corrections }) => `<h2 class="aih">Corrections</h2>${corrections.length
  ? `<ul>${corrections.slice().reverse().map(c => `<li><b>${esc(dShort(c.date))}:</b> ${inline(c.note)}</li>`).join('')}</ul>`
  : '<p class="empty">No corrections so far.</p>'}`;
