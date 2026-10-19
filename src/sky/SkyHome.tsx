import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { narrowDawn, startDay, waterFor, type DayLive } from './day';
import { Letters, finePointer, nameForTravel, reduced, SkyLink, useReveal, useSky } from './parts';
import { Shot } from './Shot';
import { SKILLS, skillForProject, type Evidence, type Skill } from './skills';

const pad = (n: number) => String(n).padStart(2, '0');
const INDEX_W = 292;
/** How long each skill stays up while the first screen shows them in turn. */
const TOUR_STEP = 3600;
const TOUR_START = 2200;

/** A section title: serif italic rising letter by letter, then a halftone rule draws out. */
function Title({ children, meta }: { children: string; meta?: string }) {
  return <h2 className="sky-title" data-in><span className="sky-t"><Letters text={children} step={28} /></span><span className="sky-rule" />{meta && <span className="sky-meta" aria-hidden="true">{meta}</span>}</h2>;
}

/** Where each skill's picture rises on the first screen: right of the index on wide screens, near the middle on
 *  phones, never off the edge. */
function berthsFor(W: number, H: number) {
  const narrow = narrowDawn();
  const cardW = narrow ? Math.min(300, W - 64) : Math.min(380, Math.max(300, W * 0.24));
  const minLeft = narrow ? 24 : 56 + INDEX_W + 40;
  const mid = (SKILLS.length - 1) / 2;
  const lefts = SKILLS.map((_, i) => {
    const spot = narrow ? 0.5 + (i - mid) * 0.04 : 0.47 + i * 0.09;
    return Math.min(Math.max(W * spot - cardW / 2, minLeft), W - cardW - 24);
  });
  return { cardW, lefts, centers: lefts.map(l => l + cardW / 2), water: waterFor(H) };
}

/** Scroll to a skill's section and put keyboard focus on its heading. */
function showSkill(id: string) {
  const heading = document.getElementById(`${id}-h`);
  if (!heading) return;
  history.replaceState(history.state, '', `#${id}`);
  heading.closest('section')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  heading.focus({ preventScroll: true });
}

/* The front page, as one day. Dawn is the first screen: the claim, the five things it covers as a short index on the
   shore, and the picture of whichever one is up rising out of the water in front of the sun. Until you touch
   anything, the sun walks the horizon through all five once. Then the proof for each through the day, and Say
   hello over the sunset. The sun, the sky and the reflections are run by day.ts; this file lays the page out and
   keeps track of which skill is up. */
export default function SkyHome() {
  const { go, arrived, cameFrom } = useSky();
  const back = skillForProject(cameFrom);
  const [current, setCurrent] = useState<number | null>(back >= 0 ? back : null);
  const [docked, setDocked] = useState(true);
  // Coming back from a project, its picture is already up: no rising on the first frame.
  const [settled, setSettled] = useState(arrived);
  const [geo, setGeo] = useState(() => berthsFor(typeof window === 'undefined' ? 1280 : document.documentElement.clientWidth, typeof window === 'undefined' ? 800 : innerHeight));
  const [touched, setTouched] = useState(false);
  const [touring, setTouring] = useState(false);
  const delay = useRef(0);
  const wasUp = useRef<number | null>(null);
  const tourTimer = useRef(0);

  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null), stageCanvas = useRef<HTMLCanvasElement>(null);
  const dusk = useRef<HTMLElement>(null), duskCanvas = useRef<HTMLCanvasElement>(null);
  const sky = useRef<HTMLDivElement>(null), sunLayer = useRef<HTMLDivElement>(null), sun = useRef<HTMLDivElement>(null);
  const morning = useRef<HTMLCanvasElement>(null), evening = useRef<HTMLCanvasElement>(null), clock = useRef<HTMLSpanElement>(null);
  const berths = useRef<HTMLDivElement[]>([]), shots = useRef<HTMLDivElement[]>([]), mirrors = useRef<HTMLCanvasElement[]>([]);
  const live = useRef<DayLive>({ current, centers: geo.centers, cardW: geo.cardW, instant: !arrived });
  live.current.current = current; live.current.centers = geo.centers; live.current.cardW = geo.cardW;
  const engine = useRef<ReturnType<typeof startDay> | null>(null);

  useReveal(root, arrived ? 300 : 0, 'home');

  // Lay the first screen out, and again when it changes size.
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setGeo(berthsFor(el.clientWidth, el.clientHeight));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (settled) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setSettled(true)));
    return () => cancelAnimationFrame(frame);
  }, [settled]);

  // The sun, the sky and the water.
  useEffect(() => {
    const need = [stage, stageCanvas, dusk, duskCanvas, sky, sunLayer, sun, morning, evening, clock].map(r => r.current);
    if (need.some(el => !el) || typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    engine.current = startDay({
      stage: stage.current!, stageCanvas: stageCanvas.current!, dusk: dusk.current!, duskCanvas: duskCanvas.current!,
      sky: sky.current!, sunLayer: sunLayer.current!, sun: sun.current!, morning: morning.current!, evening: evening.current!, clock: clock.current!,
      berths: berths.current, shots: shots.current, mirrors: mirrors.current,
    }, live.current, d => { if (d) delay.current = 0.05; setDocked(d); });
    return () => { engine.current?.stop(); engine.current = null; };
  }, []);

  const select = (i: number | null) => {
    if (i === current) return;
    // Coming from another skill the new picture waits for the sun to get most of the way there.
    delay.current = reduced() ? 0 : current == null ? (touched || !arrived ? 0.3 : 0) : 0.42;
    setCurrent(i);
    if (i != null && docked) engine.current?.splash(i, delay.current * 1000 + 200);
    engine.current?.wake();
  };
  const latestSelect = useRef(select);
  latestSelect.current = select;

  // Anything you do yourself ends the tour.
  const stopTour = () => { window.clearTimeout(tourTimer.current); setTouring(false); };
  const use = () => { setTouched(true); stopTour(); };
  const pick = (i: number | null) => { stopTour(); select(i); };
  // Pointing at the list for a moment counts as having found it.
  const pointed = useRef(false);
  const noticed = () => { if (pointed.current) return; pointed.current = true; window.setTimeout(() => setTouched(true), 2500); };

  // Back at the top, the current picture rises again. Leaving the top ends the tour.
  useEffect(() => {
    if (docked && current != null) engine.current?.splash(current, 250);
    if (!docked) stopTour();
  }, [docked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Once the sun is up, it walks the horizon through each skill once, unless you've already picked one. With
  // reduced motion the first one is simply up.
  useEffect(() => {
    if (!arrived || back >= 0) return;
    if (reduced()) { latestSelect.current(0); return; }
    let i = 0;
    const step = () => {
      latestSelect.current(i);
      i += 1;
      if (i < SKILLS.length) tourTimer.current = window.setTimeout(step, TOUR_STEP);
      else setTouring(false);
    };
    setTouring(true);
    tourTimer.current = window.setTimeout(step, TOUR_START);
    return () => window.clearTimeout(tourTimer.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Left and right step through the skills while you're at the top; Escape lets the picture go.
  const links = useRef<HTMLAnchorElement[]>([]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || !docked) return;
      const inIndex = !!document.activeElement?.closest('.sky-ix');
      if (!(document.activeElement === document.body || inIndex)) return;
      const step = (d: number) => {
        const i = current == null ? (d > 0 ? 0 : SKILLS.length - 1) : (current + d + SKILLS.length) % SKILLS.length;
        links.current[i]?.focus({ preventScroll: true });
        pick(i); use();
      };
      if (event.key === 'ArrowRight' || (inIndex && event.key === 'ArrowDown')) { event.preventDefault(); step(1); }
      else if (event.key === 'ArrowLeft' || (inIndex && event.key === 'ArrowUp')) { event.preventDefault(); step(-1); }
      else if (event.key === 'Escape') { pick(null); (document.activeElement as HTMLElement | null)?.blur(); }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });

  // Leaving for a project: the picture (if it's up) becomes the project's picture, and the project's name in the
  // index becomes its title.
  const travel = (i: number) => () => nameForTravel([
    [docked && current === i ? shots.current[i] : null, 'sky-shot'],
    [root.current?.querySelector(`[data-row="${SKILLS[i].id}"] .sky-kd`), 'sky-title'],
  ]);
  const plain = (event: React.MouseEvent) => event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  /** A row in the index: on a phone the first tap raises it, the second goes to its proof further down. (Focus
   *  lands before the click, so this looks at what was up when the finger went down.) */
  const openRow = (i: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (plain(event)) return;
    event.preventDefault();
    if (!finePointer() && wasUp.current !== i) { pick(i); use(); return; }
    showSkill(SKILLS[i].id);
  };
  /** A raised picture opens its project, or its own section when it has no page. */
  const openCard = (i: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (plain(event)) return;
    event.preventDefault();
    const to = SKILLS[i].to;
    if (to.startsWith('#')) showSkill(to.slice(1)); else go(to, travel(i));
  };

  const up = (i: number) => docked && current === i;
  const fine = finePointer();
  return <div ref={root} className="sky-home">
    <div ref={sky} className="sky-daysky" aria-hidden="true" />

    <header className={`sky-dawn${settled ? '' : ' is-still'}`} id="work" style={{ '--water': `${geo.water}px` } as CSSProperties}>
      <div ref={stage} className="sky-lit sky-stage">
        <canvas ref={stageCanvas} aria-hidden="true" />
        <div className="sky-who">
          <h1 className="sky-name"><Letters text="Bryce Rambach" /></h1>
          <p className="sky-claim sky-in" style={{ '--i': 1 } as CSSProperties}>I build the whole thing.</p>
          <p className="sky-sub sky-in" style={{ '--i': 2 } as CSSProperties}>I’m looking for a founding engineer role at an early AI startup in a new city.</p>
        </div>
        <div className="sky-berths">
          {SKILLS.map((skill, i) => <Fragment key={skill.id}>
            <div ref={el => { if (el) berths.current[i] = el; }} className={`sky-berth${up(i) ? ' is-up' : ''}`} data-berth={skill.id} data-project={skill.project}
              style={{ left: geo.lefts[i], width: geo.cardW, '--delay': `${up(i) ? delay.current : 0}s` } as CSSProperties}>
              <a className="sky-card" href={skill.to} tabIndex={-1} aria-hidden="true" onClick={openCard(i)}>
                <Shot ref={el => { if (el) shots.current[i] = el; }} picture={skill.picture} />
              </a>
            </div>
            <canvas ref={el => { if (el) mirrors.current[i] = el; }} className={`sky-mirror${up(i) ? ' is-up' : ''}`} aria-hidden="true"
              style={{ left: geo.lefts[i], width: geo.cardW, '--delay': `${up(i) ? delay.current : 0}s` } as CSSProperties} />
          </Fragment>)}
        </div>
      </div>

      <nav className={`sky-ix${touring ? ' is-touring' : ''}`} aria-labelledby="sky-work" style={{ '--step': `${TOUR_STEP}ms` } as CSSProperties}>
        <h2 className="sky-label sky-in" id="sky-work" style={{ '--i': 3 } as CSSProperties}>What that covers<span aria-hidden="true">{current == null ? pad(SKILLS.length) : `${pad(current + 1)} / ${pad(SKILLS.length)}`}</span></h2>
        <ol onPointerDown={() => { wasUp.current = current; use(); }} onMouseOver={event => { const a = (event.target as Element).closest<HTMLElement>('[data-i]'); if (a && fine) { pick(Number(a.dataset.i)); noticed(); } }}>
          {SKILLS.map((skill, i) => <li key={skill.id} data-row={skill.id} data-project={skill.project} style={{ '--n': i } as CSSProperties}>
            <a ref={el => { if (el) links.current[i] = el; }} className={`sky-head${current === i ? ' is-on' : ''}`} href={`#${skill.id}`} data-i={i}
              onClick={openRow(i)} onFocus={() => pick(i)} aria-expanded={fine ? undefined : current === i}>
              {/* The spaces keep the parts apart for screen readers; a grid ignores them. */}
              <span className="sky-no">{pad(i + 1)}</span>{' '}<span className="sky-nm">{skill.name}</span>{' '}<span className="sky-kd">{skill.proof}</span><span className="sky-sr">. {skill.line}</span>
            </a>
          </li>)}
        </ol>
        <p className="sky-said" aria-hidden="true">{SKILLS.map((skill, i) => <span key={skill.id} className={current === i ? 'is-on' : ''}>{skill.line}</span>)}</p>
        {touring
          ? <p className="sky-how sky-in" style={{ '--i': 6 } as CSSProperties}>Showing each in turn. <button className="sky-pause" onClick={() => { use(); }}>Pause</button></p>
          : <p className={`sky-how${touched ? ' is-done' : ''}`}>{fine ? 'Point at one, or use the arrow keys.' : 'Tap one to raise it, tap again for the proof.'}</p>}
      </nav>
    </header>

    <main className="sky-col sky-main">
      <div className="sky-intro">
        <p className="sky-fade" data-in>I’m 22. I grew up in two small towns and finished a computer science degree at a university in May 2026. Since July I’ve been abroad on a three-month contract, building HR and payroll integrations, and before that I founded <SkyLink className="sky-u" to="/projects/dervo">Dervo</SkyLink>.</p>
        <p className="sky-fade" data-in style={{ '--d': '80ms' } as CSSProperties}>I do my best work on a small team where one person can own a product from the API at the bottom to the words on the buttons. Here’s what that looks like, one part at a time.</p>
      </div>

      <Title meta={pad(SKILLS.length)}>The proof</Title>
      {SKILLS.map((skill, i) => <SkillProof key={skill.id} skill={skill} n={i + 1} />)}

      <Title>Side quests</Title>
      <ul className="sky-links">
        <li data-in><a className="sky-u" href="/drive">The drive</a><span>A 3D Porsche by a lake. Sound on.</span></li>
        <li data-in style={{ '--d': '70ms' } as CSSProperties}><a className="sky-u" href="/work">The road</a><span>The old homepage. Scroll and the Porsche drives.</span></li>
        <li data-in style={{ '--d': '140ms' } as CSSProperties}><a className="sky-u sky-ext" href="https://github.com/brambach/fire-station-33" target="_blank" rel="noopener noreferrer">Fire Station #33</a><span>A Unity game about rescuing hikers from a wildfire. Four of us made it for a class.</span></li>
        <li data-in style={{ '--d': '210ms' } as CSSProperties}><a className="sky-u sky-ext" href="https://github.com/brambach/apple-picker" target="_blank" rel="noopener noreferrer">Apple Picker</a><span>A small Unity game. Catch the good apples, dodge the bad ones.</span></li>
      </ul>
    </main>

    <footer ref={dusk} className="sky-lit sky-finale">
      <canvas ref={duskCanvas} aria-hidden="true" />
      <div className="sky-col">
        <Title>Say hello</Title>
        <ul className="sky-links">
          <li data-in><a className="sky-u" href="mailto:bryce.rambach@gmail.com">bryce.rambach@gmail.com</a><span>Email</span></li>
          <li data-in style={{ '--d': '60ms' } as CSSProperties}><a className="sky-u sky-ext" href="https://www.linkedin.com/in/bryce-rambach/" target="_blank" rel="noopener noreferrer">LinkedIn</a><span>bryce-rambach</span></li>
          <li data-in style={{ '--d': '120ms' } as CSSProperties}><a className="sky-u sky-ext" href="https://x.com/brycerambach" target="_blank" rel="noopener noreferrer">X</a><span>@brycerambach</span></li>
          <li data-in style={{ '--d': '180ms' } as CSSProperties}><a className="sky-u sky-ext" href="https://github.com/brambach" target="_blank" rel="noopener noreferrer">GitHub</a><span>brambach</span></li>
          <li data-in style={{ '--d': '240ms' } as CSSProperties}><a className="sky-u sky-ext" href="/Bryce_Rambach_Resume.pdf" target="_blank" rel="noopener">Resume</a><span>PDF, one page</span></li>
        </ul>
        <p className="sky-sign sky-fade" data-in>Designed and built by me, which is sort of the point.</p>
      </div>
    </footer>

    <div ref={sunLayer} className="sky-sunlayer" aria-hidden="true">
      <div ref={sun} className="sky-traveller"><canvas ref={morning} /><canvas ref={evening} /></div>
      <span ref={clock} className="sky-clock" />
    </div>
  </div>;
}

/** One skill further down the page: what it is, in a few sentences, and the links that back it up. */
function SkillProof({ skill, n }: { skill: Skill; n: number }) {
  return <section id={skill.id} className="sky-skill" aria-labelledby={`${skill.id}-h`}>
    <h3 id={`${skill.id}-h`} className="sky-skill__h sky-fade" data-in tabIndex={-1}><span className="sky-no">{pad(n)}</span>{skill.name}</h3>
    {skill.body.map((text, i) => <p key={i} className="sky-fade" data-in style={{ '--d': `${60 + i * 60}ms` } as CSSProperties}>{text}</p>)}
    <ul className="sky-proof">
      {skill.evidence.map((item, i) => <li key={item.name} className="sky-fade" data-in style={{ '--d': `${120 + i * 60}ms` } as CSSProperties}><ProofLink item={item} /><span>{item.note}</span></li>)}
    </ul>
  </section>;
}

function ProofLink({ item }: { item: Evidence }) {
  if (item.to) return <SkyLink className="sky-u" to={item.to}>{item.name}</SkyLink>;
  if (item.href) return <a className="sky-u sky-ext" href={item.href} target="_blank" rel="noopener noreferrer">{item.name}</a>;
  return <b>{item.name} <small>Private</small></b>;
}
