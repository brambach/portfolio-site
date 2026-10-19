import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { CONTACT, finePointer, INTRO, NAME, SIDE_QUESTS, SIGN, SKILLS, SUB, TAGLINE, WORK } from '../content';
import { CHAPTERS, chapterIndex, splitTime } from './chapters';
import { startDirectionB, type BMotion } from './motion';
import './b.css';

/* Direction B: kinetic type and editorial. The page reads like a magazine about one day. Each part of it is an
   hour, set as a huge numeral that tucks into the running header as you read on, and each hour turns the page to its
   own colour. The words do the moving: the tagline's three beats each move the way they say, headings come up out
   of masks, the work is an index of big names with the picture following the pointer, and Say hello comes apart
   when you reach for it. All the motion lives in motion.ts; this file is the page. */

const pad = (n: number) => String(n).padStart(2, '0');

/** A chapter's opening: the hour, enormous, and a rule across the spread with the chapter's name. */
function Hour({ id }: { id: string }) {
  const i = chapterIndex(id), ch = CHAPTERS[i], { digits, half } = splitTime(ch.time);
  return <div className="b-hour">
    <div className="b-spread" aria-hidden="true"><span>{pad(i)} / {pad(CHAPTERS.length - 1)}</span><i data-rule /><span>{ch.label}</span></div>
    <p className="b-num" aria-label={ch.time}><span className="b-num__d" data-num aria-hidden="true">{digits}</span><span className="b-num__h" aria-hidden="true">{half}</span></p>
  </div>;
}

/** The name of a project, set twice so the letters can roll from upright to italic. */
function Roll({ text }: { text: string }) {
  return <span className="b-roll" aria-label={text}>{[...text].map((c, k) => <span key={k} className="b-roll__c" style={{ '--i': k } as CSSProperties} aria-hidden="true"><span>{c}</span><span>{c}</span></span>)}</span>;
}

export default function DirectionB() {
  const root = useRef<HTMLDivElement>(null);
  const motion = useRef<BMotion | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!root.current) return;
    motion.current = startDirectionB(root.current);
    return () => { motion.current?.stop(); motion.current = null; };
  }, []);

  const plain = (e: MouseEvent) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  /** Leaving for a project: the curtain comes down in that project's colour first. On a phone the first tap opens
   *  the row instead, and the button inside it leaves. */
  const leave = (id: string, name: string, href: string, row: boolean) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (plain(e)) return;
    e.preventDefault();
    if (row && !finePointer() && open !== id) { setOpen(id); return; }
    motion.current?.curtain(name, href);
  };

  const beat = (id: string) => CHAPTERS[chapterIndex(id)];
  return <div ref={root} className="lab-b">
    <div className="b-field" aria-hidden="true">
      {CHAPTERS.map((c, i) => <i key={c.id} data-field={i} style={{ '--f': c.field, '--g': c.glow } as CSSProperties} />)}
    </div>

    <header className="b-head">
      <a className="b-head__name" href="/" data-cursor="Home">{NAME}</a>
      <span className="b-head__label" aria-hidden="true"><span className="b-swap" data-head="label"><span>{CHAPTERS[0].label}</span></span></span>
      <span className="b-head__time" aria-hidden="true">
        <span className="b-arc"><i className="b-arc__line" /><i className="b-arc__sun" data-sun /></span>
        <span className="b-swap" data-head="time"><span>{CHAPTERS[0].time}</span></span>
      </span>
    </header>

    <main>
      <section className="b-hero b-ch" data-ch={0} aria-label="Introduction">
        <h1 className="b-tag" aria-label={TAGLINE}>
          <span className="b-tag__l b-tag__l--1" data-beat="design" aria-hidden="true">
            I <span className="b-tag__design">design<svg viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15 C 60 5, 130 21, 190 12 S 280 6, 297 13" pathLength={1} /></svg></span> it,
          </span>
          <span className="b-tag__l b-tag__l--2" data-beat="move" aria-hidden="true">make it <span className="b-tag__move">move,</span></span>
          <span className="b-tag__l b-tag__l--3" data-beat="build" aria-hidden="true">and build it.<i className="b-tag__beam" /></span>
        </h1>
        <div className="b-hero__foot">
          <p className="b-hero__sub" data-hero-sub>{SUB}</p>
          <p className="b-hero__meta" data-hero-sub aria-hidden="true"><span>One day, sunrise to sunset</span><span className="b-hero__cue">Scroll</span></p>
        </div>
      </section>

      <section className="b-ch b-intro" data-ch={1} aria-label="About">
        <Hour id="intro" />
        <p className="b-intro__big" data-split="intro">{INTRO.before}<a className="b-link" href={INTRO.link.to} data-cursor="Open">{INTRO.link.label}</a>{INTRO.after}</p>
        <p className="b-intro__small" data-split="lines">{INTRO.second}</p>
      </section>

      {SKILLS.map((skill, n) => <section key={skill.id} id={skill.id} className="b-ch b-skill" data-ch={chapterIndex(skill.id)} aria-labelledby={`b-${skill.id}`}>
        <Hour id={skill.id} />
        <div className="b-skill__grid">
          <h2 id={`b-${skill.id}`} className="b-skill__name" data-split="chars"><span className="b-sr">{pad(n + 1)} </span>{skill.name}</h2>
          <p className="b-skill__line" data-split="words">{skill.line}</p>
          <div className="b-skill__body">
            {skill.body.map((text, k) => <p key={k} data-split="lines">{text}</p>)}
            <ul className="b-proof">
              {skill.evidence.map(item => <li key={item.name} data-row>
                <i data-rule />
                {item.to ? <a className="b-proof__name" href={item.to} data-cursor="Open" data-magnetic><span>{item.name}</span><b aria-hidden="true">→</b></a>
                  : item.href ? <a className="b-proof__name" href={item.href} target="_blank" rel="noopener noreferrer" data-cursor="Read" data-magnetic><span>{item.name}</span><b aria-hidden="true">↗</b></a>
                    : <span className="b-proof__name is-private"><span>{item.name}</span><small>Private</small></span>}
                <span className="b-proof__note">{item.note}</span>
              </li>)}
            </ul>
          </div>
        </div>
      </section>)}

      <section className="b-ch b-work" data-ch={chapterIndex('work')} aria-labelledby="b-work">
        <Hour id="work" />
        <h2 id="b-work" className="b-work__title" data-split="chars">The work</h2>
        <ol className="b-index" data-index>
          {WORK.map((work, i) => <li key={work.id} className={`b-index__row${open === work.id ? ' is-open' : ''}`} data-work={work.id} data-row>
            <i data-rule />
            <a className="b-index__link" href={`/projects/${work.id}`} onClick={leave(work.id, work.name, `/projects/${work.id}`, true)} data-cursor="Open" aria-expanded={finePointer() ? undefined : open === work.id}>
              <span className="b-index__no">{pad(i + 1)}</span>
              <span className="b-index__name"><Roll text={work.name} /></span>
              <span className="b-index__kind">{work.kind}</span>
              <span className="b-index__title">{work.hero.title}</span>
            </a>
            <div className="b-index__more">
              <div>
                <div className={`b-tile${work.hero.port ? ' is-port' : ''}${work.hero.tall ? ' is-tall' : ''}`}>
                  {work.hero.port ? <PortTile /> : <img src={work.hero.src} alt="" loading="lazy" decoding="async" />}
                </div>
                <p>{work.hero.text}</p>
                <a className="b-button" href={`/projects/${work.id}`} onClick={leave(work.id, work.name, `/projects/${work.id}`, false)}>Open {work.name} <span aria-hidden="true">→</span></a>
              </div>
            </div>
          </li>)}
        </ol>
        <p className="b-work__hint" aria-hidden="true">{finePointer() ? 'Point at one to see it. Click to open it.' : 'Tap one to see it, then open it.'}</p>
      </section>

      <footer className="b-ch b-close" data-ch={chapterIndex('contact')} aria-labelledby="b-hello">
        <Hour id="contact" />
        <h2 id="b-hello" className="b-hello" data-hello>Say hello</h2>
        <a className="b-mail" href={CONTACT[0].href} data-cursor="Email" data-magnetic><span>{CONTACT[0].name}</span></a>
        <div className="b-close__cols">
          <div>
            <h3 className="b-kicker">Elsewhere</h3>
            <ul className="b-list">{CONTACT.slice(1).map(c => <li key={c.name} data-row><i data-rule /><a href={c.href} target="_blank" rel="noopener noreferrer" data-cursor="Read"><span>{c.name}</span><b aria-hidden="true">↗</b></a><span>{c.note}</span></li>)}</ul>
          </div>
          <div>
            <h3 className="b-kicker">Side quests</h3>
            <ul className="b-list">{SIDE_QUESTS.map(q => <li key={q.name} data-row><i data-rule /><a href={q.href} {...(q.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} data-cursor={q.external ? 'Read' : 'Open'}><span>{q.name}</span><b aria-hidden="true">{q.external ? '↗' : '→'}</b></a><span>{q.note}</span></li>)}</ul>
          </div>
        </div>
        <p className="b-sign"><span>{SIGN}</span><span aria-hidden="true">{beat('contact').time}</span></p>
      </footer>
    </main>

    {/* The picture that follows the pointer over the index, on screens with one. */}
    <div className="b-peek" aria-hidden="true" data-peek>
      {WORK.map(work => <div key={work.id} className={`b-peek__pic${work.hero.tall ? ' is-tall' : ''}`} data-peek-pic={work.id}>
        {work.hero.port ? <PortTile /> : <img src={work.hero.src} alt="" decoding="async" />}
      </div>)}
    </div>
    <div className="b-curtain" aria-hidden="true" data-curtain><p data-curtain-name /></div>
    <div className="b-cursor" aria-hidden="true" data-cursor-el><i className="b-cursor__dot" /><span className="b-cursor__ring"><span data-cursor-label /></span></div>
  </div>;
}

/** Port has no screenshots, so its tile is the ring you hold. */
function PortTile() {
  return <div className="b-port"><i /><span>Hold to close</span></div>;
}
