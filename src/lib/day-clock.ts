/**
 * The scroll is one day; this names it. Maps overall scroll progress to a
 * clock time winding from first light at the top of the page to just
 * before midnight at the trail's end.
 */

const DAWN_MIN = 5 * 60 + 47; // 5:47 am
const LATE_MIN = 23 * 60 + 58; // 11:58 pm

export function dayClockLabel(t: number): string {
  const f = Math.min(1, Math.max(0, t));
  const m = Math.round(DAWN_MIN + (LATE_MIN - DAWN_MIN) * f);
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${h24 < 12 ? 'am' : 'pm'}`;
}
