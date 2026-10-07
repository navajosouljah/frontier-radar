import { test } from 'node:test';
import assert from 'node:assert/strict';
import { course } from './test-site.mjs';
import { courseProblems, sameOwner } from './vetting.mjs';

const IDS = ['claude', 'grok', 'gemini', 'chatgpt', 'jev'];
const has = (c, re) => courseProblems(c, '2026-10-02', IDS).some(p => re.test(p));

test('a good course passes', () => assert.deepEqual(courseProblems(course(), '2026-10-02', IDS), []));
test('provider, links and price are required', () => {
  assert.ok(has(course({ provider: '' }), /missing provider/));
  assert.ok(has(course({ url: 'http://academy.example.com' }), /https/));
  assert.ok(has(course({ price: { display: 'Contact us' } }), /price must be shown/));
});
test('a free course says Free; a price of 0 with any other label is refused', () => {
  assert.deepEqual(courseProblems(course({ price: { amount: 0, currency: 'USD', display: 'Free' } }), '2026-10-02', IDS), []);
  assert.ok(has(course({ price: { amount: 0, currency: 'USD', display: '$0 today' } }), /price of 0 must say Free/));
});
test('reviews must be independent and enough of them', () => {
  assert.ok(has(course({ reviews: { score: 5, count: 3, site: 'R', url: 'https://r.example.net' } }), /at least 5/));
  assert.ok(has(course({ reviews: { score: 5, count: 50, site: 'Own', url: 'https://academy.example.com/reviews' } }), /does not run/));
  assert.deepEqual(courseProblems(course({ url: 'https://www.coursera.org/learn/x', reviews: { score: 4.3, count: 79, site: 'Coursera', url: 'https://www.coursera.org/learn/x#reviews' } }), '2026-10-02', IDS), [], 'a marketplace course with the marketplace reviews is independent of the provider');
  assert.ok(has(course({ provider_url: 'https://www.coursera.org/partners/x', url: 'https://www.coursera.org/learn/x', reviews: { score: 4.3, count: 79, site: 'Coursera', url: 'https://www.coursera.org/learn/x#reviews' } }), /does not run/), 'the provider page must be the provider\'s own site');
  assert.ok(has(course({ reviews: { score: 5, count: 50, site: 'Own', url: 'https://reviews.academy.example.com/x' } }), /does not run/), 'a subdomain of the provider is still the provider');
  assert.ok(has(course({ reviews: { score: 5, count: 50, site: 'Own', url: 'https://example.com/reviews' } }), /does not run/), 'the parent domain is the provider too');
  assert.equal(sameOwner('https://reviews.academy.example.co.uk/x', 'https://academy.example.co.uk'), true);
  assert.equal(sameOwner('https://trustpilot.com/review/x', 'https://academy.example.com'), false);
});
test('income promises and unchecked pages are out', () => {
  assert.ok(has(course({ outcome: 'Guaranteed six-figure income' }), /income or guaranteed/));
  assert.ok(has(course({ outcome: 'Earn $5k a month with agents' }), /income or guaranteed/));
  assert.ok(has(course({ outcome: 'Make money with Claude' }), /income or guaranteed/));
  assert.ok(has(course({ outcome: '$10,000 per month in 90 days' }), /income or guaranteed/));
  assert.ok(has(course({ claims_checked: false }), /read the course page/));
  assert.ok(has(course({ page_checked: '2026-09-01' }), /within 14 days/));
});
