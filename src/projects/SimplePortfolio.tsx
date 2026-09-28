import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react';
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

// morning to blue hour across the length of the drive
const skyStops = [0, 0.3, 0.62, 0.84, 1];
const skyColours = ['#f6dcc0', '#e9efe6', '#f0d49a', '#e59a6e', '#34445a'];

export default function SimplePortfolio() {
  const reduced = useReducedMotion() ?? false;
  useEffect(() => {
    const title = document.title;
    document.title = 'Work / Bryce Rambach';
    return () => { document.title = title; };
  }, []);
  return <SmoothScroll>
    <main className="sp-page" aria-label="Bryce Rambach's work">
      <header className="sp-nav">
        <span className="sp-nav__name">Bryce Rambach</span>
        <a href="/">Skip to the drive <span aria-hidden="true">→</span></a>
      </header>
      {reduced ? <StaticWork /> : <Drive />}
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
function Drive() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const [stop, setStop] = useState(-1);
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
  const [revving, setRevving] = useState(false);

  const sky = useTransform(progress, skyStops, skyColours);
  const sunX = useTransform(progress, [0, 1], ['8%', '92%']);
  const sunY = useTransform(progress, p => `${62 - Math.sin(p * Math.PI) * 48}%`);
  const sunColour = useTransform(progress, [0, 0.5, 0.85, 1], ['#f2b66d', '#fbe7a6', '#e8733f', '#f1e6c8']);
  const night = useTransform(progress, [0.7, 1], [0, 0.5]);
  const stars = useTransform(progress, [0.85, 1], [0, 1]);
  const lights = useTransform(progress, [0.72, 0.85], [0, 1]);

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

  return <section ref={section} className="sp-drive" style={{ height: `calc(${travel}px + 100svh)` }} aria-label="Selected work">
    <motion.div className="sp-scene" style={{ backgroundColor: sky }}>
      <motion.div className="sp-stars" style={{ opacity: stars }} aria-hidden="true" />
      <motion.div className="sp-sun" style={{ left: sunX, top: sunY, backgroundColor: sunColour }} aria-hidden="true" />
      <motion.div className="sp-layer sp-layer--far" style={{ backgroundPosition: far }} aria-hidden="true" />
      <motion.div className="sp-layer sp-layer--mid" style={{ backgroundPosition: mid }} aria-hidden="true" />

      {/* dusk dims the land, not the lit billboards */}
      <motion.div className="sp-night" style={{ opacity: night }} aria-hidden="true" />
      <motion.div ref={track} className="sp-track" style={{ x: trackX }}>
        <div className="sp-panel sp-panel--hello">
          <h1>Hi, I’m Bryce.<br/><em>I design and build software you can feel.</em></h1>
          <p>Six projects down the road. Scroll to drive.</p>
          <span className="sp-hint" aria-hidden="true">Scroll <span>↓</span></span>
        </div>
        {projects.map((project, i) => <Billboard key={project.id} project={project} index={i} onFocus={bringIntoView} />)}
        <div className="sp-panel sp-panel--overlook">
          <div className="sp-signpost" aria-hidden="true"><span>Tahoe overlook</span><span>▲ 1 mi</span></div>
          <h2>Want to drive it yourself?</h2>
          <p>The rest of the road is in 3D. Open the door, turn the key, take it to the lake.</p>
          <div className="sp-overlook__actions">
            <a className="sp-foot__hello" href="/" onFocus={bringIntoView} onMouseEnter={() => setRevving(true)} onMouseLeave={() => setRevving(false)}>Take the wheel <span aria-hidden="true">→</span></a>
            <a href={`mailto:${email}`}>Or just say hello</a>
          </div>
        </div>
      </motion.div>

      <div className="sp-road" aria-hidden="true"><motion.div className="sp-road__dashes" style={{ backgroundPosition: dashes }} /></div>
      <motion.div className="sp-car-lane" style={{ x: carX }} aria-hidden="true">
        <motion.div className="sp-speedlines" style={{ opacity: lines }} />
        <Car pitch={pitch} wheel={wheel} blur={blur} exhaust={exhaust} lights={lights} revving={revving} />
      </motion.div>
      <motion.div className="sp-layer sp-layer--near" style={{ backgroundPosition: near }} aria-hidden="true" />

      <div className="sp-dash" aria-hidden="true">
        <span className="sp-dash__speed"><motion.span>{mph}</motion.span> mph</span>
        <span className="sp-dash__stop">{current ? <>Mile {String(stop + 1).padStart(2, '0')} · {current.name}</> : stop === -1 ? 'Engine on' : 'Overlook ahead'}</span>
      </div>
    </motion.div>
  </section>;
}

function Billboard({ project, index, onFocus }: { project: Project; index: number; onFocus: (event: FocusEvent<HTMLElement>) => void }) {
  return <div className="sp-panel sp-panel--stop" data-stop style={{ '--tilt': `${tilts[index % tilts.length]}deg` } as CSSProperties}>
    <span className="sp-mile" aria-hidden="true">Mile {String(index + 1).padStart(2, '0')}</span>
    <a className="sp-board" href={`/projects/${project.id}`} onFocus={onFocus} aria-label={`${project.name}: ${project.line}`}>
      <div className={`sp-board__art sp-card__art--${project.id}`} aria-hidden="true">
        {covers[project.id] ? <img src={covers[project.id]} alt="" loading="lazy"/> : <span className="sp-card__line"/>}
      </div>
      <div className="sp-board__text">
        <span className="sp-card__tag">{project.category}</span>
        <h2>{project.name}</h2>
        <p>{project.line}</p>
        <span className="sp-board__go">Pull over <span aria-hidden="true">→</span></span>
      </div>
    </a>
    <span className="sp-posts" aria-hidden="true" />
  </div>;
}

type CarProps = { pitch: MotionValue<number>; wheel: MotionValue<number>; blur: MotionValue<number>; exhaust: MotionValue<number>; lights: MotionValue<number>; revving: boolean };

// A flat side-on 911, facing right. Wheels turn with distance; the body rides on the springs.
function Car({ pitch, wheel, blur, exhaust, lights, revving }: CarProps) {
  return <div className={revving ? 'sp-car sp-car--rev' : 'sp-car'}>
    <motion.div className="sp-car__beam" style={{ opacity: lights }} />
    <motion.div className="sp-car__exhaust" style={{ opacity: exhaust }}><i /><i /><i /></motion.div>
    <svg viewBox="0 0 320 120" role="img">
      <ellipse cx="160" cy="108" rx="140" ry="6" fill="rgb(31 42 34 / 0.22)" />
      <motion.g className="sp-car__body" style={{ rotate: pitch, originX: '50%', originY: '90%' }}>
        <g className="sp-car__idle">
          <path fill="#2f5d3a" d="M24 90 C14 89 9 82 11 73 C13 64 22 57 36 51 C60 39 92 23 128 18 C150 15 170 16 184 22 C196 28 206 38 215 46 L238 50 C260 52 282 56 297 62 C306 66 310 74 308 82 C306 88 300 90 292 90 Z" />
          <path fill="#2f5d3a" d="M236 60 C244 44 276 42 292 58 Z" />
          <path fill="#2f5d3a" d="M34 52 L20 45 L44 42 Z" />
          <path fill="none" stroke="#4b8a5c" strokeWidth="3" strokeLinecap="round" d="M44 46 C70 32 100 21 130 19 C152 17 170 18 182 24" />
          <path fill="#dfe6dc" opacity="0.92" d="M98 44 C120 30 146 23 170 23 C184 23 194 30 203 42 L203 44 Z" />
          <path stroke="#2f5d3a" strokeWidth="5" d="M160 23 L158 45" />
          <path fill="none" stroke="#1f2a22" strokeOpacity="0.35" strokeWidth="1.5" d="M158 49 L156 82 M210 46 C214 60 214 74 210 84" />
          <rect x="186" y="56" width="14" height="3" rx="1.5" fill="#1f2a22" opacity="0.45" />
          <path fill="#2f5d3a" d="M205 40 l11 -5 l2 7 z" />
          <ellipse cx="278" cy="52" rx="7" ry="6" fill="#f4efe4" transform="rotate(-18 278 52)" />
          <circle cx="279" cy="52" r="2.5" fill="#e8d48a" />
          <rect x="10" y="70" width="12" height="5" rx="2.5" fill="#d9683f" />
          <rect x="100" y="74" width="112" height="3" rx="1.5" fill="#f4efe4" opacity="0.6" />
          <circle cx="72" cy="90" r="25" fill="#1f2a22" />
          <circle cx="250" cy="90" r="25" fill="#1f2a22" />
        </g>
      </motion.g>
      <Wheel cx={72} rotate={wheel} blur={blur} />
      <Wheel cx={250} rotate={wheel} blur={blur} />
    </svg>
  </div>;
}

function Wheel({ cx, rotate, blur }: { cx: number; rotate: MotionValue<number>; blur: MotionValue<number> }) {
  return <g transform={`translate(${cx} 90)`}>
    <circle r="20" fill="#161d18" />
    <motion.g style={{ rotate }}>
      <circle r="12" fill="#f4efe4" />
      {[0, 72, 144, 216, 288].map(a => <path key={a} transform={`rotate(${a})`} d="M-3 -2 L-2 -11 L2 -11 L3 -2 Z" fill="#2f5d3a" />)}
      <circle r="3" fill="#1f2a22" />
    </motion.g>
    {/* at speed the spokes smear into a disc */}
    <motion.circle r="12" fill="#c9cfc3" style={{ opacity: blur }} />
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
