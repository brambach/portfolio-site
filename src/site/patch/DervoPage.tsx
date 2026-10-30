import { useEffect, useRef } from 'react';
import { PROJECT_META } from '../meta';
import { DERVO, NAME } from '../cobalt/copy';
import DervoDemo from '../cobalt/DervoDemo';
import { A, ArrowLeft, ArrowRight } from '../cobalt/parts';
import { paintNewsprint } from './parts';
import { useEntrance } from '../useEntrance';
import '../motion.css';
import '../cobalt/cobalt.css';
import './patch.css';

/* Dervo's page in the pumpkin patch look: one calm column on newsprint, the app's Home rebuilt in HTML inside a comic
   panel, and the same honest account of where it stands. The demo keeps its cobalt styles, so the page loads both. */

export default function DervoPage() {
  const root = useRef<HTMLDivElement>(null);
  useEntrance(root, 'Patrick Hand SC');
  useEffect(() => {
    const unpaint = paintNewsprint(), title = document.title;
    document.title = PROJECT_META.find(p => p.path === '/projects/dervo')!.title;
    window.scrollTo(0, 0);
    return () => { unpaint(); document.title = title; };
  }, []);

  return <div className="pk" ref={root}>
    <div className="wrap project">
      <header className="top">
        <a href="/#work" className="back"><ArrowLeft />{DERVO.back}</a>
        <a href="/" className="letter name">{NAME}</a>
      </header>

      <main>
        <section className="p-head" aria-labelledby="pk-dervo" data-enter>
          <p className="caption">{DERVO.meta}</p>
          <h1 className="letter" id="pk-dervo">{DERVO.name}</h1>
          <p className="balloon">{DERVO.line}</p>
          <p className="lead">{DERVO.lead}</p>
        </section>

        <figure className="wide panel rise" data-enter>
          <div className="cb"><DervoDemo label={DERVO.demo} /></div>
          <figcaption className="label">{DERVO.demoCaption}</figcaption>
        </figure>

        <dl className="facts">
          {DERVO.facts.map(f => <div key={f.label}><dt className="caption">{f.label}</dt><dd>{f.value}</dd></div>)}
          <div><dt className="caption">source</dt><dd><A className="link" href={DERVO.source.href}>{DERVO.source.label}</A></dd></div>
        </dl>

        <section className="p-col" aria-labelledby="pk-does">
          <h2 className="caption-h" id="pk-does">{DERVO.does.title}</h2>
          <ul>{DERVO.does.items.map(([b, t]) => <li key={b}><strong>{b}</strong> {t}</li>)}</ul>
        </section>

        <section className="p-col" aria-labelledby="pk-call">
          <h2 className="caption-h" id="pk-call">{DERVO.call.title}</h2>
          <p>{DERVO.call.body}</p>
        </section>

        <figure className="wide panel">
          <img src={DERVO.shot.src} alt={DERVO.shot.alt} loading="lazy" decoding="async" width="1600" height="1000" />
          <figcaption className="label">{DERVO.shot.caption}</figcaption>
        </figure>

        <section className="p-col" aria-labelledby="pk-hood">
          <h2 className="caption-h" id="pk-hood">{DERVO.hood.title}</h2>
          <p>{DERVO.hood.body}</p>
        </section>

        <section className="p-col" aria-labelledby="pk-stands">
          <h2 className="caption-h" id="pk-stands">{DERVO.stands.title}</h2>
          {DERVO.stands.body.map(p => <p key={p}>{p}</p>)}
        </section>
      </main>

      <footer className="next-row">
        <a href="/#work" className="back"><ArrowLeft />all work</a>
        <A href={DERVO.next.href} className="next"><span className="label">{DERVO.next.label}</span><span className="letter">{DERVO.next.name}</span><ArrowRight size={16} /></A>
      </footer>
    </div>
  </div>;
}
