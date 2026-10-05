import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Letters, Lit, nameForTravel, finePointer, reduced, SkyLink, useReveal, useSky } from './parts';
import { Shot } from './Shot';
import { WORK } from './work';

const page = (id: string) => `/projects/${id}`;
const pad = (n: number) => String(n).padStart(2, '0');
const PEEK_W = 272, PEEK_H = 170, PEEK_GAP = 30;

/* The front page: name and intro over a halftone sunrise, a quiet list of the work, a short paragraph about how I
   work, the side quests, and a closing screen to say hello over the sunset. */
export default function SkyHome() {
  const root = useRef<HTMLDivElement>(null);
  const { arrived } = useSky();
  const [at, setAt] = useState<number | null>(null);
  const peek = usePeek();
  // The hover pictures aren't needed for the first screen, so they load once the page has settled, or as soon as
  // you point at the list.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (armed) return;
    const timer = window.setTimeout(() => setArmed(true), 2500);
    return () => window.clearTimeout(timer);
  }, [armed]);
  useReveal(root, arrived ? 520 : 0, 'home');
  // The scroll hint goes once you've scrolled.
  useEffect(() => {
    const check = () => { if (scrollY > 40) root.current?.setAttribute('data-scrolled', ''); };
    check();
    addEventListener('scroll', check, { passive: true });
    return () => removeEventListener('scroll', check);
  }, []);

  // Leaving for a project from the list: the hover card (or, on touch, the opened preview) becomes the picture and
  // the row's name becomes the title.
  const rowPiece = (id: string, selector: string) => root.current?.querySelector(`[data-row="${id}"] ${selector}`);
  const travelFromRow = (id: string) => () => nameForTravel([
    [peek.visible() ? peek.el.current : rowPiece(id, '.sky-drop .sky-shot'), 'sky-shot'],
    [rowPiece(id, '.sky-nm'), 'sky-title'],
  ]);
  const travelFromWord = () => nameForTravel([[peek.visible() ? peek.el.current : null, 'sky-shot']]);
  const toWork = (event: React.MouseEvent) => {
    event.preventDefault();
    document.getElementById('work')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  };

  return <div ref={root} className="sky-home">
    <Lit kind="rise" as="header" className="sky-hero">
      <div className="sky-col">
        <h1 className="sky-name"><Letters text="Bryce Rambach" /></h1>
        <p className="sky-sub sky-in" style={{ '--i': 1 } as CSSProperties}>Designer and engineer. Same person, no handoff.</p>
        <div className="sky-intro">
          <p className="sky-in" style={{ '--i': 2 } as CSSProperties}>Right now I’m building <SkyLink className="sky-u" to={page('dervo')}>Dervo</SkyLink>, a Mac app for running Claude Code and Codex side by side. You leave your agents working and come back to a few sentences about what finished, what’s stuck and what needs you, instead of four terminals. It’s in private beta. I build Dervo with Dervo.</p>
          <p className="sky-in" style={{ '--i': 3 } as CSSProperties}>Before that I designed and built an <SkyLink className="sky-u" to={page('integration-portal')}>integration portal</SkyLink> for HR and payroll teams, where one wrong field mapping means someone gets paid wrong. Clear wasn’t optional.</p>
        </div>
      </div>
      <a className="sky-hint" href="#work" onClick={toWork} aria-label="Skip to the work"><i /><i /><i /></a>
    </Lit>

    <main className="sky-col sky-main" onPointerEnter={() => setArmed(true)}>
      <h2 className="sky-title" id="work" data-in><span className="sky-t"><Letters text="Selected work" step={28} /></span><span className="sky-rule" /><span className="sky-meta" aria-hidden="true">{at === null ? pad(WORK.length) : <><b>{pad(at + 1)}</b> / {pad(WORK.length)}</>}</span></h2>
      <div className="sky-list" onMouseLeave={() => { peek.hide(); setAt(null); }}>
        {WORK.map((work, i) => <Row key={work.id} i={i} open={at === i} onPoint={event => { peek.show(i, event); setAt(i); }} onOpen={() => setAt(i)} prepare={travelFromRow(work.id)} />)}
        <div className="sky-end" data-in style={{ '--d': `${160 + WORK.length * 80}ms` } as CSSProperties} />
      </div>

      <h2 className="sky-title" data-in><span className="sky-t"><Letters text="In short" step={28} /></span><span className="sky-rule" /></h2>
      <InShort peek={peek} prepare={travelFromWord} />

      <h2 className="sky-title" data-in><span className="sky-t"><Letters text="Side quests" step={28} /></span><span className="sky-rule" /><span className="sky-meta" aria-hidden="true">02</span></h2>
      <ul className="sky-links">
        <li data-in><a className="sky-u" href="/drive">The drive</a><span>A 3D Porsche by a lake. Sound on.</span></li>
        <li data-in style={{ '--d': '70ms' } as CSSProperties}><a className="sky-u" href="/work">The road</a><span>The old homepage. Scroll and the Porsche drives.</span></li>
      </ul>
    </main>

    <Lit kind="set" as="footer" className="sky-finale">
      <div className="sky-col">
        <h2 className="sky-title" data-in><span className="sky-t"><Letters text="Say hello" step={28} /></span><span className="sky-rule" /></h2>
        <ul className="sky-links">
          <li data-in><a className="sky-u" href="mailto:bryce.rambach@gmail.com">bryce.rambach@gmail.com</a><span>Email</span></li>
          <li data-in style={{ '--d': '60ms' } as CSSProperties}><a className="sky-u sky-ext" href="https://www.linkedin.com/in/bryce-rambach/" target="_blank" rel="noopener noreferrer">LinkedIn</a><span>bryce-rambach</span></li>
          <li data-in style={{ '--d': '120ms' } as CSSProperties}><a className="sky-u sky-ext" href="https://x.com/brycerambach" target="_blank" rel="noopener noreferrer">X</a><span>@brycerambach</span></li>
          <li data-in style={{ '--d': '180ms' } as CSSProperties}><a className="sky-u sky-ext" href="https://github.com/brambach" target="_blank" rel="noopener noreferrer">GitHub</a><span>brambach</span></li>
          <li data-in style={{ '--d': '240ms' } as CSSProperties}><a className="sky-u sky-ext" href="/Bryce_Rambach_Resume.pdf" target="_blank" rel="noopener">Resume</a><span>PDF, one page</span></li>
        </ul>
        <p className="sky-sign sky-fade" data-in>Designed and built by me, which is sort of the point.</p>
      </div>
    </Lit>

    <div ref={peek.el} className="sky-peek" aria-hidden="true"><div ref={peek.stack} className="sky-peek__stack">{armed && WORK.map(work => <Shot key={work.id} work={work} />)}</div></div>
  </div>;
}

/** One project in the list. On touch, the first tap opens its preview in place and the second opens the project. */
function Row({ i, open, onPoint, onOpen, prepare }: { i: number; open: boolean; onPoint: (event: React.MouseEvent) => void; onOpen: () => void; prepare: () => void }) {
  const work = WORK[i];
  const { go } = useSky();
  const [dropped, setDropped] = useState(false);
  const [shown, setShown] = useState(false);
  const click = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!finePointer() && !dropped) { setDropped(true); setShown(true); onOpen(); return; }
    go(page(work.id), prepare);
  };
  useEffect(() => { if (!open) setDropped(false); }, [open]);
  return <div className="sky-row" data-row={work.id} data-open={dropped || undefined} data-in style={{ '--d': `${160 + i * 80}ms` } as CSSProperties}>
    <a className="sky-head" href={page(work.id)} onClick={click} onMouseEnter={event => { if (finePointer()) onPoint(event); }} onFocus={onOpen} aria-expanded={finePointer() ? undefined : dropped}>
      {/* The spaces keep the parts apart for screen readers; a grid ignores them. */}
      <span className="sky-no">{pad(i + 1)}</span>{' '}<span className="sky-nm">{work.name}</span>{' '}<span className="sky-ln">{work.line}</span>{' '}<span className="sky-kd">{work.kind}</span>
    </a>
    <div className="sky-drop" inert={!dropped}><div><div className="sky-drop__inner">{shown && <Shot work={work} />}<SkyLink className="sky-u sky-go" to={page(work.id)} prepare={prepare}>Open {work.name}</SkyLink></div></div></div>
  </div>;
}

/** The small card that follows the cursor over the list (and the project words in In short), showing the picture
 *  the project opens on. It eases after the cursor and only animates while it's showing. */
function usePeek() {
  const el = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const state = useRef({ tx: 0, ty: 0, x: 0, y: 0, on: false, frame: 0 });
  const aim = (x: number, y: number) => {
    const s = state.current;
    s.tx = x + 14 + PEEK_W + 16 > innerWidth ? x - PEEK_W - 14 : x + 14;
    s.ty = y + PEEK_GAP + PEEK_H + 12 > innerHeight ? y - PEEK_GAP - PEEK_H : y + PEEK_GAP;
  };
  useEffect(() => {
    const s = state.current;
    const move = (e: MouseEvent) => aim(e.clientX, e.clientY);
    addEventListener('mousemove', move, { passive: true });
    return () => { removeEventListener('mousemove', move); cancelAnimationFrame(s.frame); };
  }, []);
  const tick = () => {
    const s = state.current, k = reduced() ? 1 : 0.12;
    s.x += (s.tx - s.x) * k; s.y += (s.ty - s.y) * k;
    if (el.current) el.current.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
    const settled = Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) < 0.3;
    s.frame = s.on || !settled ? requestAnimationFrame(tick) : 0;
  };
  return {
    el, stack,
    visible: () => state.current.on,
    /** Show project i's picture, starting from where the pointer is (the page may not have seen it move yet). */
    show(i: number, at?: { clientX: number; clientY: number }) {
      if (!finePointer()) return;
      const s = state.current;
      if (at) aim(at.clientX, at.clientY);
      if (!s.on) { s.x = s.tx; s.y = s.ty; }
      s.on = true;
      el.current?.classList.add('is-on');
      if (stack.current) stack.current.style.transform = `translateY(${-PEEK_H * i}px)`;
      if (!s.frame) s.frame = requestAnimationFrame(tick);
    },
    hide() { state.current.on = false; el.current?.classList.remove('is-on'); },
  };
}
type Peek = ReturnType<typeof usePeek>;

/* In short. Words come up from faint as you scroll. The three that name a project then get an underline made of the
   horizon's dots, and a glint runs across them once. Point at one and its dots turn to water, and the project's
   picture follows the cursor like the list. */
const SENTENCE: (string | { text: string; id: string } | { em: string })[] = [
  'I like software that tells you what’s going on. ',
  { text: 'Agents', id: 'dervo' }, ', ', { text: 'payroll', id: 'integration-portal' }, ', ', { text: 'a family’s running streak', id: 'arro' },
  ': different problems, same job. Make the complicated part ', { em: 'easy to read' }, ', then build it properly, from first sketch to signed release.',
];
function InShort({ peek, prepare }: { peek: Peek; prepare: () => void }) {
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
      const index = WORK.findIndex(w => w.id === piece.id);
      const words = piece.text.split(' ');
      return <SkyLink key={n} to={page(piece.id)} className="sky-pl" prepare={prepare} data-peek={String(index)}>
        <span onMouseEnter={event => peek.show(index, event)} onMouseLeave={() => peek.hide()}>
          {words.map((word, i) => <Fragment key={i}><span className="sky-w sky-pw" style={{ '--wd': `${i * 90}ms`, '--gd': `${i * 70}ms` } as CSSProperties}>{word}</span>{i < words.length - 1 ? ' ' : ''}</Fragment>)}
        </span>
      </SkyLink>;
    })}
  </p>;
}
