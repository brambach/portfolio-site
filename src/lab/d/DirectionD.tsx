import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { CONTACT, DAY_BEATS, finePointer, INTRO, NAME, SIDE_QUESTS, SIGN, SKILLS, SUB, TAGLINE, WORK } from '../content';
import { beatIndex, beatOf } from './day';
import { startDirectionD, type DMotion } from './motion';
import './d.css';

/* Direction D: B's moving type, outdoors. The words move the way B's do, over a landscape that goes from first
   light to dusk as you read: a sky with clouds, hills with pines, mist on the water, grass along the bottom
   of the screen, and now and then a few birds. There's no sun. The time of day is only in the light.

   Each part of the page gets one moment that moves and keeps everything else quiet. The tagline's three beats
   in the hero, the big hour at the top of every part after it, the picture that follows the pointer over the
   work, and at dusk the birds heading home under Say hello. The scroll stays yours: nothing is pinned.
   All of the motion is in motion.ts, the landscape in land.ts and life.ts. */

const pad = (n: number) => String(n).padStart(2, '0');

/** A part's opening: its hour, very big, with a rule and its name. */
function Hour({ id }: { id: string }) {
  const i = beatIndex(id), b = beatOf(id), [digits, half] = b.time.split(' ');
  return <div className="d-hour" data-hour>
    <div className="d-hour__rule" aria-hidden="true"><span>{pad(i)} / {pad(DAY_BEATS.length - 1)}</span><i data-rule /><span>{b.label}</span></div>
    <p className="d-num" aria-label={b.time}><span className="d-num__d" data-num aria-hidden="true">{digits}</span><span className="d-num__h" aria-hidden="true">{half}</span></p>
  </div>;
}

/** A project's name, set twice so the letters can roll from upright to italic. */
function Roll({ text }: { text: string }) {
  return <span className="d-roll" aria-label={text}>{[...text].map((c, k) => <span key={k} className="d-roll__c" style={{ '--i': k } as CSSProperties} aria-hidden="true"><span>{c}</span><span>{c}</span></span>)}</span>;
}

export default function DirectionD() {
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef<DMotion | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!root.current) return;
    motion.current = startDirectionD(root.current);
    return () => { motion.current?.stop(); motion.current = null; };
  }, []);

  const plain = (e: MouseEvent) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  /** Leaving for a project: mist rolls up over the page with its name first. On a phone the first tap opens the
   *  row instead, and the button inside it leaves. */
  const leave = (id: string, name: string, href: string, row: boolean) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (plain(e)) return;
    e.preventDefault();
    if (row && !finePointer() && open !== id) { setOpen(id); return; }
    motion.current?.curtain(name, href);
  };

  return <div ref={root} className="lab-d">
    <div className="d-scene" aria-hidden="true">
      <div className="d-fallback" data-fallback />
      <canvas className="d-land" data-land />
      <canvas className="d-life" data-life />
    </div>

    <header className="d-head">
      <a className="d-head__name" href="/" data-cursor="Home">{NAME}</a>
      <div className="d-clock" aria-hidden="true">
        <span className="d-clock__label"><span className="d-swap" data-label><span>{DAY_BEATS[0].label}</span></span></span>
        <span className="d-clock__time" data-clock>{DAY_BEATS[0].time}</span>
        <span className="d-clock__track">
          {DAY_BEATS.map(b => <i key={b.id} style={{ left: `${b.at * 100}%` }} />)}
          <b data-run />
        </span>
      </div>
    </header>

    <main>
      <section className="d-hero d-part" data-beat="hero" aria-label="Introduction">
        <h1 className="d-tag" aria-label={TAGLINE}>
          <span className="d-tag__l d-tag__l--1" data-line="design" aria-hidden="true">
            I <span className="d-tag__design">design<svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15 C 60 5, 130 21, 190 12 S 280 6, 297 13" pathLength={1} /></svg></span> it,
          </span>
          <span className="d-tag__l d-tag__l--2" data-line="move" aria-hidden="true">make it <span className="d-tag__move">move,</span></span>
          <span className="d-tag__l d-tag__l--3" data-line="build" aria-hidden="true">and build it.<i className="d-tag__beam" /></span>
        </h1>
        <div className="d-hero__foot" data-hero-foot>
          <p className="d-hero__sub">{SUB}</p>
          <p className="d-hero__cue" aria-hidden="true"><span>One day, first light to dusk</span><span className="d-hero__go">Scroll</span></p>
        </div>
      </section>

      <section className="d-part d-intro" data-beat="intro" aria-label="About">
        <Hour id="intro" />
        <p className="d-intro__big" data-read>{INTRO.before}<a className="d-link" href={INTRO.link.to} data-cursor="Open">{INTRO.link.label}</a>{INTRO.after}</p>
        <p className="d-intro__small" data-quiet>{INTRO.second}</p>
      </section>

      {SKILLS.map((skill, n) => <section key={skill.id} id={skill.id} className="d-part d-skill" data-beat={skill.id} aria-labelledby={`d-${skill.id}`}>
        <Hour id={skill.id} />
        <div className="d-skill__grid">
          <div data-quiet>
            <h2 id={`d-${skill.id}`} className="d-skill__name"><span className="lab-sr">{pad(n + 1)} </span>{skill.name}</h2>
            <p className="d-skill__line">{skill.line}</p>
          </div>
          <div className="d-skill__body" data-quiet>
            {skill.body.map((text, k) => <p key={k}>{text}</p>)}
            <ul className="d-proof">
              {skill.evidence.map(item => <li key={item.name}>
                {item.to ? <a className="d-proof__name" href={item.to} data-cursor="Open" data-magnetic><span>{item.name}</span><b aria-hidden="true">→</b></a>
                  : item.href ? <a className="d-proof__name" href={item.href} target="_blank" rel="noopener noreferrer" data-cursor="Read" data-magnetic><span>{item.name}</span><b aria-hidden="true">↗</b></a>
                    : <span className="d-proof__name is-private"><span>{item.name}</span><small>Private</small></span>}
                <span className="d-proof__note">{item.note}</span>
              </li>)}
            </ul>
          </div>
        </div>
      </section>)}

      <section className="d-part d-work" data-beat="work" aria-labelledby="d-work">
        <Hour id="work" />
        <h2 id="d-work" className="d-work__title" data-quiet>The work</h2>
        <ol className="d-index" data-index>
          {WORK.map((work, i) => <li key={work.id} className={`d-index__row${open === work.id ? ' is-open' : ''}`} data-work={work.id} data-quiet>
            <a className="d-index__link" href={`/projects/${work.id}`} onClick={leave(work.id, work.name, `/projects/${work.id}`, true)} data-cursor="Open" aria-expanded={finePointer() ? undefined : open === work.id}>
              <span className="d-index__no">{pad(i + 1)}</span>
              <span className="d-index__name"><Roll text={work.name} /></span>
              <span className="d-index__kind">{work.kind}</span>
              <span className="d-index__title">{work.hero.title}</span>
            </a>
            <div className="d-index__more">
              <div>
                <div className={`d-tile${work.hero.tall ? ' is-tall' : ''}`}>
                  {work.hero.port ? <PortTile /> : <img src={work.hero.src} alt="" loading="lazy" decoding="async" />}
                </div>
                <p>{work.hero.text}</p>
                <a className="d-button" href={`/projects/${work.id}`} onClick={leave(work.id, work.name, `/projects/${work.id}`, false)}>Open {work.name} <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </li>)}
        </ol>
        <p className="d-work__hint" aria-hidden="true">{finePointer() ? 'Point at one to see it. Click to open it.' : 'Tap one to see it, then open it.'}</p>
      </section>

      <footer className="d-part d-close" data-beat="contact" aria-labelledby="d-hello">
        <Hour id="contact" />
        <h2 id="d-hello" className="d-hello" data-hello>Say hello</h2>
        <a className="d-mail" href={CONTACT[0].href} data-cursor="Email" data-magnetic><span>{CONTACT[0].name}</span></a>
        <div className="d-close__cols" data-quiet>
          <div>
            <h3 className="d-kicker">Elsewhere</h3>
            <ul className="d-list">{CONTACT.slice(1).map(c => <li key={c.name}><a href={c.href} target="_blank" rel="noopener noreferrer" data-cursor="Read"><span>{c.name}</span><b aria-hidden="true">↗</b></a><span>{c.note}</span></li>)}</ul>
          </div>
          <div>
            <h3 className="d-kicker">Side quests</h3>
            <ul className="d-list">{SIDE_QUESTS.map(q => <li key={q.name}><a href={q.href} {...(q.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} data-cursor={q.external ? 'Read' : 'Open'}><span>{q.name}</span><b aria-hidden="true">{q.external ? '↗' : '→'}</b></a><span>{q.note}</span></li>)}</ul>
          </div>
        </div>
        <p className="d-sign"><span>{SIGN}</span><span aria-hidden="true">{beatOf('contact').time}</span></p>
      </footer>
    </main>

    {/* The picture that follows the pointer over the index, on screens with one. */}
    <div className="d-peek" aria-hidden="true" data-peek>
      {WORK.map(work => <div key={work.id} className={`d-peek__pic${work.hero.tall ? ' is-tall' : ''}`} data-peek-pic={work.id}>
        {work.hero.port ? <PortTile /> : <img src={work.hero.src} alt="" decoding="async" />}
      </div>)}
    </div>
    <div className="d-curtain" aria-hidden="true" data-curtain><i /><p data-curtain-name /></div>
    <div className="d-cursor" aria-hidden="true" data-cursor-el><i className="d-cursor__dot" /><span className="d-cursor__ring"><span data-cursor-label /></span></div>
  </div>;
}

/** Port has no screenshots, so its tile is the ring you hold. */
function PortTile() {
  return <div className="d-port"><i /><span>Hold to close</span></div>;
}
