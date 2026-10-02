import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, useVelocity, type MotionValue } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react';
import { InkNote } from '../components/InkNote';
import { SmoothScroll } from '../components/SmoothScroll';
import { StreakNumber } from '../components/StreakNumber';
import { useDrift } from '../components/useDrift';
import { email, streakDay, vibeCards, type VibeCard } from '../lib/site';
import { projectById, type Project } from './catalog';
import { Car } from './FlatCar';
import { covers, ROAD_IDS } from './road-lineup';
import { DEFAULT_LOOK, LOOK_BG, lookQuery, readLook, useSentient, useThemeColor, type Look } from './look';
import './look.css';
import './quiet.css';

// The home page (/, and /next as an alias): a quiet index, one column of text at night.
// The 911 is what moves: it drives in, and when you drag it over the words they step aside and light
// up as it passes. The margin holds four plain photos.
// The look is a set of tokens in look.css; ?look=ink or ?look=bone shows the others, and the links to
// the project pages carry an explicit choice along.

const WORK = [...ROAD_IDS, 'agentsky' as const].map(id => projectById(id)!);
// Pixels dragged to wheel degrees. The tyre is drawn at r=20 of a 320 viewBox and
// .qi-car is 180px wide, so it's about 11px in radius on screen.
const DEG_PER_PX = 180 / (Math.PI * 11.25);
const QUIPS = ['beep.', 'not for sale.', 'someday.', 'mind the words.', 'green, obviously.', 'low and slow.'];

// The four life prints from the earlier site, the 911 first.
const photos = vibeCards.filter((card): card is Extract<VibeCard, { kind: 'photo' }> => card.kind === 'photo');
const PRINTS = [photos[1], photos[0], photos[2], photos[3]];

// The one easing everything here shares: fast off the line, long soft landing, no overshoot.
const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
// Things that come into view in the first moments wait their turn behind the opening sequence;
// anything scrolled to later just arrives.
const loadedAt = performance.now();
const early = () => performance.now() - loadedAt < 1800;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

// Where an element sits inside root from layout alone, so the transforms playing on it don't count.
function layoutBox(el: HTMLElement, root: HTMLElement) {
  let left = 0;
  let top = 0;
  for (let node: HTMLElement | null = el; node && node !== root; node = node.offsetParent as HTMLElement | null) {
    left += node.offsetLeft;
    top += node.offsetTop;
  }
  return { left, top, width: el.offsetWidth, height: el.offsetHeight };
}

// Intro text, one span per letter, so the car can push them. The letters are hidden from
// screen readers and the plain sentence is read instead.
function W({ children, stagger = false }: { children: string; stagger?: boolean }) {
  let n = 0;
  return <>
    <span className="sr-only">{children}</span>
    <span aria-hidden="true">
      {children.split(/(\s+)/).map((part, i) => part.trim() === ''
        ? part
        : <span className="qi-w" key={i}>{[...part].map((ch, j) => <span className="qi-g" data-glyph key={j} style={stagger ? { '--i': n++ } as CSSProperties : undefined}>{ch}</span>)}</span>)}
    </span>
  </>;
}

// Scroll-in for a block: it rises and fades once, a little after the thing before it.
function useRise() {
  const reduce = useReducedMotion();
  return (delay = 0) => reduce ? {} : {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '0px 0px -8% 0px' },
    transition: { duration: 1.05, ease: EXPO, delay: delay + (early() ? 0.75 : 0) },
  };
}

// A margin photo: it's drawn in like a curtain, and the picture drifts inside its frame as you scroll.
function Shot({ print, index }: { print: (typeof PRINTS)[number]; index: number }) {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const drift = useDrift(frame);
  const wait = (early() ? 0.8 : 0) + index * 0.09;
  const view = { once: true, margin: '0px 0px -6% 0px' };
  return <motion.figure
    className="qi-shot"
    initial={reduce ? false : { opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={view}
    transition={{ duration: 1.2, ease: EXPO, delay: wait }}
  >
    <motion.div
      ref={frame}
      className="qi-shot__frame"
      initial={reduce ? false : { clipPath: 'inset(0 0 100% 0)' }}
      whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
      viewport={view}
      transition={{ duration: 1.3, ease: EXPO, delay: wait }}
    >
      {drift
        ? <motion.img src={print.src} alt={print.alt} loading="lazy" decoding="async" draggable={false} style={{ y: drift, scale: 1.12 }} />
        : <img src={print.src} alt={print.alt} loading="lazy" decoding="async" draggable={false} />}
    </motion.div>
    <figcaption>{print.caption}</figcaption>
  </motion.figure>;
}

// The wake: letters near the car lift, lean away, step aside and take on the accent, scaled to
// their own size, and settle back when it has passed. Position is read from layout once, then it's only math.
const WAKE_X = 150;
const WAKE_Y = 80;
function useWake(root: RefObject<HTMLDivElement | null>, car: RefObject<HTMLDivElement | null>, x: MotionValue<number>, y: MotionValue<number>) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const host = root.current;
    const el = car.current;
    if (!host || !el || reduce) return;
    type Glyph = { el: HTMLElement; x: number; y: number; size: number; on: boolean };
    let glyphs: Glyph[] = [];
    let home = { x: 0, y: 0 };

    const update = () => {
      const cx = home.x + x.get();
      const cy = home.y + y.get();
      for (const g of glyphs) {
        const dx = g.x - cx;
        const k = smooth(1 - Math.min(1, Math.abs(dx) / WAKE_X)) * smooth(1 - Math.min(1, Math.abs(g.y - cy) / WAKE_Y));
        if (k < 0.005) {
          if (g.on) { g.el.style.transform = ''; g.el.style.color = ''; g.on = false; }
          continue;
        }
        const side = clamp(dx / 60, -1, 1);
        g.el.style.transform = `translate(${(side * k * g.size * 0.09).toFixed(2)}px, ${(-k * g.size * 0.22).toFixed(2)}px) rotate(${(side * k * 9).toFixed(2)}deg)`;
        g.el.style.color = `color-mix(in srgb, var(--qi-accent) ${Math.round(k * 100)}%, currentColor)`;
        g.on = true;
      }
    };
    const measure = () => {
      const box = layoutBox(el, host);
      home = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      glyphs = [...host.querySelectorAll<HTMLElement>('[data-glyph]')].map(glyph => {
        const at = layoutBox(glyph, host);
        return { el: glyph, x: at.left + at.width / 2, y: at.top + at.height / 2, size: parseFloat(getComputedStyle(glyph).fontSize), on: false };
      });
      update();
    };

    measure();
    // The font can arrive after the first measure, and it changes every letter's width.
    void document.fonts?.ready.then(measure);
    document.fonts?.addEventListener('loadingdone', measure);
    const watch = new ResizeObserver(measure);
    watch.observe(host);
    const stopX = x.on('change', update);
    const stopY = y.on('change', update);
    return () => {
      document.fonts?.removeEventListener('loadingdone', measure);
      watch.disconnect();
      stopX();
      stopY();
      for (const g of glyphs) { g.el.style.transform = ''; g.el.style.color = ''; }
    };
  }, [root, car, x, y, reduce]);
}

function ParkedCar({ bounds, car, x, y, odometer, onGrab }: {
  bounds: RefObject<HTMLDivElement | null>;
  car: RefObject<HTMLDivElement | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  odometer: MotionValue<number>;
  onGrab: () => void;
}) {
  const reduce = useReducedMotion();
  const speed = useVelocity(x);
  const rolled = useMotionValue(0);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [held, setHeld] = useState(false);
  const [ready, setReady] = useState(false);
  const [quip, setQuip] = useState<{ id: number; text: string } | null>(null);
  const taps = useRef(0);
  const arriving = useRef(true);
  const last = useRef({ x: 0, y: 0 });

  // It drives in from off the left edge and parks. The wheels turn on the way in,
  // but only your own driving counts on the odometer.
  useLayoutEffect(() => {
    const el = car.current;
    if (!el || reduce) {
      arriving.current = false;
      setReady(true);
      return;
    }
    arriving.current = true;
    const parkedAt = el.getBoundingClientRect().left - x.get();
    x.set(-(parkedAt + el.offsetWidth + 40));
    const drive = animate(x, 0, {
      duration: 2,
      delay: 0.55,
      ease: EXPO,
      onComplete: () => { arriving.current = false; setReady(true); },
    });
    return () => drive.stop();
  }, [car, reduce, x]);

  // Every pixel it rolls turns the wheels; the ones you drive, including the coast after you let go, are counted.
  const moved = (axis: 'x' | 'y') => (v: number) => {
    const d = Math.abs(v - last.current[axis]);
    last.current[axis] = v;
    rolled.set(rolled.get() + d);
    if (!arriving.current) odometer.set(odometer.get() + d);
  };
  useMotionValueEvent(x, 'change', moved('x'));
  useMotionValueEvent(y, 'change', moved('y'));
  // Turn round only on a clear change of direction, so a wobble doesn't flip it.
  useMotionValueEvent(speed, 'change', v => {
    if (arriving.current && v < 0) return;
    if (v > 60) setFacing(1);
    else if (v < -60) setFacing(-1);
  });

  useEffect(() => {
    if (!quip) return;
    const gone = setTimeout(() => setQuip(null), 1700);
    return () => clearTimeout(gone);
  }, [quip]);

  const pace = useSpring(useTransform(speed, v => Math.abs(v)), { stiffness: 200, damping: 30 });
  const wheel = useTransform(rolled, d => d * DEG_PER_PX);
  const pitch = useTransform(pace, [0, 1500], [0, -2.5]);
  const blur = useTransform(pace, [500, 1400], [0, 1]);
  const exhaust = useTransform(pace, [0, 60, 400], [0, 0.4, 0.9]);
  const lights = useTransform(pace, [0, 200], [0, 0.8]);

  return <motion.div
    className="qi-car"
    ref={car}
    role="img"
    aria-label="A flat green Porsche 911 you can drag around the page"
    drag
    dragListener={ready}
    // Bounds only once it has parked. While it's still driving in from off screen, a layout shift
    // (like the font arriving) would otherwise make Motion snap it back inside the page.
    dragConstraints={ready ? bounds : undefined}
    dragElastic={0.08}
    dragMomentum={!reduce}
    dragTransition={{ power: 0.25, timeConstant: 320 }}
    whileDrag={{ scale: 1.04 }}
    onDragStart={() => { setHeld(true); onGrab(); }}
    onDragEnd={() => setHeld(false)}
    onTap={() => {
      if (!ready) return;
      taps.current += 1;
      setQuip({ id: taps.current, text: QUIPS[(taps.current - 1) % QUIPS.length] });
    }}
    style={{ x, y }}
  >
    <div className={facing < 0 ? 'qi-car__face qi-car__face--left' : 'qi-car__face'}>
      <Car pitch={pitch} wheel={wheel} blur={blur} exhaust={exhaust} lights={lights} revving={held} />
    </div>
    <AnimatePresence>
      {quip && <motion.span
        key={quip.id}
        className="qi-quip"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.7, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      >{quip.text}</motion.span>}
    </AnimatePresence>
  </motion.div>;
}

// Hover a row on a mouse and its cover arrives as a print that follows the cursor
// and swings with it. Phones and keyboards-only get the plain list.
function WorkList({ search }: { search: string }) {
  const rise = useRise();
  const [fine, setFine] = useState(false);
  const [active, setActive] = useState<Project | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 260, damping: 28, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 260, damping: 28, mass: 0.6 });
  const swing = useSpring(useTransform(useVelocity(px), v => clamp(v / 110, -5, 5)), { stiffness: 140, damping: 14 });

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const place = (clientX: number, clientY: number) => {
    px.set(clientX + (clientX > window.innerWidth - 300 ? -270 : 28));
    py.set(clientY - 80);
  };
  const show = (project: Project, clientX: number, clientY: number) => {
    if (!active) {
      place(clientX, clientY);
      sx.jump(px.get());
      sy.jump(py.get());
    }
    setActive(project);
    setSeen(ids => ids.includes(project.id) ? ids : [...ids, project.id]);
  };
  const enter = (project: Project) => (e: PointerEvent<HTMLElement>) => { if (e.pointerType === 'mouse') show(project, e.clientX, e.clientY); };
  const focus = (project: Project) => (e: { currentTarget: HTMLElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    show(project, rect.left + rect.width * 0.6, rect.top + rect.height / 2);
  };

  return <>
    <ol onPointerMove={e => { if (e.pointerType === 'mouse') place(e.clientX, e.clientY); }} onPointerLeave={() => setActive(null)}>
      {WORK.map((project, i) => <motion.li key={project.id} onPointerEnter={enter(project)} {...rise(i * 0.07)}>
        <a className="qi-row group" href={`/projects/${project.id}${search}`} onFocus={focus(project)} onBlur={() => setActive(null)}>
          <span className="qi-row__name">{project.name}</span>
          <span className="leader-dots" aria-hidden="true" />
          <span className="qi-row__status">{project.status}</span>
        </a>
        <p className="qi-row__line">{project.line}</p>
        {project.id === 'dervo' && <InkNote className="qi-start" rotate={0} delay={0.2}>
          start here
          <svg aria-hidden="true" viewBox="0 0 48 24" width="36" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12 H45 M37 4 L45 12 L37 20" />
          </svg>
        </InkNote>}
      </motion.li>)}
    </ol>
    <AnimatePresence>
      {fine && active && <motion.div
        className="qi-print"
        aria-hidden="true"
        style={{ x: sx, y: sy, rotate: swing }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      >
        <figure className="qi-print__sheet">
          <div className="qi-print__art">
            {WORK.map(project => {
              if (!seen.includes(project.id)) return null;
              const on = project.id === active.id ? ' is-on' : '';
              return covers[project.id]
                ? <img key={project.id} className={`qi-print__img${on}`} src={covers[project.id]} alt="" draggable={false} />
                : <span key={project.id} className={`qi-print__img qi-print__img--dark${on}`}><i /></span>;
            })}
          </div>
          <figcaption>{active.category}</figcaption>
        </figure>
      </motion.div>}
    </AnimatePresence>
  </>;
}

export default function QuietIndex() {
  const page = useRef<HTMLDivElement>(null);
  const car = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const odometer = useMotionValue(0);
  const rise = useRise();
  const [grabbed, setGrabbed] = useState(false);
  const [asked] = useState(readLook);
  const look: Look = asked ?? DEFAULT_LOOK;
  // 1px on screen is 1cm of road.
  const metres = useTransform(odometer, d => (d / 100).toFixed(1));

  useEffect(() => { document.title = 'Bryce Rambach'; }, []);
  useSentient();
  useThemeColor(LOOK_BG[look]);
  useWake(page, car, x, y);

  const at = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

  return <SmoothScroll>
    <div className="qi" ref={page} data-look={look}>
      <header className="qi-nav">
        <a className="qi-nav__name" href={`/${lookQuery(asked)}`}>Bryce Rambach</a>
        <nav aria-label="Sections">
          <a className="ink-link" href="#work">work</a>
          <a className="ink-link" href="#now">now</a>
          <a className="ink-link" href="/drive">the drive</a>
          <a className="ink-link" href="/work">the road</a>
        </nav>
      </header>

      <main className="qi-main">
        <div className="qi-car-spot">
          <span className="qi-road" aria-hidden="true" />
          <ParkedCar bounds={page} car={car} x={x} y={y} odometer={odometer} onGrab={() => setGrabbed(true)} />
          <AnimatePresence>
            {!grabbed && <motion.div className="qi-grab" exit={{ opacity: 0, transition: { duration: 0.3 } }}>
              <InkNote className="qi-grab__note" rotate={0} delay={2.3}>
                <svg aria-hidden="true" viewBox="0 0 48 24" width="36" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M46 12 H3 M11 4 L3 12 L11 20" />
                </svg>
                grab it.<span className="qi-grab__more"> go on.</span>
              </InkNote>
            </motion.div>}
          </AnimatePresence>
        </div>

        <section className="qi-intro">
          <h1 className="qi-hello"><W stagger>I’m Bryce.</W></h1>
          <p className="qi-lede qi-in" style={at(0.85)}>
            <W>I </W><span className="qi-mark"><W>design</W></span><W> software, then I </W><span className="qi-mark qi-mark--late"><W>build</W></span><W> it.</W>
          </p>
          <p className="qi-in" style={at(1)}>
            <W>Right now that's </W><a className="ink-link" href={`/projects/dervo${lookQuery(asked)}`}><W>Dervo</W></a><W>, a Mac app for running Claude Code and
            Codex side by side. It tells you what finished, what's stuck and what needs you. It's in private beta.</W>
          </p>
          <p className="qi-in" style={at(1.12)}>
            <W>As an employee I designed and built an integration portal for HR and payroll teams. There's also Lucid, Arro,
            Port and AgentSky. They're all on the </W><a className="ink-link" href="#work"><W>work</W></a><W> list below.</W>
          </p>
          <p className="qi-hint qi-in" style={at(1.24)}>the 3D version of that car lives at <a href="/drive">/drive</a>.</p>
          <p className="qi-in" style={at(1.36)}>Write to me at <a className="ink-link" href={`mailto:${email}`}>{email}</a>.</p>
        </section>

        <aside className="qi-margin" aria-label="Photos">
          {PRINTS.map((print, i) => <Shot key={print.src} print={print} index={i} />)}
        </aside>

        <section id="work" className="qi-work" aria-labelledby="qi-work">
          <motion.h2 id="qi-work" className="qi-label" {...rise()}>work</motion.h2>
          <WorkList search={lookQuery(asked)} />
        </section>

        <section id="now" className="qi-now" aria-labelledby="qi-now">
          <motion.h2 id="qi-now" className="qi-label" {...rise()}>now</motion.h2>
          <ul>
            <motion.li {...rise(0.05)}>building Dervo. invited testers, apple silicon macs.</motion.li>
            <motion.li {...rise(0.12)}>day <StreakNumber value={streakDay} /> of the running streak.</motion.li>
            <motion.li {...rise(0.19)}>next: building my own thing. sf or nyc, soon.</motion.li>
          </ul>
        </section>
      </main>

      <motion.footer className="qi-foot" {...rise()}>
        <p className="qi-foot__sign">drive safe.</p>
        <span>the someday car</span>
        <span>driven <motion.span>{metres}</motion.span> m on this page</span>
      </motion.footer>
    </div>
  </SmoothScroll>;
}
