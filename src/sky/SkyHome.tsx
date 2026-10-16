import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { narrowDawn, startDay, waterFor, type DayLive } from './day';
import { Letters, finePointer, nameForTravel, reduced, SkyLink, useReveal, useSky } from './parts';
import { Shot } from './Shot';
import { WORK } from './work';

const page = (id: string) => `/projects/${id}`;
const pad = (n: number) => String(n).padStart(2, '0');
const INDEX_W = 292;

/** A section title: serif italic rising letter by letter, then a halftone rule draws out. */
function Title({ children, meta }: { children: string; meta?: string }) {
  return <h2 className="sky-title" data-in><span className="sky-t"><Letters text={children} step={28} /></span><span className="sky-rule" />{meta && <span className="sky-meta" aria-hidden="true">{meta}</span>}</h2>;
}

/** Where each project's picture rises on the first screen: right of the index on wide screens, near the middle on
 *  phones, never off the edge. */
function berthsFor(W: number, H: number) {
  const narrow = narrowDawn();
  const cardW = narrow ? Math.min(320, W - 48) : Math.min(380, Math.max(300, W * 0.24));
  const minLeft = narrow ? 24 : 56 + INDEX_W + 40;
  const lefts = WORK.map((_, i) => {
    const spot = narrow ? 0.5 + (i - 2.5) * 0.035 : 0.45 + i * 0.082;
    return Math.min(Math.max(W * spot - cardW / 2, minLeft), W - cardW - 24);
  });
  return { cardW, lefts, centers: lefts.map(l => l + cardW / 2), water: waterFor(H) };
}

/* The front page, as one day. Dawn is the first screen: a wide horizon, the work as a short index on the shore, and
   the picture of whichever project you point at rising out of the water in front of the sun. Then the intro, In
   short and the side quests through the day, and Say hello over the sunset. The sun, the sky and the reflections
   are run by day.ts; this file lays the page out and keeps track of which project is up. */
export default function SkyHome() {
  const { go, arrived, cameFrom } = useSky();
  const back = cameFrom ? WORK.findIndex(w => w.id === cameFrom) : -1;
  const [current, setCurrent] = useState<number | null>(back >= 0 ? back : null);
  const [docked, setDocked] = useState(true);
  // Coming back from a project, its picture is already up: no rising on the first frame.
  const [settled, setSettled] = useState(arrived);
  const [geo, setGeo] = useState(() => berthsFor(typeof window === 'undefined' ? 1280 : document.documentElement.clientWidth, typeof window === 'undefined' ? 800 : innerHeight));
  const [touched, setTouched] = useState(false);
  const delay = useRef(0);
  const wasUp = useRef<number | null>(null);

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
    // Coming from another project the new picture waits for the sun to get most of the way there.
    delay.current = reduced() ? 0 : current == null ? (touched || !arrived ? 0.3 : 0) : 0.42;
    setCurrent(i);
    if (i != null && docked) engine.current?.splash(i, delay.current * 1000 + 200);
    engine.current?.wake();
  };
  const use = () => setTouched(true);
  // Pointing at the list for a moment counts as having found it.
  const pointed = useRef(false);
  const noticed = () => { if (pointed.current) return; pointed.current = true; window.setTimeout(use, 2500); };

  // Back at the top, the current picture rises again.
  useEffect(() => { if (docked && current != null) engine.current?.splash(current, 250); }, [docked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dervo comes up on its own once the sun is up, unless you've already picked something.
  useEffect(() => {
    if (!arrived || back >= 0) return;
    const timer = window.setTimeout(() => setCurrent(c => {
      if (c != null) return c;
      delay.current = 0; engine.current?.splash(0, 200); engine.current?.wake();
      return 0;
    }), reduced() ? 0 : 2600);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Left and right step through the work while you're at the top; Escape lets the picture go.
  const links = useRef<HTMLAnchorElement[]>([]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || !docked) return;
      const inIndex = !!document.activeElement?.closest('.sky-ix');
      if (!(document.activeElement === document.body || inIndex)) return;
      const step = (d: number) => {
        const i = current == null ? (d > 0 ? 0 : WORK.length - 1) : (current + d + WORK.length) % WORK.length;
        links.current[i]?.focus({ preventScroll: true });
        select(i); use();
      };
      if (event.key === 'ArrowRight' || (inIndex && event.key === 'ArrowDown')) { event.preventDefault(); step(1); }
      else if (event.key === 'ArrowLeft' || (inIndex && event.key === 'ArrowUp')) { event.preventDefault(); step(-1); }
      else if (event.key === 'Escape') { select(null); (document.activeElement as HTMLElement | null)?.blur(); }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });

  // Leaving for a project: its picture (if it's up) becomes the project's picture, and its name becomes the title.
  const travel = (i: number) => () => nameForTravel([
    [docked && current === i ? shots.current[i] : null, 'sky-shot'],
    [root.current?.querySelector(`[data-row="${WORK[i].id}"] .sky-nm`), 'sky-title'],
  ]);
  const open = (i: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Touch: the first tap raises it, the second opens it. (Focus lands before the click, so this looks at what
    // was up when the finger went down.)
    if (!finePointer() && wasUp.current !== i) { event.preventDefault(); select(i); use(); return; }
    event.preventDefault();
    go(page(WORK[i].id), travel(i));
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
          <p className="sky-sub sky-in" style={{ '--i': 1 } as CSSProperties}>I design software, then build it myself.</p>
        </div>
        <div className="sky-berths">
          {WORK.map((work, i) => <Fragment key={work.id}>
            <div ref={el => { if (el) berths.current[i] = el; }} className={`sky-berth${up(i) ? ' is-up' : ''}`} data-berth={work.id}
              style={{ left: geo.lefts[i], width: geo.cardW, '--delay': `${up(i) ? delay.current : 0}s` } as CSSProperties}>
              <a className="sky-card" href={page(work.id)} tabIndex={-1} aria-hidden="true" onClick={event => { wasUp.current = i; open(i)(event); }}>
                <Shot ref={el => { if (el) shots.current[i] = el; }} work={work} />
              </a>
            </div>
            <canvas ref={el => { if (el) mirrors.current[i] = el; }} className={`sky-mirror${up(i) ? ' is-up' : ''}`} aria-hidden="true"
              style={{ left: geo.lefts[i], width: geo.cardW, '--delay': `${up(i) ? delay.current : 0}s` } as CSSProperties} />
          </Fragment>)}
        </div>
      </div>

      <nav className="sky-ix" aria-labelledby="sky-work">
        <h2 className="sky-label sky-in" id="sky-work" style={{ '--i': 3 } as CSSProperties}>Selected work<span aria-hidden="true">{current == null ? pad(WORK.length) : `${pad(current + 1)} / ${pad(WORK.length)}`}</span></h2>
        <ol onPointerDown={() => { wasUp.current = current; use(); }} onMouseOver={event => { const a = (event.target as Element).closest<HTMLElement>('[data-i]'); if (a && fine) { select(Number(a.dataset.i)); noticed(); } }}>
          {WORK.map((work, i) => <li key={work.id} data-row={work.id} style={{ '--n': i } as CSSProperties}>
            <a ref={el => { if (el) links.current[i] = el; }} className={`sky-head${current === i ? ' is-on' : ''}`} href={page(work.id)} data-i={i}
              onClick={open(i)} onFocus={() => select(i)} aria-expanded={fine ? undefined : current === i}>
              {/* The spaces keep the parts apart for screen readers; a grid ignores them. */}
              <span className="sky-no">{pad(i + 1)}</span>{' '}<span className="sky-nm">{work.name}</span>{' '}<span className="sky-kd">{work.kind}</span><span className="sky-sr"> {work.line}</span>
            </a>
          </li>)}
        </ol>
        <p className="sky-said" aria-hidden="true">{WORK.map((work, i) => <span key={work.id} className={current === i ? 'is-on' : ''}>{work.line}</span>)}</p>
        <p className={`sky-how sky-in${touched ? ' is-done' : ''}`} style={{ '--i': 6 } as CSSProperties}>{fine ? 'Point at one, or use the arrow keys.' : 'Tap a name to raise it, tap again to open.'}</p>
      </nav>
    </header>

    <main className="sky-col sky-main">
      <div className="sky-intro">
        <p className="sky-fade" data-in>Right now I’m building <SkyLink className="sky-u" to={page('dervo')}>Dervo</SkyLink>, a Mac app for running Claude Code and Codex side by side. You leave your agents working and come back to a few sentences about what finished, what’s stuck and what needs you, instead of four terminals. It’s in private beta. I build Dervo with Dervo.</p>
        <p className="sky-fade" data-in style={{ '--d': '80ms' } as CSSProperties}>Before that I designed and built an <SkyLink className="sky-u" to={page('integration-portal')}>integration portal</SkyLink> for HR and payroll teams, where one wrong field mapping means someone gets paid wrong. Clear wasn’t optional.</p>
      </div>

      <Title>In short</Title>
      <InShort />

      <Title meta="02">Side quests</Title>
      <ul className="sky-links">
        <li data-in><a className="sky-u" href="/drive">The drive</a><span>A 3D Porsche by a lake. Sound on.</span></li>
        <li data-in style={{ '--d': '70ms' } as CSSProperties}><a className="sky-u" href="/work">The road</a><span>The old homepage. Scroll and the Porsche drives.</span></li>
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

/* In short. Words come up from faint as you scroll. The three that name a project then get an underline made of the
   horizon's dots, and a glint runs across them once. Point at one and its dots turn to water. */
const SENTENCE: (string | { text: string; id: string } | { em: string })[] = [
  'I like software that tells you what’s going on. ',
  { text: 'Agents', id: 'dervo' }, ', ', { text: 'payroll', id: 'integration-portal' }, ', ', { text: 'a family’s running streak', id: 'arro' },
  ': different problems, same job. Make the complicated part ', { em: 'easy to read' }, ', then build it properly, from first sketch to signed release.',
];
function InShort() {
  const para = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const p = para.current;
    if (!p) return;
    const words = [...p.querySelectorAll<HTMLElement>('.sky-w')];
    const links = [...p.querySelectorAll<HTMLElement>('.sky-pl')];
    const last = links.map(link => [...link.querySelectorAll('.sky-w')].pop());
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = p.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight * 0.9 - r.top) / (innerHeight * 0.55)));
      const n = words.length, width = 6;
      words.forEach((w, i) => {
        const t = reduced() ? 1 : Math.min(1, Math.max(0, (progress * (n + width) - i) / width));
        w.style.opacity = (0.16 + 0.84 * t * t * (3 - 2 * t)).toFixed(3);
        const li = last.indexOf(w);
        if (li >= 0) {
          const link = links[li], on = t >= 1;
          if (on && !link.classList.contains('lit-up')) { link.classList.add('lit-up'); if (!reduced() && !link.dataset.glinted) { link.dataset.glinted = '1'; link.classList.add('glint'); } }
          else if (!on) link.classList.remove('lit-up');
        }
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => { removeEventListener('scroll', schedule); removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, []);
  const split = (text: string, key: string) => text.split(/(\s+)/).map((part, i) => part.trim() ? <span key={`${key}${i}`} className="sky-w">{part}</span> : <Fragment key={`${key}${i}`}>{part}</Fragment>);
  return <p ref={para} className="sky-about">
    {SENTENCE.map((piece, n) => {
      if (typeof piece === 'string') return <Fragment key={n}>{split(piece, `s${n}-`)}</Fragment>;
      if ('em' in piece) return <em key={n}>{split(piece.em, `e${n}-`)}</em>;
      const words = piece.text.split(' ');
      return <SkyLink key={n} to={page(piece.id)} className="sky-pl">
        {words.map((word, i) => <Fragment key={i}><span className="sky-w sky-pw" style={{ '--wd': `${i * 90}ms`, '--gd': `${i * 70}ms` } as CSSProperties}>{word}</span>{i < words.length - 1 ? ' ' : ''}</Fragment>)}
      </SkyLink>;
    })}
  </p>;
}
