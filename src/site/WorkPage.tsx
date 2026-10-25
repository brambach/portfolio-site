import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { workById } from './data/work';
import { PROJECT_META } from './meta';
import { type WorkId } from './routes';
import { nextWork, pageWorkById, SHOT_SIZE, type Shot } from './work';
import './project.css';

/* A project's page, in the home page's simple look: the same paper, type, header and footer, and one calm column.
   The words are the catalog's, set the way the home sets its own: lowercase, plain commas for the middle dots.
   Nothing moves on its own; port keeps its hold to try, folded in CSS. */

const PAPER = '#f3eee3';
const EMAIL = 'bryce.rambach@gmail.com';
const NEW_TAB = { target: '_blank', rel: 'noopener noreferrer' } as const;
/* The space sits outside the hidden span, as on the home page. */
const NewTab = () => <>{' '}<span className="s-vh">(opens in a new tab)</span></>;

const LINKS = [
  { label: 'github', href: 'https://github.com/brambach' },
  { label: 'x @brycerambach', href: 'https://x.com/brycerambach' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/bryce-rambach/' },
];

/** The home's voice: lowercase, a comma where the catalog has a middle dot, a comma where it might have a dash. */
const plain = (text: string) => text.toLowerCase().replace(/\s+·\s+/g, ', ').replace(/\s*[–—]\s*/g, ', ');

function Figure({ shot, first }: { shot: Shot; first: boolean }) {
  const [w, h] = SHOT_SIZE[shot.src] ?? [];
  return <figure className={`s-wp-shot${shot.tall ? ' is-tall' : ''}`}>
    <img src={shot.src} alt={plain(shot.alt)} width={w} height={h} decoding="async" {...(first ? {} : { loading: 'lazy' as const })} />
    {(shot.title || shot.text) && <figcaption>{shot.title && <b>{plain(shot.title)}</b>}{shot.title && shot.text && ' '}{shot.text && plain(shot.text)}</figcaption>}
  </figure>;
}

type Phase = 'open' | 'holding' | 'closing' | 'closed';
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Port's hold, in the browser: hold the ring for a second and the screen folds into a line, with the app's sound.
 *  Press again to open. Enter or Space closes it straight away. */
function Hold() {
  const [phase, setPhase] = useState<Phase>('open');
  const [sound, setSound] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const how = workById('port')!.hero;

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const stopSound = () => { if (audio.current) { audio.current.pause(); audio.current.currentTime = 0; } };
  useEffect(() => () => { clear(); stopSound(); }, []);

  const close = () => {
    clear();
    const quick = still();
    setPhase(quick ? 'closed' : 'closing');
    if (sound) {
      audio.current ??= new Audio('/projects/port/close.wav');
      try { void audio.current.play()?.catch(() => {}); } catch { /* no sound here; the fold still shows */ }
    }
    if (!quick) timers.current.push(setTimeout(() => setPhase('closed'), 1250));
  };
  const open = () => { clear(); stopSound(); setPhase('open'); };
  const toggle = () => { if (phase === 'closed') open(); else if (phase !== 'closing') close(); };

  const press = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (phase === 'closed') { open(); return; }
    if (phase !== 'open') return;
    setPhase('holding');
    timers.current.push(setTimeout(close, 1000));
  };
  const release = () => { if (phase === 'holding') { clear(); setPhase('open'); } };
  const key = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (!e.repeat) toggle();
  };

  return <div className="s-port" data-phase={phase}>
    <div className="s-port__screen">
      <span className="s-port__band" aria-hidden="true" />
      <span className="s-port__line" aria-hidden="true" />
      <button className="s-port__ring" aria-label={phase === 'closed' ? 'open port' : 'hold to close port'} aria-describedby="s-port-how"
        onPointerDown={press} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}
        onKeyDown={key} onKeyUp={e => { if (e.key === ' ') e.preventDefault(); }}
        // Pointers go through the hold; a click with no pointer (a screen reader's) toggles it.
        onClick={e => { if (e.detail === 0) toggle(); }}>
        <span aria-hidden="true">{phase === 'closed' ? 'open' : phase === 'holding' ? 'keep holding' : 'hold'}</span>
      </button>
    </div>
    <p className="s-port__how">
      <span id="s-port-how"><b>{plain(how.title!)}</b> {plain(how.text!)}</span>
      <button className="s-port__sound" aria-pressed={sound} onClick={() => { if (sound) stopSound(); setSound(!sound); }}>sound {sound ? 'on' : 'off'}</button>
    </p>
    <p className="s-vh" role="status">{phase === 'closed' ? 'port closed' : phase === 'closing' ? '' : 'port open'}</p>
  </div>;
}

export default function WorkPage({ id }: { id: WorkId }) {
  const work = pageWorkById(id)!, next = nextWork(id);
  const ring = 'ring' in work.hero;

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const before = meta?.content, title = document.title;
    if (meta) meta.content = PAPER;
    document.title = PROJECT_META.find(p => p.path === `/projects/${id}`)!.title;
    window.scrollTo(0, 0);
    return () => { if (meta && before) meta.content = before; document.title = title; };
  }, [id]);

  const tall = work.shots.filter(s => s.tall), wide = work.shots.filter(s => !s.tall);
  return <div className="home s-wp">
    <header className="s-top s-label">
      <a href="/">bryce rambach</a>
      <nav aria-label="site"><a href="/#work">work</a><a href="/#about">about</a><a href={`mailto:${EMAIL}`}>email</a></nav>
    </header>

    <main>
      <section className="s-wp-top s-fade" aria-labelledby="wp-name">
        <h1 id="wp-name">{plain(work.name)}</h1>
        <p className="s-label">{plain(work.category)}</p>
        <p className="s-wp-line">{plain(work.line)}</p>
        <dl className="s-wp-facts">
          <div><dt>role</dt><dd>{plain(work.role)}</dd></div>
          <div><dt>status</dt><dd>{plain(work.status)}</dd></div>
          {work.link && <div><dt>source</dt><dd><a href={work.link.href} {...NEW_TAB}>{plain(work.link.label)}<NewTab /></a></dd></div>}
        </dl>
      </section>

      <section className="s-wp-sec" aria-labelledby="wp-what">
        <h2 id="wp-what" className="s-label">what it is</h2>
        <p>{plain(work.introduction)}</p>
        {ring && <Hold />}
      </section>

      {wide.length > 0 && <div className="s-wp-shots">{wide.map((s, k) => <Figure key={s.src} shot={s} first={k === 0} />)}</div>}
      {tall.length > 0 && <div className="s-wp-shots is-tall">{tall.map((s, k) => <Figure key={s.src} shot={s} first={k < 2 && wide.length === 0} />)}</div>}

      <section className="s-wp-sec" aria-labelledby="wp-call">
        <h2 id="wp-call" className="s-label">the call</h2>
        <p>{plain(work.decision)}</p>
      </section>
      <section className="s-wp-sec" aria-labelledby="wp-hood">
        <h2 id="wp-hood" className="s-label">under the hood</h2>
        <p>{plain(work.engineering)}</p>
      </section>
      <section className="s-wp-sec" aria-labelledby="wp-print">
        <h2 id="wp-print" className="s-label">the fine print</h2>
        <p className="is-quiet">{plain(work.boundary)}</p>
      </section>

      <nav className="s-wp-next s-more" aria-label="more work">
        <a href="/#work">back to the work</a>
        <a href={`/projects/${next.id}`}>next: {plain(next.name)}</a>
      </nav>
    </main>

    <footer className="s-foot">
      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <nav aria-label="elsewhere">
        {LINKS.map(l => <a key={l.href} href={l.href} {...NEW_TAB}>{l.label}<NewTab /></a>)}
      </nav>
    </footer>
  </div>;
}
