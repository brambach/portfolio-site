import { useEffect } from 'react';
import { PROJECT_META } from '../meta';
import { DERVO, NAME } from './copy';
import DervoDemo from './DervoDemo';
import { A, ArrowLeft, ArrowRight, paintPaper } from './parts';
import './cobalt.css';

/* Dervo's page in the cobalt look: one calm column, the app's Home rebuilt in HTML rising in under the headline, and
   the catalog's honest account of where it stands. */

export default function DervoPage() {
  useEffect(() => {
    const unpaint = paintPaper(), title = document.title;
    document.title = PROJECT_META.find(p => p.path === '/projects/dervo')!.title;
    window.scrollTo(0, 0);
    return () => { unpaint(); document.title = title; };
  }, []);

  return <div className="cb">
    <div className="wrap project">
      <header className="top">
        <a href="/#work" className="back"><ArrowLeft />{DERVO.back}</a>
        <a href="/" className="serif name">{NAME}</a>
      </header>

      <main>
        <section className="p-head" aria-labelledby="c-dervo">
          <p className="mono">{DERVO.meta}</p>
          <h1 className="serif" id="c-dervo">{DERVO.name}</h1>
          <p className="serif-i line">{DERVO.line}</p>
          <p className="lead">{DERVO.lead}</p>
        </section>

        <figure className="wide rise">
          <DervoDemo label={DERVO.demo} />
          <figcaption className="mono">{DERVO.demoCaption}</figcaption>
        </figure>

        <dl className="facts">
          {DERVO.facts.map(f => <div key={f.label}><dt className="mono">{f.label}</dt><dd>{f.value}</dd></div>)}
          <div><dt className="mono">source</dt><dd><A className="link" href={DERVO.source.href}>{DERVO.source.label}</A></dd></div>
        </dl>

        <section className="p-col" aria-labelledby="c-does">
          <h2 className="serif" id="c-does">{DERVO.does.title}</h2>
          <ul>{DERVO.does.items.map(([b, t]) => <li key={b}><strong>{b}</strong> {t}</li>)}</ul>
        </section>

        <section className="p-col" aria-labelledby="c-call">
          <h2 className="serif" id="c-call">{DERVO.call.title}</h2>
          <p>{DERVO.call.body}</p>
        </section>

        <figure className="wide">
          <img src={DERVO.shot.src} alt={DERVO.shot.alt} loading="lazy" decoding="async" width="1600" height="1000" />
          <figcaption className="mono">{DERVO.shot.caption}</figcaption>
        </figure>

        <section className="p-col" aria-labelledby="c-hood">
          <h2 className="serif" id="c-hood">{DERVO.hood.title}</h2>
          <p>{DERVO.hood.body}</p>
        </section>

        <section className="p-col" aria-labelledby="c-stands">
          <h2 className="serif" id="c-stands">{DERVO.stands.title}</h2>
          {DERVO.stands.body.map(p => <p key={p}>{p}</p>)}
        </section>
      </main>

      <footer className="next-row">
        <a href="/#work" className="back mono"><ArrowLeft />all work</a>
        <A href={DERVO.next.href} className="next"><span className="mono">{DERVO.next.label}</span><span className="serif">{DERVO.next.name}</span><ArrowRight size={16} /></A>
      </footer>
    </div>
  </div>;
}
