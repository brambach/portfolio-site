import { useEffect, useRef, useState } from 'react';
import { ABOUT, EMAIL, FOOTER, HERO, NAME, NAV, NOW, WORK } from '../cobalt/copy';
import { A, ArrowRight } from '../cobalt/parts';
import { FootArt, Leaf, Plates, Scene } from './Art';
import { PATCH } from './copy';
import { paintNewsprint } from './parts';
import { useEntrance } from '../useEntrance';
import { markSeen, seenBefore } from '../navigate';
import '../motion.css';
import './patch.css';

/* The home page as a Sunday comic: the name is lettered into a title box over a pumpkin patch at dusk, and the
   pumpkins bounce when you tap them (three taps light the big one). The work is a strip of panels, the now is a speech
   balloon, and a little ghost waves from the footer while the bats take off. The lines boil like hand-drawn animation. */

const reduced = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
/** The project a link opens on this site, for the picture that grows into its page (navigate.ts). */
const handover = (href: string) => /^\/projects\/([\w-]+)$/.exec(href)?.[1];
const SFX = ['BOING!', 'BONK!', 'THUMP!', 'POP!', 'BOING!'];
const LEAVES = ['#e8742a', '#d8432c', '#f2b632', '#b8572a', '#e8742a', '#f2b632', '#d8432c', '#b8572a'];

/** Restarts a CSS animation class on an element, so a second tap bounces it again. */
export function replay(el: Element, cls: string) {
  el.classList.remove(cls);
  void (el as HTMLElement).getBoundingClientRect();
  el.classList.add(cls);
}

/** The boil: the ink swaps between three wobble filters about eight times a second while it's on screen. */
function startBoil(el: HTMLElement) {
  if (reduced()) return;
  const groups = [el.querySelector('#pk-ink')!, el.querySelector('#pk-footInk')!];
  const shown = new Set<Element>();
  let i = 0;
  const tick = setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % 3;
    for (const g of groups) if (shown.has(g)) g.setAttribute('filter', `url(#pk-b${i})`);
  }, 125);
  let io: IntersectionObserver | undefined;
  if (typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? shown.add(e.target) : shown.delete(e.target)));
    groups.forEach(g => io!.observe(g));
  } else groups.forEach(g => shown.add(g));
  return () => { clearInterval(tick); io?.disconnect(); };
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  // Coming back to the home this visit, it's already printed: nothing replays its entrance.
  const [again] = useState(() => seenBefore('home'));
  useEffect(() => markSeen('home'), []);

  useEffect(paintNewsprint, []);

  // The first screen waits for its lettering, then the name drops in. The boil only starts once the name has landed:
  // it repaints the whole drawing eight times a second, and on a phone that would fight the letters for frames.
  useEntrance(root, 'Patrick Hand SC', () => {
    let stop: (() => void) | undefined;
    const t = setTimeout(() => { stop = startBoil(root.current!); }, 1700);
    return () => { clearTimeout(t); stop?.(); };
  });

  // Tapping a pumpkin bounces it with a sound effect; three taps on the big one light its face.
  useEffect(() => {
    const el = root.current!;
    const scene = el.querySelector<SVGSVGElement>('#pk-scene')!, hero = el.querySelector<HTMLElement>('#pk-hero')!;
    const sfx = el.querySelector<HTMLElement>('#pk-sfx')!, lit = el.querySelector<HTMLElement>('#pk-lit')!;
    let taps = 0, n = 0;
    const pop = (x: number, y: number) => {
      const r = hero.getBoundingClientRect();
      sfx.textContent = SFX[n++ % SFX.length];
      sfx.style.left = `${Math.min(r.width - 80, Math.max(12, x - r.left - 40))}px`;
      sfx.style.top = `${Math.max(12, y - r.top - 90)}px`;
      replay(sfx, 'go');
    };
    const bounce = (p: Element) => {
      replay(p, 'boing');
      if (p.classList.contains('big') && ++taps >= 3 && !p.classList.contains('lit')) {
        p.classList.add('lit');
        lit.textContent = PATCH.lit;
      }
    };
    const down = (e: PointerEvent) => {
      const p = (e.target as Element).closest('.pump');
      if (p) { bounce(p); pop(e.clientX, e.clientY); return; }
      const g = (e.target as Element).closest('.ghost');
      if (g) { replay(g, 'hop'); pop(e.clientX, e.clientY); }
    };
    const all = () => {
      el.querySelectorAll('#pk-scene .pump').forEach((p, i) => setTimeout(() => bounce(p), i * 70));
      const r = scene.getBoundingClientRect();
      pop(r.left + r.width * 0.6, r.top + r.height * 0.7);
    };
    const btn = el.querySelector<HTMLButtonElement>('#pk-bounce')!;
    scene.addEventListener('pointerdown', down);
    btn.addEventListener('click', all);
    return () => { scene.removeEventListener('pointerdown', down); btn.removeEventListener('click', all); };
  }, []);

  // Scroll: the patch sinks a little as you leave it; the footer's bats take off as you arrive.
  useEffect(() => {
    if (reduced()) return;
    const el = root.current!;
    const copy = el.querySelector<HTMLElement>('#pk-heroCopy')!, hero = el.querySelector<HTMLElement>('#pk-hero')!, foot = el.querySelector<HTMLElement>('#pk-foot')!;
    const bats = [...el.querySelectorAll<SVGGElement>('.fbat')];
    let frame = 0;
    const paint = () => {
      frame = 0;
      const vh = window.innerHeight, r = hero.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height));
      copy.style.transform = `translateY(${-p * 60}px) rotate(${-p * 4}deg)`;
      const q = clamp((vh - foot.getBoundingClientRect().top) / (vh * 0.75)), e = q * q * (3 - 2 * q);
      for (const b of bats) b.style.transform = `translate(${e * Number(b.dataset.dx)}px,${e * Number(b.dataset.dy)}px)`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    window.addEventListener('scroll', onScroll, { passive: true });
    paint();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);

  // Panels and balloons pop in once they scroll into view. Arriving at /#work or /#about lands there.
  useEffect(() => {
    const items = [...root.current!.querySelectorAll('.pop')];
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'function' && !reduced()) {
      io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io!.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
      items.forEach(r => io!.observe(r));
    } else items.forEach(r => r.classList.add('seen'));
    const hash = window.location.hash.slice(1);
    if (hash === 'work' || hash === 'about') document.getElementById(hash)?.scrollIntoView();
    return () => io?.disconnect();
  }, []);

  return <div className={again ? 'pk again' : 'pk'} ref={root}>
    <Plates />
    <div className="wrap">
      <header className="top">
        <a href="/" className="letter name">{NAME}</a>
        <nav aria-label="site">{NAV.map(l => <a key={l.href} className="link" href={l.href}>{l.label}</a>)}</nav>
      </header>

      <main>
        <section className="hero panel" id="pk-hero" aria-labelledby="pk-name" data-enter>
          <Scene label={PATCH.art} />
          <div className="leaves" aria-hidden="true">{LEAVES.map((c, i) => <span key={i} className="leaf" style={{ left: `${6 + i * 12}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${9 + (i % 3) * 2.5}s` }}><Leaf c={c} /></span>)}</div>
          <div className="hero-copy" id="pk-heroCopy">
            <h1 className="title-box" id="pk-name">
              <span className="pk-vh">{NAME}</span>
              {[...NAME].map((c, i) => <span key={i} className="ch" aria-hidden="true" style={{ animationDelay: `${(0.2 + i * 0.06).toFixed(2)}s` }}>{c === ' ' ? '\u00a0' : c}</span>)}
            </h1>
            <p className="balloon hero-balloon">{HERO.line}</p>
          </div>
          <span className="sfx" id="pk-sfx" aria-hidden="true" />
        </section>
        <div className="hintbar">
          <button type="button" className="hint" id="pk-bounce">{PATCH.hint}</button>
          <span className="label" id="pk-lit" aria-live="polite" />
        </div>

        <section className="now" aria-label={NOW.label}>
          <p className="caption">{NOW.label}</p>
          <p className="balloon big-balloon pop">{NOW.lead}</p>
        </section>

        <section id="work" aria-labelledby="pk-work">
          <div className="sec-head"><h2 className="caption-h" id="pk-work">{WORK.title}</h2><p className="label">{WORK.year}</p></div>
          <ul className="strip">
            {WORK.rows.map((p, i) => <li key={p.name} className={i === 0 ? 'cell wide-cell' : 'cell'}>
              <A href={p.href} className="panel work-panel pop">
                <span className="caption">0{i + 1} · {p.kind}</span>
                <div className="shot" data-handover={handover(p.href)}><img src={p.img} alt={p.alt} loading="lazy" decoding="async" className={p.portrait ? 'portrait' : undefined} /></div>
                <div className="words"><h3 className="letter">{p.name}<ArrowRight /></h3><span className="ln">{p.line}</span><span className="label">{p.caption}</span></div>
              </A>
            </li>)}
          </ul>
          {WORK.also.length > 0 && <p className="also">Also: {WORK.also.map(a => <span key={a.name}><A href={a.href} className="link">{a.name}</A>, {a.line}.</span>)}</p>}
        </section>

        <section className="about" id="about" aria-labelledby="pk-about">
          <h2 className="caption-h" id="pk-about">{ABOUT.title}</h2>
          <div className="panel body pop">
            {ABOUT.body.map(p => <p key={p}>{p}</p>)}
            <p className="label">{ABOUT.off}</p>
          </div>
        </section>
      </main>

      <footer id="pk-foot">
        <FootArt label={PATCH.footArt} />
        <div className="foot-row">
          <p className="balloon hi">{PATCH.footBalloon}</p>
          <div className="foot-links">
            <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <nav aria-label="elsewhere" className="foot-links">{FOOTER.links.map(l => <A key={l.href} className="link" href={l.href}>{l.label}</A>)}</nav>
          </div>
        </div>
        <div className="fine">
          <p className="label">{FOOTER.quests.label}: {FOOTER.quests.links.map((l, i) => <span key={l.href}>{i > 0 && ' · '}<a className="link" href={l.href}>{l.label}</a></span>)}</p>
          <p className="label">{PATCH.sign}</p>
        </div>
      </footer>
    </div>
  </div>;
}
