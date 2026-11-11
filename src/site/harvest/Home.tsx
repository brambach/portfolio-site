import { useEffect, useRef, useState } from 'react';
import { ABOUT, EMAIL, FOOTER, HERO, NAME, NAV, NOW, WORK } from '../cobalt/copy';
import { A, ArrowRight } from '../cobalt/parts';
import { Leaf } from '../patch/Art';
import { paintNewsprint } from '../patch/parts';
import { hop, hops, replay, startBoil } from '../patch/toon';
import { Back, Far, FootArt, Lights, Live, Plates, Tint } from './Art';
import { HARVEST, SFX } from './copy';
import { bump, kick, serve, story } from './story';
import { useEntrance } from '../useEntrance';
import { markSeen, seenBefore } from '../navigate';
import { loadToon, reduced, scrollMotion, type G } from '../gsap';
import '../motion.css';
import '../patch/patch.css';
import './harvest.css';

/* The home page as a Sunday comic, a month after the pumpkin patch: the same yard, set for dinner. The name is
   lettered into a title box over a table with a pie on it, and the afternoon goes by as you scroll: the sun sets, the
   yard falls to dusk, the string of lights comes on, one leaf falls the whole page with you, and it's night at the
   footer. Tap the pie to take a slice (the last one's saved for you), bump the table, kick the leaf pile. */

/** The project a link opens on this site, for the picture that grows into its page (navigate.ts). */
const handover = (href: string) => /^\/projects\/([\w-]+)$/.exec(href)?.[1];
const LEAVES = ['#e8742a', '#d8432c', '#f2b632', '#b8572a', '#e8742a', '#f2b632', '#d8432c', '#b8572a'];
/** The order the slices go in, and how far each one's middle sits from the pie's (in the drawing's units). */
const TAKEN: [string, number, number][] = [['fr', 25, 7], ['br', 25, -7], ['bl', -25, -7]];
/** The pie's middle and the kid's plate, in the drawing's units (Art.tsx). */
const PIE = { x: 655, y: 448 }, PLATE = { x: 535, y: 458 };

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  // Coming back to the home this visit, it's already printed: nothing replays its entrance.
  const [again] = useState(() => seenBefore('home'));
  useEffect(() => markSeen('home'), []);

  useEffect(paintNewsprint, []);

  // The first screen waits for its lettering, then the name drops in. The boil only starts once the name has landed:
  // it repaints the drawing eight times a second, and on a phone that would fight the letters for frames.
  useEntrance(root, 'Patrick Hand SC', () => {
    let stop: (() => void) | undefined;
    const t = setTimeout(() => { stop = startBoil(['#hv-backInk', '#hv-liveInk', '#hv-footInk', '#hv-footFront'].map(s => root.current!.querySelector(s)!), 'hv-b'); }, 1700);
    return () => { clearTimeout(t); stop?.(); };
  });

  // Taps. A pumpkin or a dish hops, the pie gives up a slice (three, and the fourth is saved for you), the leaf pile
  // gets kicked and the kid says boo. Until GSAP is here each one plays a CSS bounce that starts over on every tap.
  useEffect(() => {
    const el = root.current!;
    const scene = el.querySelector<SVGSVGElement>('#hv-scene')!, hero = el.querySelector<HTMLElement>('#hv-hero')!;
    const sfx = el.querySelector<HTMLElement>('#hv-sfx')!, saved = el.querySelector<HTMLElement>('#hv-saved')!;
    const kid = el.querySelector<SVGGElement>('#hv-kid')!, gots = [...el.querySelectorAll<SVGGElement>('#hv-scene .got')];
    const dishes = [...el.querySelectorAll<SVGGElement>('#hv-scene .dish')];
    let taken = 0, g: G | undefined, gone = false;
    if (!reduced()) loadToon().then(x => { if (!gone) g = x; }).catch(() => {});
    const say = (word: string, x: number, y: number) => {
      const r = hero.getBoundingClientRect();
      sfx.textContent = word;
      sfx.style.left = `${Math.min(r.width - 110, Math.max(12, x - r.left - 40))}px`;
      sfx.style.top = `${Math.max(12, y - r.top - 90)}px`;
      replay(sfx, 'go');
    };
    const jump = (p: Element, cls = 'boing') => { if (g) hop(g, p as SVGGraphicsElement); else replay(p, cls); };
    const startle = () => { if (g) hop(g, kid); else replay(kid.querySelector('.ghost')!, 'hop'); };
    /** Takes the next slice, or says there's none left to take. */
    const slice = () => {
      if (taken >= TAKEN.length) return false;
      const [name, dx, dy] = TAKEN[taken], piece = scene.querySelector<SVGGElement>(`[data-slice="${name}"]`)!, got = gots[taken];
      if (g) serve(g, piece, got, { x: PLATE.x - (PIE.x + dx), y: PLATE.y - taken * 9 - (PIE.y + dy) });
      else { piece.classList.add('gone'); got.classList.add('on'); }
      if (++taken === TAKEN.length) saved.textContent = HARVEST.saved;
      setTimeout(startle, g ? 620 : 0);
      return true;
    };
    const down = (e: PointerEvent) => {
      const t = e.target as Element, at = [e.clientX, e.clientY] as const;
      const pie = t.closest('.pie'), dish = t.closest('.dish'), pump = t.closest('.pump'), pile = t.closest('.pile');
      if (pie) { if (slice()) say(SFX.slice, ...at); else { jump(pie); say(SFX.dish, ...at); } }
      else if (dish) { jump(dish); say(SFX.dish, ...at); }
      else if (pump) { jump(pump); say(SFX.pumpkin, ...at); }
      else if (pile) { if (g) kick(g, pile); else replay(pile, 'boing'); say(SFX.pile, ...at); }
      else if (t.closest('.ghost')) { startle(); say(SFX.kid, ...at); }
    };
    const all = () => {
      if (g) bump(g, dishes); else dishes.forEach((d, i) => setTimeout(() => replay(d, 'boing'), i * 60));
      setTimeout(startle, 200);
      const r = scene.getBoundingClientRect();
      say(SFX.table, r.left + r.width * 0.5, r.top + r.height * 0.72);
    };
    const btn = el.querySelector<HTMLButtonElement>('#hv-bump')!;
    scene.addEventListener('pointerdown', down);
    btn.addEventListener('click', all);
    return () => {
      gone = true;
      scene.removeEventListener('pointerdown', down);
      btn.removeEventListener('click', all);
      [...dishes, kid, ...el.querySelectorAll('#hv-scene .pump')].forEach(p => hops.get(p)?.kill());
    };
  }, []);

  // The scroll story (story.ts). Nothing stands in for it before GSAP arrives: the page just holds the afternoon.
  useEffect(() => {
    const el = root.current!;
    return scrollMotion(el, () => () => {}, g => story(el, g), loadToon);
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

  return <div className={again ? 'pk hv again' : 'pk hv'} ref={root}>
    <Plates />
    <div className="dusk-page" aria-hidden="true" />
    <div className="wrap">
      <span className="fall" id="hv-fall" aria-hidden="true"><Leaf c="#e8742a" /></span>
      <header className="top">
        <a href="/" className="letter name">{NAME}</a>
        <nav aria-label="site">{NAV.map(l => <a key={l.href} className="link" href={l.href}>{l.label}</a>)}</nav>
      </header>

      <main>
        <section className="hero panel" id="hv-hero" aria-labelledby="hv-name" data-enter>
          <div className="stage">
            <div className="sky" aria-hidden="true" /><div className="sky-rose" aria-hidden="true" /><div className="sky-plum" aria-hidden="true" />
            <Far /><Back /><Tint /><Live label={HARVEST.art} /><Lights />
          </div>
          <div className="leaves" aria-hidden="true">{LEAVES.map((c, i) => <span key={i} className="leaf" style={{ left: `${6 + i * 12}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${9 + (i % 3) * 2.5}s` }}><Leaf c={c} /></span>)}</div>
          <div className="hero-copy" id="hv-heroCopy">
            <h1 className="title-box" id="hv-name">
              <span className="pk-vh">{NAME}</span>
              {[...NAME].map((c, i) => <span key={i} className="ch" aria-hidden="true" style={{ animationDelay: `${(0.2 + i * 0.06).toFixed(2)}s` }}>{c === ' ' ? ' ' : c}</span>)}
            </h1>
            <p className="balloon hero-balloon">{HERO.line}</p>
          </div>
          <span className="sfx" id="hv-sfx" aria-hidden="true" />
        </section>
        <div className="hintbar">
          <button type="button" className="hint" id="hv-bump">{HARVEST.hint}</button>
          <span className="label" id="hv-saved" aria-live="polite" />
        </div>

        <section className="now" aria-label={NOW.label}>
          <p className="caption">{NOW.label}</p>
          <p className="balloon big-balloon pop">{NOW.lead}</p>
        </section>

        <section id="work" aria-labelledby="hv-work">
          <div className="sec-head"><h2 className="caption-h" id="hv-work">{WORK.title}</h2><p className="label">{WORK.year}</p></div>
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

        <section className="about" id="about" aria-labelledby="hv-about">
          <h2 className="caption-h" id="hv-about">{ABOUT.title}</h2>
          <div className="panel body pop">
            {ABOUT.body.map(p => <p key={p}>{p}</p>)}
            <p className="label">{ABOUT.off}</p>
          </div>
        </section>
      </main>

      <footer id="hv-foot">
        <div className="panel night"><FootArt label={HARVEST.footArt} /></div>
        <div className="foot-row">
          <p className="balloon hi">{HARVEST.footBalloon}</p>
          <div className="foot-links">
            <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <nav aria-label="elsewhere" className="foot-links">{FOOTER.links.map(l => <A key={l.href} className="link" href={l.href}>{l.label}</A>)}</nav>
          </div>
        </div>
        <div className="fine">
          <p className="label">{FOOTER.quests.label}: {FOOTER.quests.links.map((l, i) => <span key={l.href}>{i > 0 && ' · '}<a className="link" href={l.href}>{l.label}</a></span>)}</p>
          <p className="label">{HARVEST.sign}</p>
        </div>
      </footer>
    </div>
  </div>;
}
