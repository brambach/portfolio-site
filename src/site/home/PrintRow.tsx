import type { ReactNode } from 'react';
import { Micro } from './Note';

export type Card = {
  id: string; serial: `00${1 | 2 | 3 | 4}`; name: string; kind: string; what: string; facts: string[];
  shots: { src: string; alt: string; width: number; height: number }[]; phones?: boolean; source?: string;
};

// The space sits outside the hidden span, where a line's end drops it, so the link looks the same.
export function Away({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}{' '}<span className="vh">(opens in a new tab)</span></a>;
}

// The print duplicates the h3 link, so it is hidden from screen readers and its pictures are named beside it.
export default function PrintRow({ card: { id, serial, name, kind, what, facts, shots, phones, source } }: { card: Card }) {
  const page = `/projects/${id}`;
  return <article className="work" id={id}>
    <p className="work__line" aria-hidden="true"><span className="serial">{`no. ${serial}`}</span><Micro className="micro--rule" text={`${name}, ${kind}`} /></p>
    <a className={`print${phones ? ' print--phones' : ''}`} href={page} tabIndex={-1} aria-hidden="true">
      <span className="print__frame">
        {shots.map(s => <img key={s.src} src={s.src} alt={s.alt} width={s.width} height={s.height} loading="lazy" decoding="async" />)}
      </span>
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
