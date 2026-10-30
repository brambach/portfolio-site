import { useEffect, useRef, useState } from 'react';
import { ABOUT, EMAIL, FOOTER, HERO, NAME, NAV, NOW, WORK } from './copy';
import { FootArt, Plates, Scene } from './Engraving';
import { A, ArrowRight, paintPaper } from './parts';
import { useEntrance } from '../useEntrance';
import { markSeen, seenBefore } from '../navigate';
import '../motion.css';
import './cobalt.css';

/* The home page: the name settles over an engraved Tahoe scene that follows the visitor's clock, and the sun can be
   dragged across the sky to scrub the day into night. The season follows the month (snow on the peaks and pines in
   winter, a sailboat in summer, aspens turning in fall) and four quiet buttons switch it. Below it, a quiet work list (a sticky preview on a desktop, a
   picture under each row on a phone), a short about, and a footer whose birds take off as you arrive. */

const reduced = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
/** The project a link opens on this site, for the picture that grows into its page (navigate.ts). */
const handover = (href: string) => /^\/projects\/([\w-]+)$/.exec(href)?.[1];

/** Where the clock puts the day: 0 is 5am, 1 is midnight, and the small hours count as midnight. */
export function dayFromClock(date: Date) {
  let h = date.getHours() + date.getMinutes() / 60;
  if (h < 5) h += 24;
  return clamp((h - 5) / 19);
}

/** The time a point in the day stands for, as the label under the scene says it. */
export function clockLabel(t: number) {
  const hrs = 5 + t * 19, hr = Math.floor(hrs) % 24, mn = Math.floor((hrs % 1) * 60);
  return `${(hr % 12) || 12}:${String(mn).padStart(2, '0')} ${hr < 12 ? 'am' : 'pm'} in tahoe · ${HERO.clockHint}`;
}

export const SEASONS = ['winter', 'spring', 'summer', 'fall'] as const;
export type Season = typeof SEASONS[number];

/** The lake's season by month: snow from December through March, then a short spring, a long summer and fall. */
export function seasonOf(date: Date): Season {
  const m = date.getMonth();
  return m === 11 || m <= 2 ? 'winter' : m <= 4 ? 'spring' : m <= 8 ? 'summer' : 'fall';
}

/** The sun's path: a high arc through the day, then the moon's low arc after dusk. In the scene's own units. */
export function sunAt(t: number) {
  const DAY = 0.76, night = t > DAY;
  const y = night ? 235 - Math.sin(Math.PI * (0.25 + 0.5 * (t - DAY) / (1 - DAY))) * 40 : 350 - Math.sin(Math.PI * t / DAY) * 255;
  return { y, night, dark: clamp((t - 0.66) / 0.1) };
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [season, setSeason] = useState<Season>(() => seasonOf(new Date()));
  // Coming back to the home this visit, it's already printed: nothing replays its entrance.
  const [again] = useState(() => seenBefore('home'));
  useEffect(() => markSeen('home'), []);

  useEffect(paintPaper, []);
  // The first screen waits for the serif it's set in, so the name never settles in Georgia and then jumps.
  useEntrance(root, 'Alegreya');

  // The sun and the time of day.
  useEffect(() => {
    const el = root.current!;
    const $ = <T extends Element>(id: string) => el.querySelector<T>(`#${id}`)!;
    const scene = $<SVGSVGElement>('c-scene'), sun = $<SVGGElement>('c-sun');
    const day = $<SVGGElement>('c-sunDay'), moon = $<SVGGElement>('c-sunNight');
    const night = $<SVGGElement>('c-night'), refl = $<SVGGElement>('c-refl');
    const slider = $<HTMLInputElement>('c-tod'), clock = $<HTMLElement>('c-clock');
    let t = dayFromClock(new Date()), dragging = false;

    // The scene is cropped to fill its box, so the sun keeps to the part of the sky that's showing.
    const visible = () => {
      const r = scene.getBoundingClientRect();
      const k = r.height / 560 || 1, w = r.width / k;
      const x0 = Math.max(0, 600 - w / 2), x1 = Math.min(1200, 600 + w / 2);
      return { x0, x1, r, k, pad: Math.min(110, (x1 - x0) * 0.12) };
    };
    const render = () => {
      const v = visible(), x = v.x0 + v.pad + t * (v.x1 - v.x0 - v.pad * 2), s = sunAt(t);
      sun.style.transform = `translate(${x.toFixed(1)}px,${s.y.toFixed(1)}px)`;
      day.style.opacity = s.night ? '0' : '1';
      moon.style.opacity = s.night ? '1' : '0';
      night.style.opacity = s.dark.toFixed(2);
      refl.style.transform = `translateX(${x.toFixed(1)}px)`;
      refl.style.opacity = s.y < 300 ? (s.night ? '0.6' : '1') : '0';
      clock.textContent = clockLabel(t);
      slider.value = String(Math.round(t * 1000));
    };
    const fromEvent = (e: PointerEvent) => {
      const v = visible(), x = v.x0 + (e.clientX - v.r.left) / v.k;
      return clamp((x - v.x0 - v.pad) / (v.x1 - v.x0 - v.pad * 2));
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      sun.classList.add('dragging');
      scene.classList.add('dragging-scene');
      try { sun.setPointerCapture(e.pointerId); } catch { /* not every pointer can be captured */ }
      t = fromEvent(e);
      render();
      e.preventDefault();
    };
    const move = (e: PointerEvent) => { if (dragging) { t = fromEvent(e); render(); } };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      sun.classList.remove('dragging');
      scene.classList.remove('dragging-scene');
    };
    const input = () => { t = Number(slider.value) / 1000; render(); };
    sun.addEventListener('pointerdown', down);
    sun.addEventListener('pointermove', move);
    sun.addEventListener('pointerup', up);
    sun.addEventListener('pointercancel', up);
    slider.addEventListener('input', input);
    window.addEventListener('resize', render);
    render();
    return () => {
      sun.removeEventListener('pointerdown', down);
      sun.removeEventListener('pointermove', move);
      sun.removeEventListener('pointerup', up);
      sun.removeEventListener('pointercancel', up);
      slider.removeEventListener('input', input);
      window.removeEventListener('resize', render);
    };
  }, []);

  // Scroll: the hills part and the sun sinks as you leave the hero; the footer's birds take off as you arrive.
  useEffect(() => {
    if (reduced()) return;
    const el = root.current!;
    const $ = (id: string) => el.querySelector<HTMLElement | SVGElement>(`#${id}`)!;
    const layers: [Element & ElementCSSInlineStyle, number][] = [[$('c-pSun'), 190], [$('c-pFar'), -20], [$('c-pNear'), -50], [$('c-pFront'), -100]];
    const copy = $('c-heroCopy'), hero = $('c-hero'), foot = $('c-foot');
    const birds = [...el.querySelectorAll<SVGGElement>('.fbird')];
    let frame = 0;
    const paint = () => {
      frame = 0;
      const vh = window.innerHeight, r = hero.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height));
      for (const [layer, by] of layers) layer.style.transform = `translateY(${p * by}px)`;
      copy.style.transform = `translateY(${-p * 80}px)`;
      copy.style.opacity = (1 - p * 1.2).toFixed(2);
      const q = clamp((vh - foot.getBoundingClientRect().top) / (vh * 0.75)), e = q * q * (3 - 2 * q);
      for (const b of birds) b.style.transform = `translate(${e * Number(b.dataset.dx)}px,${e * Number(b.dataset.dy)}px)`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    window.addEventListener('scroll', onScroll, { passive: true });
    paint();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, []);

  // On a phone each row's picture rises once it scrolls into view. Arriving at /#work or /#about lands there.
  useEffect(() => {
    const rows = [...root.current!.querySelectorAll('.row')];
    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'function' && !reduced()) {
      io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io!.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
      rows.forEach(r => io!.observe(r));
    } else rows.forEach(r => r.classList.add('seen'));
    const hash = window.location.hash.slice(1);
    if (hash === 'work' || hash === 'about') document.getElementById(hash)?.scrollIntoView();
    return () => io?.disconnect();
  }, []);

  return <div className={again ? 'cb again' : 'cb'} ref={root} data-season={season}>
    <Plates />
    <div className="wrap">
      <header className="top">
        <a href="/" className="serif name">{NAME}</a>
        <nav aria-label="site">{NAV.map(l => <a key={l.href} className="link" href={l.href}>{l.label}</a>)}</nav>
      </header>

      <main>
        <section className="hero" id="c-hero" aria-labelledby="c-name" data-enter>
          <div className="hero-copy" id="c-heroCopy">
            <h1 className="serif" id="c-name">
              <span className="cb-vh">{NAME}</span>
              {[...NAME].map((c, i) => <span key={i} className="ch" aria-hidden="true" style={{ animationDelay: `${(0.1 + i * 0.04).toFixed(2)}s` }}>{c === ' ' ? ' ' : c}</span>)}
            </h1>
            <p className="serif-i line line-in">{HERO.line}<svg className="under eng" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path pathLength={1} d="M2 8 C60 3 120 10 180 6 S270 4 298 7" fill="none" strokeWidth="1.4" strokeLinecap="round" /></svg></p>
          </div>
          <Scene label={HERO.art} />
          <div className="todbar">
            <div className="seasons mono" role="group" aria-label={HERO.seasons}>
              {SEASONS.map(s => <button key={s} type="button" aria-pressed={s === season} onClick={() => setSeason(s)}>{s}</button>)}
            </div>
            <label htmlFor="c-tod" className="mono" id="c-clock">{HERO.clockHint}</label>
            <input id="c-tod" className="tod" type="range" min="0" max="1000" defaultValue="500" aria-label={HERO.slider} />
          </div>
        </section>

        <section className="now" aria-label={NOW.label}>
          <p className="mono">{NOW.label}</p>
          <p className="lead">{NOW.lead}</p>
        </section>

        <section id="work" aria-labelledby="c-work">
          <div className="sec-head"><h2 className="serif" id="c-work">{WORK.title}</h2><p className="mono">{WORK.year}</p></div>
          <div className="work">
            <ul className="rows">
              {WORK.rows.map((p, i) => {
                const inner = <>
                  <span className="mono">0{i + 1}</span>
                  <div className="main"><h3>{p.name}{p.href && <ArrowRight />}</h3><span className="ln">{p.line}</span></div>
                  <span className="mono kind">{p.kind}</span>
                  <div className="shot-m" data-handover={p.href && handover(p.href)}><img src={p.img} alt={p.alt} loading="lazy" decoding="async" className={p.portrait ? 'portrait' : undefined} /></div>
                </>;
                // Work that isn't public yet has no page to go to, so its row is plain text.
                return <li key={p.name} className="row-item">{p.href
                  ? <A href={p.href} className="row" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>{inner}</A>
                  : <div className="row" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>{inner}</div>}</li>;
              })}
            </ul>
            <figure className="preview" aria-hidden="true">
              <div className="frame">{WORK.rows.map((p, i) => <img key={p.name} data-handover={handover(p.href)} src={p.img} alt="" decoding="async" className={[p.portrait && 'portrait', i === active && 'on'].filter(Boolean).join(' ')} />)}</div>
              <figcaption className="mono">{WORK.rows[active].caption}</figcaption>
            </figure>
          </div>
          {WORK.also.length > 0 && <p className="also">Also: {WORK.also.map((a, i) => <span key={a.name}>{i > 0 && ' '}{a.href ? <A href={a.href} className="link">{a.name}</A> : a.name}, {a.line}.</span>)}</p>}
        </section>

        <section className="about" id="about" aria-labelledby="c-about">
          <h2 className="serif" id="c-about">{ABOUT.title}</h2>
          <div className="body">
            {ABOUT.body.map(p => <p key={p}>{p}</p>)}
            <p className="mono">{ABOUT.off}</p>
          </div>
        </section>
      </main>

      <footer id="c-foot">
        <FootArt />
        <div className="foot-row">
          <p className="serif hi">{FOOTER.hello}</p>
          <div className="foot-links">
            <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <nav aria-label="elsewhere" className="foot-links">{FOOTER.links.map(l => <A key={l.href} className="link" href={l.href}>{l.label}</A>)}</nav>
          </div>
        </div>
        <div className="fine">
          <p className="mono">{FOOTER.quests.label}: {FOOTER.quests.links.map((l, i) => <span key={l.href}>{i > 0 && ' · '}<a className="link" href={l.href}>{l.label}</a></span>)}</p>
          <p className="mono">{FOOTER.sign}</p>
        </div>
      </footer>
    </div>
  </div>;
}
