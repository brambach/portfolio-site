import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react';

/* E's links. No arrow glyphs and no buttons: the name sits over a row of dots that fill in, gold, from the left
   when you point at it, and a small mark made of dots says where it goes. Four dots in a row are a page on this
   site, and on hover they grow a head and point right. Four on a diagonal leave the site, and point up and right.
   Those also say so to screen readers, and the pointer reads "New tab" over them. */

/** The dots of a mark, on a 5 by 5 grid: the body, which is always there, and the head it grows on hover, which
 *  makes it a pixel arrow. */
const MARK = {
  page: { body: [[0, 2], [1, 2], [2, 2], [3, 2]], head: [[4, 2], [3, 1], [3, 3], [2, 0], [2, 4]] },
  back: { body: [[1, 2], [2, 2], [3, 2], [4, 2]], head: [[0, 2], [1, 1], [1, 3], [2, 0], [2, 4]] },
  away: { body: [[0, 4], [1, 3], [2, 2], [3, 1]], head: [[4, 0], [3, 0], [4, 1], [2, 0], [4, 2]] },
} as const;

export type Way = keyof typeof MARK;
export function Mark({ way }: { way: Way }) {
  const m = MARK[way];
  return <span className="e-mark" aria-hidden="true">
    {m.body.map(([x, y], k) => <i key={`b${k}`} style={{ '--x': x, '--y': y, '--k': k } as CSSProperties} />)}
    {m.head.map(([x, y], k) => <i key={`h${k}`} className="is-head" style={{ '--x': x, '--y': y, '--k': 4 + k } as CSSProperties} />)}
  </span>;
}

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & { away?: boolean; back?: boolean; children: ReactNode; cursor?: string };

/** A link in E's language. `away` opens it in a new tab and says so. `back` points the other way. */
export function ELink({ away = false, back = false, children, className = '', cursor, ...rest }: Props) {
  const way: Way = away ? 'away' : back ? 'back' : 'page';
  return <a className={`e-go is-${way}${className ? ` ${className}` : ''}`} {...(away ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    data-cursor={cursor ?? (away ? 'New tab' : 'Open')} {...rest}>
    <Mark way={way} />
    <span className="e-go__text">{children}</span>
    {away && <span className="e-sr"> (opens in a new tab)</span>}
  </a>;
}

/** Port's ring to hold, drawn in dots, for the small tile on the index. */
export function DotRing({ size = 72 }: { size?: number }) {
  const r = size * 0.4, n = 22;
  return <svg className="e-dotring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
    {Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2;
      return <circle key={k} cx={size / 2 + Math.cos(a) * r} cy={size / 2 + Math.sin(a) * r} r={size * 0.045} />;
    })}
  </svg>;
}

/** The pointer's four dots and its word (chrome.ts moves them). */
export function ECursor() {
  return <div className="e-cursor" aria-hidden="true" data-cursor-el>
    {[0, 1, 2, 3].map(k => <span key={k} className="e-cursor__d" style={{ '--k': k } as CSSProperties}><i /></span>)}
    <span className="e-cursor__label" data-cursor-label><span className="e-cursor__word" /></span>
  </div>;
}
