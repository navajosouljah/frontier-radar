// vetting.mjs - a course is listed only if it passes docs/COURSE_VETTING.md. Popularity never qualifies it.
import { isHttps, hasDash, ownerOf } from './lib/text.mjs';

export const HYPE = /guarantee|passive income|\bincome\b|make money|earn \$|\$\s?\d[\d,.]*\s?k?\s*(a|per|\/|each|every)\s*(month|week|day|year|mo\b)|six[- ]figure|\b[5-9][- ]figure|replace your (income|salary)|get rich|quit your job|financial freedom/i;
export const MIN_REVIEWS = 5;
export const MAX_CHECK_AGE_DAYS = 14;

export { ownerOf };
export const sameOwner = (a, b) => !!ownerOf(a) && ownerOf(a) === ownerOf(b);

export function courseProblems(c, fileDate, aiIds) {
  const w = `course ${c.name || '(no name)'}`;
  const out = [];
  for (const f of ['name', 'provider', 'format', 'outcome']) if (!c[f]) out.push(`${w}: missing ${f}`);
  if (!aiIds.includes(c.ai)) out.push(`${w}: unknown ai "${c.ai}"`);
  if (!isHttps(c.url) || !isHttps(c.provider_url)) out.push(`${w}: course page and provider page must be https links`);
  if (!c.price || typeof c.price.amount !== 'number' || c.price.amount < 0 || !c.price.display) out.push(`${w}: the price must be shown (amount and display)`);
  else if (c.price.amount === 0 && !/^free$/i.test(c.price.display.trim())) out.push(`${w}: a price of 0 must say Free, nothing else`);
  const r = c.reviews || {};
  if (!(r.count >= MIN_REVIEWS) || typeof r.score !== 'number' || !isHttps(r.url) || !r.site) out.push(`${w}: needs independent reviews (at least ${MIN_REVIEWS}, with score, site and link)`);
  else if (sameOwner(r.url, c.url) || sameOwner(r.url, c.provider_url)) out.push(`${w}: reviews must be on a site the provider does not run`);
  const age = (Date.parse(fileDate) - Date.parse(c.page_checked || '')) / 864e5;
  if (!(age >= 0 && age <= MAX_CHECK_AGE_DAYS)) out.push(`${w}: the course page must have been checked within ${MAX_CHECK_AGE_DAYS} days of ${fileDate}`);
  if (c.claims_checked !== true) out.push(`${w}: claims_checked must be true (the run read the course page and found no income or guaranteed-results promise)`);
  const text = [c.name, c.outcome, c.format, c.length].filter(Boolean).join(' ');
  if (HYPE.test(text)) out.push(`${w}: makes an income or guaranteed-results promise`);
  if (hasDash(text)) out.push(`${w}: has an em or en dash`);
  return out;
}
