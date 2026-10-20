import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { CONTACT, finePointer, INTRO, NAME, SIDE_QUESTS, SIGN, SKILLS, SUB, TAGLINE, WORK } from '../content';
import { startDirectionE, type EMotion } from './motion';
import { paletteFor } from './palette';
import { ART, SCENE_ORDER, type SceneId } from './scenes';
import './e.css';

/* Direction E: the page is made of dots. Every part is one bold object drawn in dots on the paper (a paper
   airplane, two plugs, a cursor, a climbing harness, a pen, a cup, a waving hand), and the portrait is built of
   the same dots. They fly in out of static when the page opens, travel from one object into the next when you
   reach a new part, arrive loose and snap sharp, move a little the way each object would, and get out of the way of
   the pointer. Grains drip off the plane until you scroll. The tagline breaks into the same dots when you leave
   it and comes back together when you return.

   The palette comes from the visitor's clock when the page loads (dawn, day, late afternoon or night) and stays.
   The words move the way B's do. All of the motion is in motion.ts, the dots in dots.ts and field.ts. */

const pad = (n: number) => String(n).padStart(2, '0');
const LABELS: Record<SceneId, string> = {
  hero: 'Hello', intro: 'About', integrations: 'Integrations', agents: 'Agents', harnesses: 'Harnesses',
  design: 'Design', product: 'Product taste', work: 'The work', contact: 'Say hello',
};

/** A part's opening: its number, a rule and its name. */
function Rule({ id }: { id: SceneId }) {
  return <div className="e-rule" aria-hidden="true"><span>{pad(SCENE_ORDER.indexOf(id))} / {pad(SCENE_ORDER.length - 1)}</span><i data-rule /><span>{LABELS[id]}</span></div>;
}

/** A project's name, set twice so the letters can roll from upright to italic. */
function Roll({ text }: { text: string }) {
  return <span className="e-roll" aria-label={text}>{[...text].map((c, k) => <span key={k} className="e-roll__c" style={{ '--i': k } as CSSProperties} aria-hidden="true"><span>{c}</span><span>{c}</span></span>)}</span>;
}

export default function DirectionE() {
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef<EMotion | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const palette = useMemo(() => paletteFor(typeof location === 'undefined' ? '' : location.search), []);

  useEffect(() => {
    if (!root.current) return;
    // The page behind everything is the palette's paper, and the browser's bar matches it.
    const html = document.documentElement, meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = meta?.content;
    html.dataset.labE = palette.name;
    html.style.setProperty('--e-paper', palette.paper);
    if (meta) meta.content = palette.paper;
    motion.current = startDirectionE(root.current, palette);
    return () => {
      motion.current?.stop(); motion.current = null;
      delete html.dataset.labE;
      html.style.removeProperty('--e-paper');
      html.style.removeProperty('background');
      if (meta && before) meta.content = before;
    };
  }, [palette]);

  const plain = (e: MouseEvent) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  /** Leaving for a project: the page breaks up into blocks with its name in them. On a phone the first tap opens
   *  the row instead, and the button inside it leaves. */
  const leave = (id: string, name: string, href: string, row: boolean) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (plain(e)) return;
    e.preventDefault();
    if (row && !finePointer() && open !== id) { setOpen(id); return; }
    motion.current?.curtain(name, href);
  };

  const vars = { '--e-paper': palette.paper, '--e-ink': palette.ink, '--e-accent': palette.accent } as CSSProperties;
  return <div ref={root} className={`lab-e is-${palette.name}${palette.dark ? ' is-dark' : ''}`} style={vars}>
    <canvas className="e-dots" data-dots aria-hidden="true" />

    <header className="e-head">
      <a className="e-head__name" href="/" data-cursor="Home">{NAME}</a>
      <p className="e-caption" aria-hidden="true"><span className="e-swap" data-caption><span>{ART.hero.caption}</span></span></p>
    </header>

    <main>
      <section className="e-hero e-part" data-scene="hero" aria-label="Introduction">
        <h1 className="e-tag" aria-label={TAGLINE} data-tag>
          <span className="e-tag__l e-tag__l--1" data-line="design" aria-hidden="true">
            I <span className="e-tag__design">design<svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15 C 60 5, 130 21, 190 12 S 280 6, 297 13" pathLength={1} /></svg></span> it,
          </span>
          <span className="e-tag__l e-tag__l--2" data-line="move" aria-hidden="true">make it <span className="e-tag__move">move,</span></span>
          <span className="e-tag__l e-tag__l--3" data-line="build" aria-hidden="true">and build it.<i className="e-tag__beam" /></span>
        </h1>
        <div className="e-hero__foot" data-hero-foot>
          <p className="e-hero__sub">{SUB}</p>
        </div>
      </section>

      <section className="e-part e-intro" data-scene="intro" aria-label="About">
        <Rule id="intro" />
        <p className="e-intro__big" data-read>{INTRO.before}<a className="e-link" href={INTRO.link.to} data-cursor="Open">{INTRO.link.label}</a>{INTRO.after}</p>
        <p className="e-intro__small" data-quiet>{INTRO.second}</p>
        <span className="lab-sr" role="img" aria-label={`A portrait of ${NAME}, drawn in dots`} />
      </section>

      {SKILLS.map((skill, n) => <section key={skill.id} id={skill.id} className="e-part e-skill" data-scene={skill.id} aria-labelledby={`e-${skill.id}`}>
        <Rule id={skill.id as SceneId} />
        <div data-quiet>
          <h2 id={`e-${skill.id}`} className="e-skill__name"><span className="lab-sr">{pad(n + 1)} </span>{skill.name}</h2>
          <p className="e-skill__line">{skill.line}</p>
        </div>
        <div className="e-skill__body" data-quiet>
          {skill.body.map((text, k) => <p key={k}>{text}</p>)}
          <ul className="e-proof">
            {skill.evidence.map(item => <li key={item.name}>
              {item.to ? <a className="e-proof__name" href={item.to} data-cursor="Open" data-magnetic><span>{item.name}</span><b aria-hidden="true">→</b></a>
                : item.href ? <a className="e-proof__name" href={item.href} target="_blank" rel="noopener noreferrer" data-cursor="Read" data-magnetic><span>{item.name}</span><b aria-hidden="true">↗</b></a>
                  : <span className="e-proof__name is-private"><span>{item.name}</span><small>Private</small></span>}
              <span className="e-proof__note">{item.note}</span>
            </li>)}
          </ul>
        </div>
      </section>)}

      <section className="e-part e-work" data-scene="work" aria-labelledby="e-work">
        <Rule id="work" />
        <h2 id="e-work" className="e-work__title" data-quiet>The work</h2>
        <ol className="e-index" data-index>
          {WORK.map((work, i) => <li key={work.id} className={`e-index__row${open === work.id ? ' is-open' : ''}`} data-work={work.id} data-quiet>
            <a className="e-index__link" href={`/projects/${work.id}`} onClick={leave(work.id, work.name, `/projects/${work.id}`, true)} data-cursor="Open" aria-expanded={finePointer() ? undefined : open === work.id}>
              <span className="e-index__no">{pad(i + 1)}</span>
              <span className="e-index__name"><Roll text={work.name} /></span>
              <span className="e-index__kind">{work.kind}</span>
              <span className="e-index__title">{work.hero.title}</span>
            </a>
            <div className="e-index__more">
              <div>
                <div className={`e-tile${work.hero.tall ? ' is-tall' : ''}`}>
                  {work.hero.port ? <div className="e-port"><i /><span>Hold to close</span></div> : <img src={work.hero.src} alt="" loading="lazy" decoding="async" />}
                </div>
                <p>{work.hero.text}</p>
                <a className="e-button" href={`/projects/${work.id}`} onClick={leave(work.id, work.name, `/projects/${work.id}`, false)}>Open {work.name} <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </li>)}
        </ol>
        <p className="e-work__hint" aria-hidden="true">{finePointer() ? 'Point at one to see it. Click to open it.' : 'Tap one to see it, then open it.'}</p>
      </section>

      <footer className="e-part e-close" data-scene="contact" aria-labelledby="e-hello">
        <Rule id="contact" />
        <h2 id="e-hello" className="e-hello" data-hello>Say hello</h2>
        <a className="e-mail" href={CONTACT[0].href} data-cursor="Email" data-magnetic><span>{CONTACT[0].name}</span></a>
        <div className="e-close__cols" data-quiet>
          <div>
            <h3 className="e-kicker">Elsewhere</h3>
            <ul className="e-list">{CONTACT.slice(1).map(c => <li key={c.name}><a href={c.href} target="_blank" rel="noopener noreferrer" data-cursor="Read"><span>{c.name}</span><b aria-hidden="true">↗</b></a><span>{c.note}</span></li>)}</ul>
          </div>
          <div>
            <h3 className="e-kicker">Side quests</h3>
            <ul className="e-list">{SIDE_QUESTS.map(q => <li key={q.name}><a href={q.href} {...(q.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} data-cursor={q.external ? 'Read' : 'Open'}><span>{q.name}</span><b aria-hidden="true">{q.external ? '↗' : '→'}</b></a><span>{q.note}</span></li>)}</ul>
          </div>
        </div>
        <p className="e-sign"><span>{SIGN}</span></p>
      </footer>
    </main>

    {/* The picture that follows the pointer over the index, on screens with one. */}
    <div className="e-peek" aria-hidden="true" data-peek><canvas data-peek-canvas /></div>
    <div className="e-curtain" aria-hidden="true" data-curtain><canvas data-curtain-canvas /><p data-curtain-name /></div>
    <div className="e-cursor" aria-hidden="true" data-cursor-el><i className="e-cursor__dot" /><span className="e-cursor__ring"><span data-cursor-label /></span></div>
  </div>;
}
