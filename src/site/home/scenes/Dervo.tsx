import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
import { loadGsap } from '../gsap';
import { useMotionMode } from '../motion-mode';
import DervoMock, { measureAnchors, paintTally } from './DervoMock';
import { DervoLayout, SIZE, type MockVariant } from './DervoStill';
import {
  BEATS, LITE, MOCK, STEPS, arc, beatAt, clicksBetween, cursorAt, glide, lineAt, liteStates, resolve, stateAt, stepsBy, tallyAt,
  type Anchors, type MockState,
} from './dervo-script';

/* i. dervo: an agent's cursor drives the app while you scroll, and you watch it work.
   full: the stage sticks for 420vh and one clock (the scroll, smoothed by a 0.6s scrub) draws everything from the
   pure script in dervo-script.ts: the cursor's place, which beat line shows, the app's state and the ledger's count.
   Sticky CSS does the pinning, so the page never reflows or jumps when the code lands; ScrollTrigger only reads
   the scroll. lite: six frames, each plays its one step when it comes into view. still: the finished app. */

export default function Dervo() {
  const mode = useMotionMode();
  return mode === 'full' ? <Full key="full" /> : mode === 'lite' ? <Lite key="lite" /> : <Still key="still" />;
}

/** The app at its design size, scaled to the window it sits in. */
function Fit({ variant, children }: { variant: MockVariant; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!, box = el.parentElement!;
    const fit = () => { el.style.transform = `scale(${box.clientWidth / SIZE[variant][0]})`; };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [variant]);
  return <div ref={ref} className="dv__fit">{children}</div>;
}

function Cursor({ ref, dim }: { ref?: Ref<HTMLDivElement>; dim?: boolean }) {
  return <div ref={ref} className="dv__cur" data-dim={dim ? '' : undefined} aria-hidden="true">
    <span className="dv__ring" />
    <span className="dv__press">
      <svg className="dv__arrow" viewBox="0 0 16 22"><path d="M1.5 1.5v16.2l4.1-3.9 2.9 6.5 2.9-1.3-2.8-6.3h5.7Z" /></svg>
      <span className="dv__tag">{MOCK.cursor}</span>
    </span>
  </div>;
}

/** Puts the cursor at [x, y]; near the window's right edge its label moves to the arrow's left so it isn't cut off. */
const place = (el: HTMLElement, [x, y]: [number, number], w: number) => {
  el.style.transform = `translate3d(${x}px,${y}px,0)`;
  const flip = x > w - 76;
  if (flip !== el.hasAttribute('data-flip')) el.toggleAttribute('data-flip', flip);
};

/** A click: a 220ms press and one soft blue ring. */
function press(cur: HTMLElement) {
  cur.querySelector('.dv__press')?.animate([{ scale: 1 }, { scale: 0.9, offset: 0.4 }, { scale: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
  cur.querySelector('.dv__ring')?.animate([{ opacity: 0.55, scale: 0.35 }, { opacity: 0, scale: 1.5 }], { duration: 640, easing: 'cubic-bezier(.16,1,.3,1)' });
}

function useAnchors(mock: RefObject<HTMLElement | null>, onChange: (a: Anchors) => void) {
  useLayoutEffect(() => {
    const el = mock.current!;
    let alive = true;
    const measure = () => { if (alive) onChange(measureAnchors(el)); };
    measure();
    // Anchors only move when something resizes (the web fonts arriving, mostly), never on scroll.
    const ro = new ResizeObserver(measure);
    el.querySelectorAll('[data-anchor]').forEach(a => ro.observe(a));
    void document.fonts?.ready.then(measure);
    return () => { alive = false; ro.disconnect(); };
  }, []);
}

function Full() {
  const root = useRef<HTMLElement>(null);
  const mock = useRef<HTMLDivElement>(null);
  const cur = useRef<HTMLDivElement>(null);
  const [steps, setSteps] = useState(0);
  const state = steps ? stateAt(STEPS[steps - 1].at) : stateAt(-1);
  const clock = useRef({ p: 0, last: 0, anchors: {} as Anchors, draw: () => {} });

  useLayoutEffect(() => {
    const sec = root.current!, c = clock.current, [W, H] = SIZE.wide;
    const lines = [...sec.querySelectorAll<HTMLElement>('.dv__beat')];
    const count = sec.querySelector('.dv__n')!;
    let beat = 0, done = 0, tally = -1;
    c.draw = () => {
      const { p } = c;
      place(cur.current!, cursorAt(p, c.anchors, W, H), W);
      // A click only plays going forwards, and not when a jump skips over it.
      if (p - c.last < 0.06 && clicksBetween(c.last, p).length) press(cur.current!);
      c.last = p;
      const n = stepsBy(p);
      if (n !== done) { done = n; setSteps(n); }
      const t = tallyAt(p);
      if (t !== tally) { tally = t; paintTally(mock.current!, t); }
      lines.forEach((el, i) => {
        const { o, y } = lineAt(i, p);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${y}px)`;
        el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      });
      const b = beatAt(p);
      if (b !== beat) { beat = b; count.textContent = String(b + 1); }
    };
    c.draw();
  }, []);

  useAnchors(mock, a => { clock.current.anchors = a; clock.current.draw(); });

  useEffect(() => {
    let alive = true, revert = () => {};
    void loadGsap().then(({ gsap }) => {
      if (!alive) return;
      const ctx = gsap.context(() => {
        const c = clock.current, t = { p: 0 };
        gsap.to(t, {
          p: 1, ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
          onUpdate: () => { c.p = t.p; c.draw(); },
        });
      });
      revert = () => ctx.revert();
    });
    return () => { alive = false; revert(); };
  }, []);

  return <DervoLayout mode="full" rootRef={root} label={MOCK.label} screen={v => <Fit variant={v}>
    <DervoMock ref={mock} state={state} variant={v}><Cursor ref={cur} dim={state.quiet} /></DervoMock>
  </Fit>} />;
}

function Lite() {
  return <DervoLayout mode="lite" label={MOCK.label} screen={(v, i) => <Fit variant={v}><LiteFrame variant={v} beat={i} /></Fit>} />;
}

/** One phone frame: it waits in the state before its step, then when most of it is on screen the cursor glides in
 *  (700ms), clicks, and the app lands on the end of the beat. Once. */
function LiteFrame({ variant, beat }: { variant: MockVariant; beat: number }) {
  const { before, after } = liteStates(beat);
  const [state, setState] = useState<MockState>(before);
  const mock = useRef<HTMLDivElement>(null);
  const cur = useRef<HTMLDivElement>(null);
  const anchors = useRef<Anchors>({});
  const played = useRef(false);
  const [W, H] = SIZE[variant];
  const def = LITE[beat], step = STEPS[def.step], counts = beat === BEATS.length - 3;

  useAnchors(mock, a => { anchors.current = a; if (!played.current) place(cur.current!, resolve(def.from, a, W, H), W); });

  useEffect(() => {
    const box = mock.current!;
    if (counts) paintTally(box, 0);
    const timers: number[] = [], frames: number[] = [];
    const io = new IntersectionObserver(entries => {
      if (played.current || !entries.some(e => e.isIntersecting)) return;
      played.current = true;
      io.disconnect();
      const a = resolve(def.from, anchors.current, W, H), b = resolve(def.to, anchors.current, W, H), el = cur.current!;
      const path = Array.from({ length: 17 }, (_, k) => { const [x, y] = arc(a, b, glide(k / 16)); return { transform: `translate3d(${x}px,${y}px,0)` }; });
      place(el, b, W);
      el.animate(path, { duration: 700, easing: 'linear' });
      if (counts) {
        setState(after);
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - t0) / 900);
          paintTally(box, 1 - (1 - t) ** 3);
          if (t < 1) frames.push(requestAnimationFrame(tick));
        };
        frames.push(requestAnimationFrame(tick));
      }
      timers.push(window.setTimeout(() => { if (step.click) press(el); setState(after); }, 700));
    }, { threshold: 0.6 });
    io.observe(box);
    return () => { io.disconnect(); timers.forEach(clearTimeout); frames.forEach(cancelAnimationFrame); };
  }, []);

  return <DervoMock ref={mock} state={state} variant={variant} tally={counts ? 0 : 1}><Cursor ref={cur} dim={state.quiet} /></DervoMock>;
}

const FINISHED = stateAt(0.86);

function Still() {
  return <DervoLayout mode="still" label={MOCK.label} screen={v => <Fit variant={v}><StillMock variant={v} /></Fit>} />;
}

/** The finished app, with the agent's cursor resting where it last clicked. */
function StillMock({ variant }: { variant: MockVariant }) {
  const mock = useRef<HTMLDivElement>(null);
  const cur = useRef<HTMLDivElement>(null);
  useAnchors(mock, a => { const at = a.approve ?? a['sub-threads']; if (at) place(cur.current!, [at[0] + 10, at[1] + 6], SIZE[variant][0]); });
  return <DervoMock ref={mock} state={FINISHED} variant={variant}><Cursor ref={cur} /></DervoMock>;
}
