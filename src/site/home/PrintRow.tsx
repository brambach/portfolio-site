import type { CSSProperties, ReactNode } from 'react';
import { useWatch } from './motion/watch';
import { Micro } from './Note';

export type Card = {
  id: string; serial: `00${1 | 2 | 3 | 4}`; name: string; kind: string; what: string; facts: string[];
  shots: { src: string; alt: string; width: number; height: number }[]; phones?: boolean; source?: string;
};

// The space sits outside the hidden span, where a line's end drops it, so the link looks the same.
export function Away({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}{' '}<span className="vh">(opens in a new tab)</span></a>;
}

const f1 = (n: number) => String(Math.round(n * 10) / 10);
const f2 = (n: number) => String(Math.round(n * 100) / 100);

/** The numbering wheel's easing: n clicks from 0 to n, each holding on its digit, then moving 85% of the way to the
 *  next and easing onto it. The last click overshoots by 6% of a digit and settles back. */
function clicks(n: number) {
  const stops = ['0'];
  for (let k = 0; k < n; k++) {
    const t0 = k / n, span = 1 / n, v0 = k / n, v1 = (k + 1) / n;
    const at = (f: number, v: number) => stops.push(`${f2(v)} ${f1((t0 + span * f) * 100)}%`);
    at(.3, v0);
    if (k === n - 1) { at(.55, v0 + (v1 - v0) * .85); at(.68, v1 + .06 / n); at(.85, v1 - .015 / n); }
    else { at(.55, v0 + (v1 - v0) * .85); at(.7, v1); }
  }
  stops.push('1 100%');
  return `linear(${stops.join(', ')})`;
}

// The print duplicates the h3 link, so it is hidden from screen readers and its pictures are named beside it.
export default function PrintRow({ card: { id, serial, name, kind, what, facts, shots, phones, source } }: { card: Card }) {
  const page = `/projects/${id}`;
  const row = useWatch<HTMLElement>({ threshold: .12 });
  const n = Number(serial[2]);
  return <article ref={row} className="work" id={id}>
    <p className="work__line" aria-hidden="true" style={{ '--n': n, '--clicks': clicks(n) } as CSSProperties}>
      <span className="serial">{`no. ${serial}`}<span className="wheel"><span className="wheel__col" /></span></span>
      <Micro className="micro--rule" text={`${name}, ${kind}`} />
    </p>
    <a className={`print${phones ? ' print--phones' : ''}`} href={page} tabIndex={-1} aria-hidden="true">
      <span className="print__frame">
        {shots.map(s => <img key={s.src} src={s.src} alt={s.alt} width={s.width} height={s.height} loading="lazy" decoding="async" />)}
      </span>
      <svg className="print__rule"><rect width="100%" height="100%" pathLength="1" /></svg>
    </a>
    {shots.map(s => <span key={s.src} className="vh" role="img" aria-label={s.alt} />)}
    <div className="work__text">
      <h3><a href={page}>{name}</a></h3>
      <p className="work__kind">{kind}</p>
      <p className="work__what">{what}</p>
      <ul className="work__facts">{facts.map(f => <li key={f}>{f}</li>)}</ul>
      <p className="work__more">
        <a href={page}>the full story{' '}<span className="vh">about {name}</span></a>
        {source && <Away href={source}><span className="vh">{name}</span>{' '}source</Away>}
      </p>
    </div>
  </article>;
}
