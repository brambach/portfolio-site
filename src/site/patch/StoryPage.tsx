import { useEffect, useRef } from 'react';
import { NAME } from '../cobalt/copy';
import { A, ArrowLeft, ArrowRight } from '../cobalt/parts';
import { STORIES, type StoryId } from '../stories';
import { storyTitle } from '../meta';
import { paintNewsprint } from './parts';
import { useEntrance } from '../useEntrance';
import '../motion.css';
import './patch.css';

/* A product's page in the pumpkin patch look, laid out like Dervo's: the line in a balloon, the live product in a
   comic panel that the home page's picture grows into, and an honest account of where it stands. */

export default function StoryPage({ id }: { id: StoryId }) {
  const s = STORIES[id], root = useRef<HTMLDivElement>(null);
  useEntrance(root, 'Patrick Hand SC');
  useEffect(() => {
    const unpaint = paintNewsprint(), title = document.title;
    document.title = storyTitle(s);
    window.scrollTo(0, 0);
    return () => { unpaint(); document.title = title; };
  }, [s]);

  return <div className="pk" ref={root}>
    <div className="wrap project">
      <header className="top">
        <a href="/#work" className="back"><ArrowLeft />All work</a>
        <a href="/" className="letter name">{NAME}</a>
      </header>

      <main>
        <section className="p-head" aria-labelledby={`pk-${id}`} data-enter>
          <p className="caption">{s.meta}</p>
          <h1 className="letter" id={`pk-${id}`}>{s.name}</h1>
          <p className="balloon">{s.line}</p>
          <p className="lead">{s.lead}</p>
          <A href={s.live.href} className="hint live">{s.live.label}<ArrowRight /></A>
        </section>

        <figure className="wide panel rise" data-enter data-handover={id}>
          <picture>{s.hero.phone && <source media="(max-width: 560px)" srcSet={s.hero.phone.src} width={s.hero.phone.w} height={s.hero.phone.h} />}<img src={s.hero.src} alt={s.hero.alt} decoding="async" width={s.hero.w} height={s.hero.h} /></picture>
          <figcaption className="label">{s.hero.caption}</figcaption>
        </figure>

        <dl className="facts">
          {s.facts.map(f => <div key={f.label}><dt className="caption">{f.label}</dt><dd>{f.value}</dd></div>)}
          <div><dt className="caption">source</dt><dd><A className="link" href={s.source.href}>{s.source.label}</A></dd></div>
        </dl>

        <section className="p-col" aria-labelledby={`pk-${id}-does`}>
          <h2 className="caption-h" id={`pk-${id}-does`}>{s.does.title}</h2>
          <ul>{s.does.items.map(([b, t]) => <li key={b}><strong>{b}</strong> {t}</li>)}</ul>
        </section>

        <section className="p-col" aria-labelledby={`pk-${id}-call`}>
          <h2 className="caption-h" id={`pk-${id}-call`}>{s.call.title}</h2>
          <p>{s.call.body}</p>
        </section>

        <figure className="wide panel">
          <img src={s.shot.src} alt={s.shot.alt} loading="lazy" decoding="async" width={s.shot.w} height={s.shot.h} />
          <figcaption className="label">{s.shot.caption}</figcaption>
        </figure>

        <section className="p-col" aria-labelledby={`pk-${id}-stands`}>
          <h2 className="caption-h" id={`pk-${id}-stands`}>{s.stands.title}</h2>
          {s.stands.body.map(p => <p key={p}>{p}</p>)}
        </section>
      </main>

      <footer className="next-row">
        <a href="/#work" className="back"><ArrowLeft />all work</a>
        <A href={s.live.href} className="next"><span className="label">live</span><span className="letter">{s.name}</span><ArrowRight size={16} /></A>
      </footer>
    </div>
  </div>;
}
