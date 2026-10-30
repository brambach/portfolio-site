import { useEffect, useRef } from 'react';
import { NAME } from './copy';
import { A, ArrowLeft, ArrowRight, paintPaper } from './parts';
import { STORIES, type StoryId } from '../stories';
import { storyTitle } from '../meta';
import { useEntrance } from '../useEntrance';
import '../motion.css';
import './cobalt.css';

/* A product's page in the cobalt look, laid out like Dervo's: one calm column, the live product's picture that the
   home page's picture grows into, and an honest account of where it stands. */

export default function StoryPage({ id }: { id: StoryId }) {
  const s = STORIES[id], root = useRef<HTMLDivElement>(null);
  useEntrance(root, 'Alegreya');
  useEffect(() => {
    const unpaint = paintPaper(), title = document.title;
    document.title = storyTitle(s);
    window.scrollTo(0, 0);
    return () => { unpaint(); document.title = title; };
  }, [s]);

  return <div className="cb" ref={root}>
    <div className="wrap project">
      <header className="top">
        <a href="/#work" className="back"><ArrowLeft />All work</a>
        <a href="/" className="serif name">{NAME}</a>
      </header>

      <main>
        <section className="p-head" aria-labelledby={`c-${id}`} data-enter>
          <p className="mono">{s.meta}</p>
          <h1 className="serif" id={`c-${id}`}>{s.name}</h1>
          <p className="serif-i line">{s.line}</p>
          <p className="lead">{s.lead}</p>
          <A href={s.live.href} className="live link">{s.live.label}<ArrowRight /></A>
        </section>

        <figure className="wide rise" data-enter data-handover={id}>
          <picture>{s.hero.phone && <source media="(max-width: 560px)" srcSet={s.hero.phone.src} width={s.hero.phone.w} height={s.hero.phone.h} />}<img src={s.hero.src} alt={s.hero.alt} decoding="async" width={s.hero.w} height={s.hero.h} /></picture>
          <figcaption className="mono">{s.hero.caption}</figcaption>
        </figure>

        <dl className="facts">
          {s.facts.map(f => <div key={f.label}><dt className="mono">{f.label}</dt><dd>{f.value}</dd></div>)}
          <div><dt className="mono">source</dt><dd><A className="link" href={s.source.href}>{s.source.label}</A></dd></div>
        </dl>

        <section className="p-col" aria-labelledby={`c-${id}-does`}>
          <h2 className="serif" id={`c-${id}-does`}>{s.does.title}</h2>
          <ul>{s.does.items.map(([b, t]) => <li key={b}><strong>{b}</strong> {t}</li>)}</ul>
        </section>

        <section className="p-col" aria-labelledby={`c-${id}-call`}>
          <h2 className="serif" id={`c-${id}-call`}>{s.call.title}</h2>
          <p>{s.call.body}</p>
        </section>

        <figure className="wide">
          <img src={s.shot.src} alt={s.shot.alt} loading="lazy" decoding="async" width={s.shot.w} height={s.shot.h} />
          <figcaption className="mono">{s.shot.caption}</figcaption>
        </figure>

        <section className="p-col" aria-labelledby={`c-${id}-stands`}>
          <h2 className="serif" id={`c-${id}-stands`}>{s.stands.title}</h2>
          {s.stands.body.map(p => <p key={p}>{p}</p>)}
        </section>
      </main>

      <footer className="next-row">
        <a href="/#work" className="back mono"><ArrowLeft />all work</a>
        <A href={s.live.href} className="next"><span className="mono">live</span><span className="serif">{s.name}</span><ArrowRight size={16} /></A>
      </footer>
    </div>
  </div>;
}
