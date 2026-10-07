import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goodSite, writeSite } from './test-site.mjs';
import { loadSite, latest, asOf } from './lib/data.mjs';

test('loadSite reads every data file', () => {
  const s = loadSite(writeSite(goodSite()));
  assert.deepEqual(s.aiIds, ['claude', 'grok', 'gemini', 'chatgpt', 'jev']);
  assert.equal(s.days.length, 1);
  assert.equal(s.days[0].items.length, 2);
  assert.equal(s.status.claude.flagship, 'Fixture Model');
  assert.equal(s.status.jev, null);
  assert.equal(s.experts[0].date, '2026-10-07');
  assert.equal(s.courses[0].courses.length, 1);
  assert.equal(s.blocklists.length, 2);
  assert.equal(s.blocklists[1][0].repo, 'fixture/blocked', 'the Repo Radar copy is read as a plain list');
  assert.equal(s.rrBlocklist.fetched, '2026-10-07T11:00:00Z');
});
test('a missing Repo Radar copy reads as empty, not a crash', () => {
  const site = goodSite();
  delete site['data/rr-blocklist.json'];
  const s = loadSite(writeSite(site));
  assert.deepEqual(s.blocklists[1], []);
  assert.equal(s.rrBlocklist, null);
});
test('latest and asOf', () => {
  const list = [{ date: '2026-10-02' }, { date: '2026-10-09' }];
  assert.equal(latest(list).date, '2026-10-09');
  assert.equal(latest([]), null);
  assert.equal(asOf(list, '2026-10-05').date, '2026-10-02');
  assert.equal(asOf(list, '2026-10-01'), null);
});
