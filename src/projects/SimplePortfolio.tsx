import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react';
import {
  motion, useMotionTemplate, useMotionValueEvent, useReducedMotion, useScroll, useSpring,
  useTransform, useVelocity, type MotionValue,
} from 'motion/react';
import { useLenis } from 'lenis/react';
import { SmoothScroll } from '../components/SmoothScroll';
import { archive, projects, type Project } from './catalog';
import { email } from '../lib/site';
import './simple.css';

const covers: Partial<Record<Project['id'], string>> = {
  agentsky: '/project-lab/sky.png',
  dervo: '/projects/dervo/decision.png',
  lucid: '/projects/lucid/spec.png',
  arro: '/projects/arro/today-sample.png',
  'integration-portal': '/projects/portal/hub.png',
};

// small alternating tilts so the grid feels pinned up, not printed
const tilts = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9];

/* Design directions under exploration. Each look sets its type, colour and car paint in simple.css;
   the sky and sun change with scroll, so their colours live here. */
const looks = {
  plus: { label: 'Original+', sky: ['#f6dcc0', '#e9efe6', '#f0d49a', '#e59a6e', '#34445a'], sun: ['#f2b66d', '#fbe7a6', '#e8733f', '#f1e6c8'] },
  daylight: { label: 'Daylight', sky: ['#e9eff6', '#f4f6f9', '#f5eee4', '#e8cfc3', '#1b2231'], sun: ['#ffd7a6', '#fff3d1', '#ffae86', '#e8e6ef'] },
  graphite: { label: 'Graphite', sky: ['#2b2e34', '#2a2d32', '#302d31', '#2d2733', '#141519'], sun: ['#6b6f76', '#8a8e95', '#8a6f66', '#d9d9d6'] },
  paper: { label: 'Paper', sky: ['#f2ebdf', '#eee8db', '#ecdabc', '#dcab8f', '#2b2833'], sun: ['#e6a468', '#f2d79d', '#d9683f', '#efe6d0'] },
  original: { label: 'Original', sky: ['#f6dcc0', '#e9efe6', '#f0d49a', '#e59a6e', '#34445a'], sun: ['#f2b66d', '#fbe7a6', '#e8733f', '#f1e6c8'] },
} as const;
type Look = keyof typeof looks;
const skyStops = [0, 0.3, 0.62, 0.84, 1];

// where the middle of the car sits on screen; matches .sp-car-lane in simple.css
const carCentre = () => window.innerWidth * 0.08 + Math.min(380, Math.max(200, window.innerWidth * 0.3)) / 2;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function lookFromUrl(): Look {
  const look = new URLSearchParams(window.location.search).get('look');
  return look && look in looks ? look as Look : 'plus';
}

export default function SimplePortfolio() {
  const reduced = useReducedMotion() ?? false;
  const [look, setLook] = useState<Look>(lookFromUrl);
  useEffect(() => {
    const title = document.title;
    document.title = 'Work / Bryce Rambach';
    return () => { document.title = title; };
  }, []);
  const choose = (next: Look) => {
    setLook(next);
    const url = new URL(window.location.href);
    url.searchParams.set('look', next);
    window.history.replaceState(null, '', url);
  };
  return <SmoothScroll>
    <main className="sp-page" data-look={look} aria-label="Bryce Rambach's work">
      <header className="sp-nav">
        <span className="sp-nav__name">Bryce Rambach</span>
        <div className="sp-looks" role="radiogroup" aria-label="Design direction">
          {(Object.keys(looks) as Look[]).map(key => <button key={key} type="button" role="radio" aria-checked={look === key} onClick={() => choose(key)}>{looks[key].label}</button>)}
        </div>
        <a href="/">Skip to the drive <span aria-hidden="true">→</span></a>
      </header>
      {/* keyed so the sky palette is rebuilt when the look changes */}
      {reduced ? <StaticWork /> : <Drive key={look} look={look} />}
      <section className="sp-more" aria-labelledby="sp-more-title">
        <h2 id="sp-more-title">Also in the glovebox</h2>
        <ul>{archive.map(item => <li key={item.name}><strong>{item.name}</strong><span>{item.kind}</span></li>)}</ul>
      </section>
      <footer className="sp-foot">
        <p>Want to make something together?</p>
        <a className="sp-foot__hello" href={`mailto:${email}`}>Say hello</a>
        <a href="/">Or take the Porsche out <span aria-hidden="true">→</span></a>
      </footer>
    </main>
  </SmoothScroll>;
}

/* The drive: vertical scroll moves a horizontal road past the car. */
function Drive({ look }: { look: Look }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const [stop, setStop] = useState(-1);
  const [revving, setRevving] = useState(false);
  const lenis = useLenis();

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setTravel(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const { scrollYProgress: progress, scrollY } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const distance = useTransform(progress, p => p * travel);
  const trackX = useTransform(distance, d => -d);

  // speed drives the wheels' blur, the exhaust and the suspension
  const velocity = useVelocity(scrollY);
  const speed = useSpring(useTransform(velocity, v => Math.min(Math.abs(v), 4000)), { stiffness: 120, damping: 24 });
  // an underdamped spring lags the real speed, so the body squats pulling away and dips when it stops
  const lag = useSpring(velocity, { stiffness: 90, damping: 9 });
  const pitch = useTransform(() => Math.max(-3, Math.min(3, (lag.get() - velocity.get()) / 900)));
  const mph = useTransform(speed, s => Math.round(s / 30));
  const wheel = useTransform(distance, d => d * 0.9);
  const blur = useTransform(speed, [0, 2500], [0, 1]);
  const exhaust = useTransform(speed, [0, 1500], [0.25, 0.9]);
  const lines = useTransform(speed, [300, 2500], [0, 0.8]);
  // the car holds its lane, then rolls forward and parks under the overlook sign
  const carX = useTransform(progress, [0, 0.9, 1], ['0vw', '0vw', '26vw']);

  const sky = useTransform(progress, skyStops, [...looks[look].sky]);
  const sunX = useTransform(progress, [0, 1], ['8%', '92%']);
  const sunY = useTransform(progress, p => `${62 - Math.sin(p * Math.PI) * 48}%`);
  const sunColour = useTransform(progress, [0, 0.5, 0.85, 1], [...looks[look].sun]);
  const night = useTransform(progress, [0.7, 1], [0, 1]);
  const stars = useTransform(progress, [0.85, 1], [0, 1]);
  const lights = useTransform(progress, [0.72, 0.85], [0, 1]);
  // the road and verges sit in front of the dusk overlay, so they darken on their own
  const dim = useTransform(night, n => `brightness(${1 - n * 0.5})`);

  // Original+ only: the headline leans into the car's draft and words hop as the car passes under them
  const playful = look === 'plus';
  const lean = useSpring(useTransform(velocity, v => playful ? clamp(-v / 260, -9, 9) : 0), { stiffness: 160, damping: 14 });
  const note = useTransform(progress, [0, 0.03], [1, 0]);

  const far = useMotionTemplate`${useTransform(distance, d => -d * 0.12)}px 100%`;
  const mid = useMotionTemplate`${useTransform(distance, d => -d * 0.35)}px 100%`;
  const near = useMotionTemplate`${useTransform(distance, d => -d * 1.35)}px 100%`;
  const dashes = useMotionTemplate`${trackX}px 50%`;

  useMotionValueEvent(progress, 'change', p => {
    const el = track.current;
    if (!el) return;
    const middle = p * travel + window.innerWidth * 0.5;
    const stops = [...el.querySelectorAll<HTMLElement>('[data-stop]')];
    if (!stops.length || middle < stops[0].offsetLeft - window.innerWidth * 0.25) return setStop(-1);
    const next = stops.findIndex(s => middle < s.offsetLeft + s.offsetWidth);
    setStop(next === -1 ? stops.length : next);
  });

  // keyboard users tab along the billboards, so scroll the page to whichever one gets focus
  const bringIntoView = (event: FocusEvent<HTMLElement>) => {
    const panel = event.currentTarget.closest<HTMLElement>('.sp-panel') ?? event.currentTarget;
    const top = (section.current?.offsetTop ?? 0) + panel.offsetLeft + panel.offsetWidth / 2 - window.innerWidth / 2;
    const clamped = Math.max(section.current?.offsetTop ?? 0, Math.min(top, (section.current?.offsetTop ?? 0) + travel));
    if (lenis) lenis.scrollTo(clamped, { immediate: true });
    else window.scrollTo({ top: clamped });
  };

  const current = stop >= 0 && stop < projects.length ? projects[stop] : null;
  // the parallax layers are background tiles in Original and masked silhouettes in the other looks
  const layer = (position: MotionValue<string>) => ({ backgroundPosition: position, maskPosition: position, WebkitMaskPosition: position });

  return <section ref={section} className="sp-drive" style={{ height: `calc(${travel}px + 100svh)` }} aria-label="Selected work">
    <motion.div className="sp-scene" style={{ backgroundColor: sky }}>
      <motion.div className="sp-stars" style={{ opacity: stars }} aria-hidden="true" />
      <motion.div className="sp-sun" style={{ left: sunX, top: sunY, backgroundColor: sunColour }} aria-hidden="true" />
      <motion.div className="sp-layer sp-layer--far" style={layer(far)} aria-hidden="true" />
      <motion.div className="sp-layer sp-layer--mid" style={layer(mid)} aria-hidden="true" />

      {/* dusk dims the land, not the lit billboards */}
      <motion.div className="sp-night" style={{ opacity: night }} aria-hidden="true" />
      <motion.div ref={track} className="sp-track" style={{ x: trackX }}>
        <div className="sp-panel sp-panel--hello">
          <span className="sp-eyebrow">Portfolio · 2026</span>
          {playful
            ? <motion.h1 className="sp-headline" aria-label="Hi, I’m Bryce. I design and build software you can feel." style={{ skewX: lean }}>
                <Words text="Hi, I’m Bryce." distance={distance} speed={speed} first={0} />
                <br/>
                <em><Words text="I design and build software you can feel." distance={distance} speed={speed} first={3} /></em>
              </motion.h1>
            : <h1>Hi, I’m Bryce.<br/><em>I design and build software you can feel.</em></h1>}
          <p>Six projects down the road. Scroll to drive.</p>
          <span className="sp-hint" aria-hidden="true"><span className="sp-hint__line" />Scroll</span>
        </div>
        {projects.map((project, i) => <Billboard key={project.id} project={project} index={i} onFocus={bringIntoView} playful={playful} active={stop === i} distance={distance} speed={speed} />)}
        <div className="sp-panel sp-panel--overlook">
          <div className="sp-signpost" aria-hidden="true"><span>Tahoe overlook</span><span>1 mi</span></div>
          <h2>Want to drive it yourself?</h2>
          <p>The rest of the road is in 3D. Open the door, turn the key, take it to the lake.</p>
          <div className="sp-overlook__actions">
            <a className="sp-foot__hello" href="/" onFocus={bringIntoView} onMouseEnter={() => setRevving(true)} onMouseLeave={() => setRevving(false)}>Take the wheel <span aria-hidden="true">→</span></a>
            <a href={`mailto:${email}`}>Or just say hello</a>
          </div>
        </div>
      </motion.div>

      <motion.div className="sp-road" style={{ filter: dim }} aria-hidden="true"><motion.div className="sp-road__dashes" style={{ backgroundPosition: dashes }} /></motion.div>
      <motion.div className="sp-car-lane" style={{ x: carX }} aria-hidden="true">
        <motion.div className="sp-speedlines" style={{ opacity: lines }} />
        <Car pitch={pitch} wheel={wheel} blur={blur} exhaust={exhaust} lights={lights} revving={revving} />
      </motion.div>
      <motion.div className="sp-layer sp-layer--near" style={{ ...layer(near), filter: dim }} aria-hidden="true" />
      {playful && <motion.div className="sp-note" style={{ opacity: note }} aria-hidden="true">
        <span>that’s me</span>
        <svg viewBox="0 0 44 40"><path d="M4 6 C 20 2, 34 10, 34 30 M26 24 L34 32 L40 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </motion.div>}

      <div className="sp-dash" aria-hidden="true">
        <span className="sp-dash__speed"><motion.span>{mph}</motion.span> mph</span>
        <span className="sp-dash__stop">{current ? <><b>{String(stop + 1).padStart(2, '0')}</b> {current.name}</> : stop === -1 ? 'Engine on' : 'Overlook ahead'}</span>
      </div>
    </motion.div>
  </section>;
}

type Motion = { distance: MotionValue<number>; speed: MotionValue<number> };

function Billboard({ project, index, onFocus, playful, active, distance, speed }: Motion & {
  project: Project; index: number; onFocus: (event: FocusEvent<HTMLElement>) => void; playful: boolean; active: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const centre = useRef(0);
  useLayoutEffect(() => {
    const measure = () => { if (panel.current) centre.current = panel.current.offsetLeft + panel.current.offsetWidth / 2; };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  // the car's draft rocks the board on its posts as it passes, harder the faster you go
  const gust = useTransform(() => {
    if (!playful) return 0;
    const reach = Math.max(1, (panel.current?.offsetWidth ?? 500) * 0.8);
    const near = Math.max(0, 1 - Math.abs(centre.current - distance.get() - carCentre()) / reach);
    return near * Math.min(1, speed.get() / 2500) * -4;
  });
  const sway = useSpring(gust, { stiffness: 140, damping: 6 });
  return <div ref={panel} className="sp-panel sp-panel--stop" data-stop style={{ '--tilt': `${tilts[index % tilts.length]}deg` } as CSSProperties}>
    <span className="sp-mile" aria-hidden="true">Mile {String(index + 1).padStart(2, '0')}</span>
    <motion.div className="sp-sway" style={{ rotate: sway }}>
      <a className="sp-board" href={`/projects/${project.id}`} onFocus={onFocus} aria-label={`${project.name}: ${project.line}`}>
        <div className={`sp-board__art sp-card__art--${project.id}`} aria-hidden="true">
          {covers[project.id] ? <img src={covers[project.id]} alt="" loading="lazy"/> : <span className="sp-card__line"/>}
        </div>
        <div className="sp-board__text">
          <span className="sp-card__tag">{project.category}</span>
          {/* in Original+ the name does a little wave when you pull up to it */}
          <h2>{playful
            ? <span className="sp-board__name">{[...project.name].map((letter, i) => <motion.span key={i} animate={active ? { y: [0, -7, 0], rotate: [0, -4, 0] } : { y: 0, rotate: 0 }} transition={{ duration: 0.45, delay: i * 0.035, ease: 'easeOut' }}>{letter}</motion.span>)}</span>
            : project.name}</h2>
          <p>{project.line}</p>
          <span className="sp-board__go">Pull over <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </motion.div>
    <span className="sp-posts" aria-hidden="true" />
  </div>;
}

/* Headline words that settle in on load, then hop as the car drives under them. */
function Words({ text, distance, speed, first }: Motion & { text: string; first: number }) {
  const words = text.split(' ');
  return <>{words.map((word, i) => <Fragment key={i}>
    <Word word={word} distance={distance} speed={speed} order={first + i} />
    {i < words.length - 1 ? ' ' : null}
  </Fragment>)}</>;
}

function Word({ word, distance, speed, order }: Motion & { word: string; order: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const centre = useRef(0);
  useLayoutEffect(() => {
    const measure = () => { if (el.current) centre.current = el.current.offsetLeft + el.current.offsetWidth / 2; };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const lift = useTransform(() => {
    const near = Math.max(0, 1 - Math.abs(centre.current - distance.get() - carCentre()) / 170);
    return near * Math.min(1, speed.get() / 1100) * -24;
  });
  const y = useSpring(lift, { stiffness: 420, damping: 11 });
  const rotate = useTransform(y, v => v * 0.25);
  // the outer span pops the word in on load; the inner one does the hop
  return <motion.span ref={el} className="sp-word" aria-hidden="true"
    initial={{ opacity: 0, scale: 0.6, rotate: order % 2 ? 8 : -8 }}
    animate={{ opacity: 1, scale: 1, rotate: 0 }}
    transition={{ type: 'spring', stiffness: 260, damping: 13, delay: 0.15 + order * 0.06 }}>
    <motion.span className="sp-word" style={{ y, rotate }}>{word}</motion.span>
  </motion.span>;
}

type CarProps = { pitch: MotionValue<number>; wheel: MotionValue<number>; blur: MotionValue<number>; exhaust: MotionValue<number>; lights: MotionValue<number>; revving: boolean };

// A flat side-on 911, facing right. Wheels turn with distance; the body rides on the springs.
// Paint, glass and rims come from the look's CSS variables.
function Car({ pitch, wheel, blur, exhaust, lights, revving }: CarProps) {
  return <div className={revving ? 'sp-car sp-car--rev' : 'sp-car'}>
    <motion.div className="sp-car__beam" style={{ opacity: lights }} />
    <motion.div className="sp-car__exhaust" style={{ opacity: exhaust }}><i /><i /><i /></motion.div>
    <svg viewBox="0 0 320 120" role="img">
      <defs>
        <linearGradient id="sp-paint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="sp-paint-hi" />
          <stop offset="0.55" className="sp-paint" />
          <stop offset="1" className="sp-paint-lo" />
        </linearGradient>
        <linearGradient id="sp-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="sp-glass-hi" />
          <stop offset="1" className="sp-glass" />
        </linearGradient>
        <radialGradient id="sp-shadow"><stop offset="0" className="sp-shadow" /><stop offset="1" className="sp-shadow" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="160" cy="108" rx="150" ry="8" fill="url(#sp-shadow)" />
      <motion.g className="sp-car__body" style={{ rotate: pitch, originX: '50%', originY: '90%' }}>
        <g className="sp-car__idle">
          <path fill="url(#sp-paint)" d="M24 90 C14 89 9 82 11 73 C13 64 22 57 36 51 C60 39 92 23 128 18 C150 15 170 16 184 22 C196 28 206 38 215 46 L238 50 C260 52 282 56 297 62 C306 66 310 74 308 82 C306 88 300 90 292 90 Z" />
          <path fill="url(#sp-paint)" d="M236 60 C244 44 276 42 292 58 Z" />
          <path className="sp-car__duck" fill="url(#sp-paint)" d="M34 52 L20 45 L44 42 Z" />
          <path className="sp-car__crease" fill="none" strokeWidth="2" strokeLinecap="round" d="M44 46 C70 32 100 21 130 19 C152 17 170 18 182 24" />
          <path fill="url(#sp-glass)" d="M98 44 C120 30 146 23 170 23 C184 23 194 30 203 42 L203 44 Z" />
          <path className="sp-car__pillar" strokeWidth="5" d="M160 23 L158 45" />
          <path className="sp-car__seam" fill="none" strokeWidth="1.2" d="M158 49 L156 82 M210 46 C214 60 214 74 210 84" />
          <rect className="sp-car__seam-fill" x="186" y="56" width="14" height="2.5" rx="1.25" />
          <path fill="url(#sp-paint)" d="M204 41 C206 36 214 34 217 38 L214 42 Z" />
          <ellipse className="sp-car__lamp" cx="278" cy="52" rx="7" ry="6" transform="rotate(-18 278 52)" />
          <circle className="sp-car__lamp-core" cx="279" cy="52" r="2.5" />
          <rect className="sp-car__tail" x="10" y="70" width="12" height="4" rx="2" />
          <rect className="sp-car__stripe" x="100" y="75" width="112" height="2" rx="1" />
          <circle className="sp-car__arch" cx="72" cy="90" r="25" />
          <circle className="sp-car__arch" cx="250" cy="90" r="25" />
        </g>
      </motion.g>
      <Wheel cx={72} rotate={wheel} blur={blur} />
      <Wheel cx={250} rotate={wheel} blur={blur} />
    </svg>
  </div>;
}

function Wheel({ cx, rotate, blur }: { cx: number; rotate: MotionValue<number>; blur: MotionValue<number> }) {
  return <g transform={`translate(${cx} 90)`}>
    <circle className="sp-tyre" r="20" />
    <motion.g style={{ rotate }}>
      <circle className="sp-rim" r="12.5" />
      {[0, 72, 144, 216, 288].map(a => <path key={a} className="sp-spoke" transform={`rotate(${a})`} d="M-3 -2 L-2 -11 L2 -11 L3 -2 Z" />)}
      <circle className="sp-hub" r="3" />
    </motion.g>
    {/* at speed the spokes smear into a disc */}
    <motion.circle className="sp-rim-blur" r="12.5" style={{ opacity: blur }} />
  </g>;
}

/* Reduced motion gets the plain pinned-up grid instead of the drive. */
function StaticWork() {
  return <>
    <section className="sp-hero">
      <h1>Hi, I’m Bryce.<br/><em>I design and build software you can feel.</em></h1>
      <p>Interfaces, systems and small rituals. Here’s what I’ve been making.</p>
    </section>
    <section className="sp-grid" aria-label="Selected work">
      {projects.map((project, i) => <a key={project.id} className="sp-card" href={`/projects/${project.id}`} style={{ '--tilt': `${tilts[i % tilts.length]}deg` } as CSSProperties} aria-label={`${project.name}: ${project.line}`}>
        <div className={`sp-card__art sp-card__art--${project.id}`} aria-hidden="true">
          {covers[project.id] ? <img src={covers[project.id]} alt="" loading="lazy"/> : <span className="sp-card__line"/>}
        </div>
        <div className="sp-card__text">
          <span className="sp-card__tag">{project.category}</span>
          <h2>{project.name}</h2>
          <p>{project.line}</p>
          <span className="sp-card__status">{project.status}</span>
        </div>
      </a>)}
    </section>
  </>;
}
