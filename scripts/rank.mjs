// rank.mjs - what trends. A script, not a judgment call, so it is the same every day.
// score = 2 per independent outlet + 4 if any source is official + up to 4 for freshness (0 after 24h).
import { host } from './lib/text.mjs';

// One story, one item: items sharing a `story` key merge (sources joined, earliest time kept).
export function mergeStories(items) {
  const by = new Map();
  for (const it of items) {
    const k = it.story || it.id;
    const prev = by.get(k);
    if (!prev) { by.set(k, { ...it, sources: [...(it.sources || [])] }); continue; }
    for (const s of it.sources || []) if (!prev.sources.some(p => p.url === s.url)) prev.sources.push(s);
    if (it.published < prev.published) prev.published = it.published;
    if (prev.rumor && it.rumor === false) prev.rumor = false;
    if (!prev.why && it.why) prev.why = it.why;
  }
  return [...by.values()];
}
// Distinct outlets (by web address), not counting sources marked as repeating another report.
export const independentCount = it => new Set((it.sources || []).filter(s => !s.repeats).map(s => host(s.url)).filter(Boolean)).size;

export function score(it, nowMs) {
  const official = (it.sources || []).some(s => s.kind === 'official') ? 4 : 0;
  const ageH = Math.max(0, (nowMs - Date.parse(it.published)) / 36e5);
  return independentCount(it) * 2 + official + Math.max(0, 24 - ageH) / 6;
}
export const dayNow = date => Date.parse(`${date}T12:00:00Z`);

export function rankDay(day) {
  const now = dayNow(day.date);
  const all = mergeStories(day.items).map(it => ({ ...it, score: score(it, now) }))
    .sort((a, b) => b.score - a.score || b.published.localeCompare(a.published) || a.id.localeCompare(b.id));
  const top = all.find(it => it.id === day.top && !it.rumor) || all.find(it => !it.rumor) || null;
  return { top, trending: all.filter(it => it !== top).slice(0, 10), all };
}
