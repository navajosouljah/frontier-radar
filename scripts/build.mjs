// build.mjs - Frontier Radar: data in, pages out. Zero dependencies. Never hand-edit a generated page.
// A page the build did not write this time (a day with no data, an AI that no longer exists, a leftover
// root page) is deleted, so the live site is exactly what the data says. assets/ is never touched.
// Usage: node scripts/build.mjs [--root DIR]
import { writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadSite, latest, asOf } from './lib/data.mjs';
import { rankDay, mergeStories } from './rank.mjs';
import * as T from './templates.mjs';

export function build(root, { now = new Date().toISOString() } = {}) {
  const s = loadSite(root);
  if (!s.days.length) throw new Error('no days in data/days: nothing to build');
  const today = latest(s.days);
  const written = [];
  const page = (path, depth, title, active, body, edition = today.date, archived = false) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), T.shell({ title, depth, active, updated: now, edition, archived, ais: s.ais, body }));
    written.push(path);
  };
  const front = (day, up) => T.todayBody({ ais: s.ais, date: day.date, ranked: rankDay(day),
    experts: asOf(s.experts, day.date), top20: asOf(s.top20, day.date), courses: asOf(s.courses, day.date),
    corrections: s.corrections, up });

  page('index.html', 0, 'Today in AI', 'today', front(today, ''));
  for (const day of s.days) page(`days/${day.date}/index.html`, 2, `AI news, ${day.date}`, 'today', front(day, '../../'), day.date, day !== today);

  const allItems = s.days.flatMap(d => mergeStories(d.items)).sort((a, b) => b.published.localeCompare(a.published));
  for (const ai of s.ais) {
    page(`ai/${ai.id}.html`, 1, ai.name, ai.id, T.aiBody({ ai, items: allItems.filter(it => it.ai === ai.id),
      status: s.status[ai.id], corrections: s.corrections, edition: today.date }));
  }
  page('experts.html', 0, 'What experts say', 'experts', T.expertsBody({ ais: s.ais, experts: latest(s.experts) }));
  page('top20.html', 0, 'Top 20 projects', 'top20', T.top20Body({ ais: s.ais, top20: latest(s.top20), up: '' }));
  page('courses.html', 0, 'Courses', 'courses', T.coursesBody({ ais: s.ais, courses: latest(s.courses) }));
  page('archive.html', 0, 'Archive', '', T.archiveBody({ days: s.days }));
  page('corrections.html', 0, 'Corrections', '', T.correctionsBody({ corrections: s.corrections }));
  removeOrphans(root, new Set(written));
  return written;
}

// Pages this build did not write: root *.html, ai/*.html and days/*/ folders.
function removeOrphans(root, keep) {
  const list = dir => (existsSync(join(root, dir)) ? readdirSync(join(root, dir)) : []);
  for (const f of list('')) if (f.endsWith('.html') && !keep.has(f)) rmSync(join(root, f));
  for (const f of list('ai')) if (f.endsWith('.html') && !keep.has(`ai/${f}`)) rmSync(join(root, 'ai', f));
  for (const d of list('days')) {
    if (!statSync(join(root, 'days', d)).isDirectory()) continue;
    if (!keep.has(`days/${d}/index.html`)) rmSync(join(root, 'days', d), { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const root = argv.includes('--root') ? argv[argv.indexOf('--root') + 1] : new URL('..', import.meta.url).pathname;
  console.log(`built ${build(root).length} pages`);
}
