// text.mjs - small text helpers shared by build, checks and verify. Zero dependencies.
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Markup allowed inside data strings: **bold** and [a link](https://...). Anything else is escaped.
export const inline = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);

export function human(n) {
  if (n < 1000) return String(n);
  const [v, u] = n < 1e6 ? [n / 1e3, 'K'] : [n / 1e6, 'M'];
  return `${v.toFixed(1).replace(/\.0$/, '')}${u}`;
}
export const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
export const hasDash = s => /[—–]/.test(String(s || ''));
export function host(u) { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } }
export function isHttps(u) { try { return new URL(u).protocol === 'https:'; } catch { return false; } }

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function dShort(iso) { const [, m, d] = String(iso).slice(0, 10).split('-').map(Number); return `${MON[m - 1]} ${d}`; }
export function dLong(iso) {
  const day = String(iso).slice(0, 10);
  const [y] = day.split('-');
  return `${DAY[new Date(`${day}T12:00:00Z`).getUTCDay()]}, ${dShort(day)}, ${y}`;
}
