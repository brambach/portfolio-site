import { useEffect, useRef, type CSSProperties } from 'react';
import { Letters, Lit, nameForTravel, SkyLink, useReveal, useSky, Water } from './parts';
import { PortHold, TRY_TITLE, TrySection } from './sections';
import { Shot } from './Shot';
import { WORK, workById } from './work';

const pad = (n: number) => String(n).padStart(2, '0');
const page = (id: string) => `/projects/${id}`;

/** A section title: serif italic rising letter by letter, then a halftone rule draws out. */
function Title({ children, meta }: { children: string; meta?: string }) {
  return <h2 className="sky-title" data-in><span className="sky-t"><Letters text={children} step={28} /></span><span className="sky-rule" />{meta && <span className="sky-meta" aria-hidden="true">{meta}</span>}</h2>;
}

/* A project's page: what it is, the picture it opens on reflected in the water, the part you can try, the decision
   behind it, more screens, how it's built and the fine print, then the next project over a smaller sunset.
   Left and right arrow keys move between projects. */
export default function SkyProject({ id }: { id: string }) {
  const work = workById(id) ?? WORK[0];
  const index = WORK.indexOf(work);
  const prev = WORK[(index + WORK.length - 1) % WORK.length], next = WORK[(index + 1) % WORK.length];
  const root = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLDivElement>(null);
  const { go, arrived } = useSky();
  useReveal(root, arrived ? 400 : 0, id);

  // Moving to a neighbour: when the top of this page is in view its title and picture travel to the next page's;
  // further down, the name you clicked becomes the next title.
  const neighbour = (clicked?: Element | null) => () => {
    const top = scrollY < innerHeight * 0.5;
    nameForTravel(top
      ? [[root.current?.querySelector('[data-piece="title"]'), 'sky-title'], [picture.current, 'sky-shot']]
      : [[clicked, 'sky-title']]);
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
      // Arrows already mean something in fields, the film and groups of choices; leave them be there.
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.isContentEditable || target?.closest('input, textarea, select, video, [role="radiogroup"], [role="tablist"], [role="slider"]')) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const to = event.key === 'ArrowRight' ? next : prev;
      event.preventDefault();
      go(page(to.id), neighbour());
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });

  // Back to the list: the browser's own back when that's where you came from (it remembers the scroll), otherwise
  // a fresh visit to the list. From the road, back to the road.
  const fromRoad = (() => { try { return new URL(document.referrer).pathname === '/work'; } catch { return false; } })();
  const back = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (fromRoad || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (history.state?.fromHome) history.back();
    else go('/#work', () => nameForTravel([[root.current?.querySelector('[data-piece="title"]'), 'sky-title']]));
  };

  const hero = work.hero;
  return <div ref={root} className="sky-project">
    <div className="sky-col sky-top sky-in" style={{ '--i': 0 } as CSSProperties}>
      <a className="sky-back" href={fromRoad ? `/work?mile=${work.id}` : '/#work'} onClick={back}><i aria-hidden="true">←</i> {fromRoad ? 'Back to the road' : 'Bryce Rambach'}</a>
      <span className="sky-count">{pad(index + 1)} / {pad(WORK.length)}</span>
    </div>

    <header className="sky-col sky-phead">
      <p className="sky-pmeta sky-in" style={{ '--i': 1 } as CSSProperties}>{work.category}</p>
      <h1 className="sky-ptitle sky-in" style={{ '--i': 1 } as CSSProperties} data-piece="title" tabIndex={-1}>{work.name}</h1>
      <p className="sky-pline sky-in" style={{ '--i': 2 } as CSSProperties}>{work.line}</p>
    </header>

    <figure className="sky-herowrap">
      {hero.port
        ? <PortHold ref={picture} />
        : <Shot ref={picture} picture={hero} piece="shot" className="sky-pic sky-in" alt={`${work.name}${hero.title ? `: ${hero.title}` : ''}`} loading="eager" />}
      <Water picture={picture} />
      {hero.title && <figcaption className="sky-col sky-cap sky-fade" data-in><b>{hero.title}</b>{hero.text}</figcaption>}
    </figure>

    <div className="sky-col">
      <dl className="sky-facts sky-fade" data-in>
        <div><dt>Role</dt><dd>{work.role}</dd></div>
        <div><dt>Status</dt><dd>{work.status}</dd></div>
        {work.link && <div className="sky-facts__link"><dt>See it</dt><dd><a className="sky-u sky-ext" href={work.link.href} target="_blank" rel="noopener noreferrer">{work.link.label}</a></dd></div>}
      </dl>
      <Title>What it is</Title>
      <p className="sky-lede sky-fade" data-in>{work.introduction}</p>
      <Title>{TRY_TITLE[work.id]}</Title>
    </div>
    <TrySection work={work} />

    <div className="sky-col">
      <Title>The call</Title>
      <p className="sky-body sky-fade" data-in>{work.decision}</p>
    </div>

    {work.gallery.length > 0 && <section className="sky-gallery" aria-label={`More of ${work.name}`}>
      {work.gallery.map(g => <figure key={g.src} className={`sky-g sky-fade${g.tall ? ' is-tall' : ''}`} data-in>
        <Shot picture={g} className="sky-g__pic" alt={`${work.name}: ${g.title}`} loading="lazy" />
        <figcaption className="sky-col"><b>{g.title}</b>{g.text}</figcaption>
      </figure>)}
    </section>}

    <div className="sky-col">
      <Title>Under the hood</Title>
      <p className="sky-body sky-fade" data-in>{work.engineering}</p>
      <Title>The fine print</Title>
      <p className="sky-body sky-quiet-text sky-fade" data-in>{work.boundary}</p>
    </div>

    <Lit kind="set" className="sky-strip" options={{ R: 34, Rs: 24, water: 92, waters: 70, x: 0.68, xs: 0.72 }}>
      <nav className="sky-col sky-pager" aria-label="More projects">
        <span className="sky-label">Next</span>
        <SkyLink to={page(next.id)} className="sky-next" data-next="" prepare={() => neighbour(root.current?.querySelector('[data-next] .sky-next__name'))()}><span className="sky-next__name">{next.name}</span><i aria-hidden="true">→</i></SkyLink>
        <p className="sky-next__line">{next.line}</p>
        <SkyLink to={page(prev.id)} className="sky-prev" prepare={neighbour()}><i aria-hidden="true">←</i> Previous: {prev.name}</SkyLink>
        <small className="sky-keys">Or use the arrow keys.</small>
      </nav>
    </Lit>
    <footer className="sky-col sky-pfoot"><p className="sky-sign">Say hello at <a className="sky-u" href="mailto:bryce.rambach@gmail.com">bryce.rambach@gmail.com</a>, or on <a className="sky-u sky-ext" href="https://www.linkedin.com/in/bryce-rambach/" target="_blank" rel="noopener noreferrer">LinkedIn</a> and <a className="sky-u sky-ext" href="https://x.com/brycerambach" target="_blank" rel="noopener noreferrer">X</a>.</p></footer>
  </div>;
}
