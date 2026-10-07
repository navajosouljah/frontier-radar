import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, inline, human, words, hasDash, host, isHttps, dShort, dLong } from './lib/text.mjs';

test('esc escapes html', () => {
  assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  assert.equal(esc(undefined), '');
});
test('inline escapes hostile text and only links https', () => {
  const out = inline('<script>x</script> **b** [bad](javascript:alert(1)) [ok](https://ok.com/a?b=1&c=2)');
  assert.ok(!out.includes('<script'));
  assert.ok(!out.includes('href="javascript'));
  assert.ok(out.includes('<b>b</b>'));
  assert.ok(out.includes('<a href="https://ok.com/a?b=1&amp;c=2">ok</a>'));
});
test('human numbers', () => {
  assert.equal(human(950), '950');
  assert.equal(human(85000), '85K');
  assert.equal(human(1234), '1.2K');
  assert.equal(human(1200000), '1.2M');
});
test('words, dashes, hosts, https', () => {
  assert.equal(words('  one two  three '), 3);
  assert.equal(hasDash('a — b'), true);
  assert.equal(hasDash('a - b'), false);
  assert.equal(host('https://www.TechCrunch.com/x'), 'techcrunch.com');
  assert.equal(host('not a url'), null);
  assert.equal(isHttps('https://a.com'), true);
  assert.equal(isHttps('http://a.com'), false);
  assert.equal(isHttps(undefined), false);
});
test('dates', () => {
  assert.equal(dShort('2026-10-07T08:00:00Z'), 'Oct 7');
  assert.equal(dLong('2026-10-07'), 'Wednesday, Oct 7, 2026');
});
