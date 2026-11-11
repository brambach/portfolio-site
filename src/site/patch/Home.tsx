import { useEffect, useRef, useState } from 'react';
import { ABOUT, EMAIL, FOOTER, HERO, NAME, NAV, NOW, WORK } from '../cobalt/copy';
import { A, ArrowRight } from '../cobalt/parts';
import { FootArt, Leaf, Plates, Scene } from './Art';
import { PATCH } from './copy';
import { paintNewsprint } from './parts';
import { useEntrance } from '../useEntrance';
import { markSeen, seenBefore } from '../navigate';
import { loadGsap, reduced, scrollMotion, TRAIL, type G } from '../gsap';
import { hop, hops, replay, startBoil } from './toon';
import '../motion.css';
import './patch.css';

/* The home page as a Sunday comic: the name is lettered into a title box over a pumpkin patch at dusk, and the
   pumpkins bounce when you tap them (three taps light the big one). The work is a strip of panels, the now is a speech
   balloon, and a little ghost waves from the footer while the bats take off. The lines boil like hand-drawn animation. */

const clamp = (n: number) => Math.min(1, Math.max(0, n));
/** The project a link opens on this site, for the picture that grows into its page (navigate.ts). */
const handover = (href: string) => /^\/projects\/([\w-]+)$/.exec(href)?.[1];
const SFX = ['BOING!', 'BONK!', 'THUMP!', 'POP!', 'BOING!'];
const LEAVES = ['#e8742a', '#d8432c', '#f2b632', '#b8572a', '#e8742a', '#f2b632', '#d8432c', '#b8572a'];

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
    const t = setTimeout(() => { stop = startBoil([root.current!.querySelector('#pk-ink')!, root.current!.querySelector('#pk-footInk')!], 'pk-b'); }, 1700);
    return () => { clearTimeout(t); stop?.(); };
  });

  // Tapping a pumpkin bounces it with a sound effect; three taps on the big one light its face.
  useEffect(() => {
    const el = root.current!;
    const scene = el.querySelector<SVGSVGElement>('#pk-scene')!, hero = el.querySelector<HTMLElement>('#pk-hero')!;
    const sfx = el.querySelector<HTMLElement>('#pk-sfx')!, lit = el.querySelector<HTMLElement>('#pk-lit')!;
    let taps = 0, n = 0, g: G | undefined, gone = false;
    // Until GSAP is here a tap plays the CSS bounce, which starts over on every tap.
    if (!reduced()) loadGsap().then(x => { if (!gone) g = x; }).catch(() => {});
    const pop = (x: number, y: number) => {
      const r = hero.getBoundingClientRect();
      sfx.textContent = SFX[n++ % SFX.length];
      sfx.style.left = `${Math.min(r.width - 80, Math.max(12, x - r.left - 40))}px`;
      sfx.style.top = `${Math.max(12, y - r.top - 90)}px`;
      replay(sfx, 'go');
    };
    const bounce = (p: Element) => {
      if (g) hop(g, p as SVGGraphicsElement); else replay(p, 'boing');
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
    return () => {
      gone = true;
      scene.removeEventListener('pointerdown', down);
      btn.removeEventListener('click', all);
      el.querySelectorAll('#pk-scene .pump').forEach(p => hops.get(p)?.kill());
    };
  }, []);

  // Scroll: the title box sinks and tips a little as you leave the patch; the footer's bats take off as you arrive.
  // GSAP scrubs both a beat behind the scroll, so they move with some weight; before it loads they follow 1:1.
  useEffect(() => {
    const el = root.current!;
    const copy = el.querySelector<HTMLElement>('#pk-heroCopy')!, hero = el.querySelector<HTMLElement>('#pk-hero')!, foot = el.querySelector<HTMLElement>('#pk-foot')!;
    const bats = [...el.querySelectorAll<SVGGElement>('.fbat')];
    return scrollMotion(el, () => {
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
      return () => {
        window.removeEventListener('scroll', onScroll);
        cancelAnimationFrame(frame);
        [copy, ...bats].forEach(n => { n.style.transform = ''; });
      };
    }, ({ gsap }) => {
      gsap.fromTo(copy, { y: 0, rotation: 0 }, { y: -60, rotation: -4, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: TRAIL } });
      for (const b of bats) gsap.fromTo(b, { x: 0, y: 0 }, { x: Number(b.dataset.dx), y: Number(b.dataset.dy), ease: 'sine.inOut', scrollTrigger: { trigger: foot, start: 'top bottom', end: 'top 25%', scrub: TRAIL + 0.2 } });
    });
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
            {WORK.rows.map((p, i) => {
              const inner = <>
                <span className="caption">0{i + 1} · {p.kind}</span>
                <div className="shot" data-handover={p.href && handover(p.href)}><img src={p.img} alt={p.alt} loading="lazy" decoding="async" className={p.portrait ? 'portrait' : undefined} /></div>
                <div className="words"><h3 className="letter">{p.name}{p.href && <ArrowRight />}</h3><span className="ln">{p.line}</span><span className="label">{p.caption}</span></div>
              </>;
              // Work that isn't public yet has no page to go to, so its panel isn't a link.
              return <li key={p.name} className={i === 0 ? 'cell wide-cell' : 'cell'}>{p.href
                ? <A href={p.href} className="panel work-panel pop">{inner}</A>
                : <div className="panel work-panel">{inner}</div>}</li>;
            })}
          </ul>
          {WORK.also.length > 0 && <p className="also">Also: {WORK.also.map((a, i) => <span key={a.name}>{i > 0 && ' '}{a.href ? <A href={a.href} className="link">{a.name}</A> : a.name}, {a.line}.</span>)}</p>}
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
