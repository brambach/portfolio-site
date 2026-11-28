import type { CSSProperties } from 'react';

/* 404 set in dots, for the not-found pages (NotFound.tsx, block/NotFound.tsx). */

/** 4, 0, 4 on a grid of 3 by 5 dots each, with a column between them. */
const DIGITS = ['101', '101', '111', '001', '001'].map((four, y) => [four, ['111', '101', '101', '101', '111'][y], four].join('0'));

/** The number as an svg of dots. The zero's dots carry `zero` as their class, and each dot its place on the diagonal
 *  as --k, so a page can stagger them in. */
export function DotNumber({ className, zero }: { className: string; zero: string }) {
  const cols = DIGITS[0].length, rows = DIGITS.length;
  return <svg className={className} viewBox={`0 0 ${cols} ${rows}`} aria-hidden="true">
    {DIGITS.flatMap((row, y) => [...row].map((on, x) => on === '1'
      ? <circle key={`${x}-${y}`} className={x >= 4 && x <= 6 ? zero : undefined} cx={x + 0.5} cy={y + 0.5} r={0.36} style={{ '--k': x + y } as CSSProperties} />
      : null))}
  </svg>;
}
