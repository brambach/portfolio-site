import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent, type RefObject } from 'react';
import {
  motion, useMotionTemplate, useMotionValueEvent, useReducedMotion, useScroll, useSpring,
  useTransform, useVelocity, type MotionValue,
} from 'motion/react';
import { useLenis } from 'lenis/react';
import { SmoothScroll } from '../components/SmoothScroll';
import { archive, projectById, type Project } from './catalog';
import { email } from '../lib/site';
import './simple.css';
import { Car } from './FlatCar';
import { Glovebox } from './Glovebox';
import { Grain } from '../components/Grain';
import { covers, mileLabel, roadProjects } from './road-lineup';

const road = roadProjects;
const agentsky = projectById('agentsky')!;

// words painted on the tarmac at each stop, the way real roads talk to you
const paint = ['Now building', 'Keep clear', 'Slow · reading', 'One way', 'Pull over'];

// small alternating tilts so the grid feels pinned up, not printed
const tilts = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9];

// morning to blue hour across the length of the drive
const sky = ['#f6dcc0', '#e9efe6', '#f0d49a', '#e59a6e', '#34445a'];
const sun = ['#f2b66d', '#fbe7a6', '#e8733f', '#f1e6c8'];
const skyStops = [0, 0.3, 0.62, 0.84, 1];

// where the middle of the car sits on screen; matches .sp-car-lane in simple.css
const carCentre = () => window.innerWidth * 0.08 + Math.min(380, Math.max(200, window.innerWidth * 0.3)) / 2;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// the 3D drive picks up at the overlook when it sees this
const DRIVE = '/drive?from=work';

// Warm up the drive once someone is well down the road: its code, and the car model on desktops.
// Phones and data-saver visitors only get the code, since the model alone is about 17 MB.
let drivePreloaded = false;
function preloadDrive() {
  if (drivePreloaded) return;
  drivePreloaded = true;
  void import('../prototype/Entrance.tsx').catch(() => { drivePreloaded = false; });
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (saveData || !window.matchMedia('(pointer: fine)').matches) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = '/models/entrance/porsche-1975.glb';
  document.head.append(link);
}

export default function SimplePortfolio() {
  const reduced = useReducedMotion() ?? false;
  useEffect(() => {
    const title = document.title;
    document.title = 'Bryce Rambach / Design and software you can feel';
    return () => { document.title = title; };
  }, []);
  return <SmoothScroll>
    <main className="sp-page" aria-label="Bryce Rambach's work">
      <Grain />
      <header className="sp-nav">
        <span className="sp-nav__name">Bryce Rambach</span>
        <nav className="sp-mode" aria-label="How to browse">
          <span aria-current="page">Road</span>
          <a className="poke" href={DRIVE}>Drive <span aria-hidden="true">→</span></a>
        </nav>
      </header>
      {reduced ? <StaticWork /> : <Drive />}
      <Glovebox email={email} drive={DRIVE} />
    </main>
  </SmoothScroll>;
}

/* The drive: vertical scroll moves a horizontal road past the car. */
function Drive() {
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

  const skyColour = useTransform(progress, skyStops, sky);
  const sunX = useTransform(progress, [0, 1], ['8%', '92%']);
  const sunY = useTransform(progress, p => `${62 - Math.sin(p * Math.PI) * 48}%`);
  const sunColour = useTransform(progress, [0, 0.5, 0.85, 1], sun);
  const night = useTransform(progress, [0.7, 1], [0, 1]);
  const stars = useTransform(progress, [0.85, 1], [0, 1]);
  const lights = useTransform(progress, [0.72, 0.85], [0, 1]);
  // the road and verges sit in front of the dusk overlay, so they darken on their own
  const dim = useTransform(night, n => `brightness(${1 - n * 0.5})`);

  // the headline leans into the car's draft and words hop as the car passes under them
  const lean = useSpring(useTransform(velocity, v => clamp(-v / 260, -9, 9)), { stiffness: 160, damping: 14 });
  const note = useTransform(progress, [0, 0.03], [1, 0]);

  const far = useMotionTemplate`${useTransform(distance, d => -d * 0.12)}px 100%`;
  const mid = useMotionTemplate`${useTransform(distance, d => -d * 0.35)}px 100%`;
  const near = useMotionTemplate`${useTransform(distance, d => -d * 1.35)}px 100%`;
  const dashes = useMotionTemplate`${trackX}px 50%`;

  useMotionValueEvent(progress, 'change', p => {
    if (p > 0.55) preloadDrive();
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

  // Coming back from a study: /?mile=lucid parks the car at that billboard. Images and fonts
  // keep stretching the road for a moment, so re-aim on each measure until the visitor moves.
  const mile = useRef<string | null>(null);
  const settling = useRef(true);
  useEffect(() => {
    // read once: React runs effects twice in development, and the first run clears the address
    mile.current ??= new URLSearchParams(location.search).get('mile');
    if (!mile.current) return;
    const url = new URL(location.href);
    url.searchParams.delete('mile');
    history.replaceState(history.state, '', url);
    const stop = () => { settling.current = false; };
    const timer = window.setTimeout(stop, 2500);
    window.addEventListener('wheel', stop, { once: true, passive: true });
    window.addEventListener('touchstart', stop, { once: true, passive: true });
    window.addEventListener('keydown', stop, { once: true });
    return () => { window.clearTimeout(timer); window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', stop); };
  }, []);
  useEffect(() => {
    if (!mile.current || travel <= 0) return;
    const aim = () => {
      if (!settling.current) return;
      const panel = track.current?.querySelector<HTMLElement>(`[data-project="${mile.current}"]`);
      if (!panel) return;
      const start = section.current?.offsetTop ?? 0;
      const top = Math.max(start, Math.min(start + panel.offsetLeft + panel.offsetWidth / 2 - window.innerWidth / 2, start + travel));
      // the page is taller than Lenis last measured, so tell it before asking it to scroll
      lenis?.resize();
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo({ top });
    };
    aim();
    const timers = [200, 600, 1400].map(ms => window.setTimeout(aim, ms));
    return () => timers.forEach(window.clearTimeout);
  }, [travel, lenis]);

  const current = stop >= 0 && stop < road.length ? road[stop] : null;

  // "Take the wheel": zoom through the car's side window into the drive
  const [zoom, setZoom] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    // coming back with the browser's back button restores the page mid-zoom, so clear it
    const reset = (event: PageTransitionEvent) => { if (event.persisted) { setZoom(null); setRevving(false); } };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);
  const takeTheWheel = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const href = event.currentTarget.href;
    preloadDrive();
    const glass = document.querySelector('.sp-drive .sp-car__glass')?.getBoundingClientRect();
    setZoom(glass ? { left: glass.left, top: glass.top, width: glass.width, height: glass.height } : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 });
    setRevving(true);
    window.setTimeout(() => window.location.assign(href), 950);
  };
  const layer = (position: MotionValue<string>) => ({ backgroundPosition: position });

  return <section ref={section} className="sp-drive" style={{ height: `calc(${travel}px + 100svh)` }} aria-label="Selected work">
    <motion.div className="sp-scene" style={{ backgroundColor: skyColour }}>
      <motion.div className="sp-stars" style={{ opacity: stars }} aria-hidden="true" />
      <motion.div className="sp-sun" style={{ left: sunX, top: sunY, backgroundColor: sunColour }} aria-hidden="true" />
      <motion.div className="sp-layer sp-layer--far" style={layer(far)} aria-hidden="true" />
      <motion.div className="sp-layer sp-layer--mid" style={layer(mid)} aria-hidden="true" />

      {/* dusk dims the land, not the lit billboards */}
      <motion.div className="sp-night" style={{ opacity: night }} aria-hidden="true" />
      <motion.div ref={track} className="sp-track" style={{ x: trackX }}>
        <div className="sp-panel sp-panel--hello">
          <span className="sp-tarmac sp-tarmac--hello" aria-hidden="true">Hello</span>
          <motion.h1 className="sp-headline" aria-label="Hi, I’m Bryce. I design and build software you can feel." style={{ skewX: lean }}>
            <Words text="Hi, I’m Bryce." distance={distance} speed={speed} first={0} />
            <br/>
            <em><Words text="I design and build software you can feel." distance={distance} speed={speed} first={3} /></em>
          </motion.h1>
          <p className="sp-sub" aria-label="Five projects down the road. Coffee first, then the one I’m building now.">
            <Words text="Five projects down the road." distance={distance} speed={speed} first={9} />
            <span className="sp-sub__aside" aria-hidden="true">coffee first, then the one I’m building now.</span>
          </p>
          <motion.div className="sp-cue" style={{ opacity: note }} aria-hidden="true">
            <span className="sp-cue__pill"><span className="sp-cue__road" />Scroll to drive</span>
            <span className="sp-cue__note">your scroll wheel is the gas pedal
              <svg viewBox="0 0 60 44"><path d="M6 4 C 4 26, 24 38, 50 34 M42 24 L52 34 L40 40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </motion.div>
        </div>
        {/* the same stops the 3D drive passes on its way out of town */}
        <Roadside kind="cafe" distance={distance} speed={speed} />
        <Roadside kind="tennis" distance={distance} speed={speed} />
        {road.map((project, i) => i === 0
          ? <Headliner key={project.id} project={project} onFocus={bringIntoView} active={stop === 0} distance={distance} speed={speed} />
          : <Billboard key={project.id} project={project} index={i} onFocus={bringIntoView} active={stop === i} distance={distance} speed={speed} />)}
        <div className="sp-panel sp-panel--overlook">
          <div className="sp-lakeside" aria-hidden="true"><b>Lakeside</b><span>Yes, this counts as looking at my site</span></div>
          <div className="sp-signpost" aria-hidden="true"><span>Tahoe overlook</span><span>1 mi</span></div>
          <h2>Want to drive it yourself?</h2>
          <p>The rest of the road is in 3D. Open the door, turn the key, take it to the lake.</p>
          <div className="sp-overlook__actions">
            <a className="sp-foot__hello" href={DRIVE} onClick={takeTheWheel} onFocus={bringIntoView} onMouseEnter={() => setRevving(true)} onMouseLeave={() => zoom || setRevving(false)}>Take the wheel <span aria-hidden="true">→</span></a>
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
      <motion.div className="sp-note" style={{ opacity: note }} aria-hidden="true">
        <span>that’s me</span>
        <svg viewBox="0 0 44 40"><path d="M4 6 C 20 2, 34 10, 34 30 M26 24 L34 32 L40 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </motion.div>

      {zoom && <motion.div className="sp-zoom" aria-hidden="true"
        initial={{ ...zoom, borderRadius: '60% 40% 6px 6px', backgroundColor: '#dfe6dc' }}
        animate={{ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: '0% 0% 0px 0px', backgroundColor: '#1f2838' }}
        transition={{ duration: 0.85, ease: [0.7, 0, 0.2, 1] }} />}

      <div className="sp-dash" aria-hidden="true">
        <span className="sp-dash__speed"><motion.span>{mph}</motion.span> mph</span>
        <span className="sp-dash__stop">{current ? <><b>{String(stop + 1).padStart(2, '0')}</b> {current.name}</> : stop === -1 ? 'Engine on' : 'Overlook ahead'}</span>
      </div>
    </motion.div>
  </section>;
}

type Motion = { distance: MotionValue<number>; speed: MotionValue<number> };


/* Flat versions of the 3D drive's first two stops, with the same signs.
   The café's sign swings in the car's draft; the courts always have a rally going. */
function Roadside({ kind, distance, speed }: Motion & { kind: 'cafe' | 'tennis' }) {
  const panel = useRef<HTMLDivElement>(null);
  const { sway } = useSway(panel, { distance, speed });
  const swing = useTransform(sway, r => r * 3);
  if (kind === 'cafe') return <div ref={panel} className="sp-panel sp-roadside sp-roadside--cafe" aria-hidden="true">
    <div className="sp-cafe">
      <span className="sp-cafe__steam"><i /><i /><i /></span>
      <div className="sp-cafe__awning" />
      <div className="sp-cafe__front">
        <span className="sp-cafe__window"><span className="sp-cafe__cup" /></span>
        <span className="sp-cafe__door" />
      </div>
      <motion.div className="sp-roadsign sp-roadsign--hanging" style={{ rotate: swing }}><b>The long way</b><span>Coffee · flat whites</span></motion.div>
    </div>
  </div>;
  return <div ref={panel} className="sp-panel sp-roadside sp-roadside--tennis" aria-hidden="true">
    <div className="sp-roadsign sp-roadsign--club"><b>Tennis club</b></div>
    <div className="sp-court">
      <span className="sp-court__net" />
      <span className="sp-court__ball" />
    </div>
    <motion.div className="sp-roadsign sp-roadsign--post" style={{ rotate: sway }}><b>Young prodigy</b><span>Parking only</span></motion.div>
  </div>;
}

/* The car's draft rocks a board on its posts as it passes, harder the faster you go. */
function useSway(panel: RefObject<HTMLDivElement | null>, { distance, speed }: Motion) {
  const centre = useRef(0);
  useLayoutEffect(() => {
    const measure = () => { if (panel.current) centre.current = panel.current.offsetLeft + panel.current.offsetWidth / 2; };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [panel]);
  const nearness = useTransform(() => {
    const reach = Math.max(1, (panel.current?.offsetWidth ?? 500) * 0.8);
    return Math.max(0, 1 - Math.abs(centre.current - distance.get() - carCentre()) / reach);
  });
  const gust = useTransform(() => nearness.get() * Math.min(1, speed.get() / 2500) * -4);
  return { sway: useSpring(gust, { stiffness: 140, damping: 6 }), centre };
}

// the name does a little wave when you pull up to it
function WavingName({ name, active }: { name: string; active: boolean }) {
  return <span className="sp-board__name">{[...name].map((letter, i) => <motion.span key={i} animate={active ? { y: [0, -7, 0], rotate: [0, -4, 0] } : { y: 0, rotate: 0 }} transition={{ duration: 0.45, delay: i * 0.035, ease: 'easeOut' }}>{letter}</motion.span>)}</span>;
}

type StopProps = Motion & { project: Project; onFocus: (event: FocusEvent<HTMLElement>) => void; active: boolean };

function Billboard({ project, index, onFocus, active, distance, speed }: StopProps & { index: number }) {
  const panel = useRef<HTMLDivElement>(null);
  const { sway } = useSway(panel, { distance, speed });
  return <div ref={panel} className="sp-panel sp-panel--stop" data-stop data-project={project.id} style={{ '--tilt': `${tilts[index % tilts.length]}deg` } as CSSProperties}>
    <span className="sp-ghost" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
    <span className="sp-tarmac" aria-hidden="true">{paint[index % paint.length]}</span>
    <span className="sp-mile" aria-hidden="true">{mileLabel(index)}</span>
    <motion.div className="sp-sway" style={{ rotate: sway }}>
      <a className="sp-board" href={`/projects/${project.id}`} onFocus={onFocus} aria-label={`${project.name}: ${project.line}`}>
        <div className={`sp-board__art sp-card__art--${project.id}`} aria-hidden="true">
          {covers[project.id] ? <img src={covers[project.id]} alt="" loading="lazy"/> : <span className="sp-card__line"/>}
        </div>
        <div className="sp-board__text">
          <span className="sp-card__tag">{project.category}</span>
          <h2><WavingName name={project.name} active={active} /></h2>
          <p>{project.line}</p>
          <span className="sp-board__go">Pull over <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </motion.div>
    <span className="sp-posts" aria-hidden="true" />
  </div>;
}

/* Dervo gets the big board. Its Catch up card is still running as you approach,
   then everything resolves as the car pulls up: you come back to where your agents left off. */
function Headliner({ project, onFocus, active, distance, speed }: StopProps) {
  const panel = useRef<HTMLDivElement>(null);
  const { sway, centre } = useSway(panel, { distance, speed });
  // how close the board is to the middle of the screen, where people read it
  const centred = useTransform(() => Math.max(0, 1 - Math.abs(centre.current - distance.get() - window.innerWidth / 2) / (window.innerWidth * 0.45)));
  // the dotted sun behind the card rises as you arrive, like the one on Dervo's own site
  const sunrise = useTransform(centred, [0, 1], ['78%', '4%']);
  // resolves as the board settles in front of you, and replays if you back up and arrive again
  const [arrived, setArrived] = useState(false);
  useMotionValueEvent(centred, 'change', n => {
    if (n > 0.8) setArrived(true);
    else if (n < 0.2) setArrived(false);
  });
  return <div ref={panel} className="sp-panel sp-panel--stop sp-panel--lead" data-stop data-project={project.id}>
    <span className="sp-ghost" aria-hidden="true">01</span>
    <span className="sp-tarmac" aria-hidden="true">{paint[0]}</span>
    <span className="sp-mile" aria-hidden="true">{mileLabel(0)}</span>
    <motion.div className="sp-sway" style={{ rotate: sway }}>
      <div className="sp-board sp-board--lead">
        <div className="sp-lead__text">
          <span className="sp-card__tag">{project.status}</span>
          <h2><WavingName name={project.name} active={active} /></h2>
          <p className="sp-lead__line">{project.line}</p>
          <p className="sp-lead__pitch">Claude Code and Codex, side by side on your Mac. Dervo tells you what finished, what’s stuck and what needs you.</p>
          <p className="sp-lead__role">I’m building all of it: the design, the Mac app, the agent backend and the website.</p>
          <div className="sp-lead__links">
            <a className="sp-board__go" href={`/projects/${project.id}`} onFocus={onFocus} aria-label={`${project.name}: ${project.line}`}>Pull over <span aria-hidden="true">→</span></a>
            <a href="https://trydervo.com" target="_blank" rel="noreferrer" onFocus={onFocus}>trydervo.com <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <CatchUp resolved={arrived} sunrise={sunrise} />
      </div>
    </motion.div>
    <span className="sp-posts" aria-hidden="true" />
  </div>;
}

const threads = [
  { name: 'Apple Pay to checkout', state: 'needs', note: '“Use Stripe’s Payment Element, or keep the Apple Pay button?”' },
  { name: 'Welcome email for signups', state: 'done', note: 'Ready for review · 12 tests pass' },
  { name: 'Image uploads fail', state: 'done', note: 'Finished · Changed 3 files' },
] as const;

// A small, rebuilt Catch up from Dervo's example project. Nothing here talks to the real app.
function CatchUp({ resolved, sunrise }: { resolved: boolean; sunrise: MotionValue<string> }) {
  const [answered, setAnswered] = useState(false);
  return <div className="sp-catchup" role="group" aria-label="Dervo Catch up, example project">
    <motion.span className="sp-catchup__sun" style={{ top: sunrise }} aria-hidden="true" />
    <div className="sp-catchup__window">
      <div className="sp-catchup__bar" aria-hidden="true"><i /><i /><i /><span><b>tideline</b> Home</span></div>
      <div className="sp-catchup__body">
        <div className="sp-catchup__head"><strong>{resolved ? 'Catch up' : 'Running · 3'}</strong><span>{resolved ? 'Since 11:20 PM · 3 threads moved' : 'Working while you’re away'}</span></div>
        <motion.p className="sp-catchup__summary" initial={false} animate={{ opacity: resolved ? 1 : 0, y: resolved ? 0 : 6 }} transition={{ duration: 0.5, delay: resolved ? 0.9 : 0 }}>
          Two finished overnight. <b>Apple Pay to checkout</b> needs one answer.
        </motion.p>
        <ul>
          {threads.map((thread, i) => {
            const state = resolved ? thread.state : 'running';
            return <li key={thread.name} className={`is-${state}`}>
              <motion.span className="sp-catchup__dot" aria-hidden="true" key={state} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14, delay: resolved ? 0.25 + i * 0.18 : 0 }} />
              <div>
                <strong>{thread.name}</strong>
                <span>{state === 'running' ? 'Running…' : state === 'needs' && answered ? 'Answered · carrying on' : thread.note}</span>
                {state === 'needs' && !answered && <button type="button" onClick={() => setAnswered(true)}>Answer</button>}
              </div>
            </li>;
          })}
        </ul>
      </div>
    </div>
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

/* Reduced motion gets the plain pinned-up grid instead of the drive. */
function StaticWork() {
  return <>
    <section className="sp-hero">
      <h1>Hi, I’m Bryce.<br/><em>I design and build software you can feel.</em></h1>
      <p>Interfaces, systems and small rituals. Here’s what I’ve been making.</p>
    </section>
    <section className="sp-grid" aria-label="Selected work">
      {road.map((project, i) => <a key={project.id} className={i === 0 ? 'sp-card sp-card--lead' : 'sp-card'} href={`/projects/${project.id}`} style={{ '--tilt': `${tilts[i % tilts.length]}deg` } as CSSProperties} aria-label={`${project.name}: ${project.line}`}>
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
