import { useEffect, useRef, useState } from 'react';
import { ABOUT, EMAIL, FOOTER, HERO, NAME, NAV, NOW, WORK } from '../cobalt/copy';
import { A, ArrowRight } from '../cobalt/parts';
import { paintNewsprint } from '../patch/parts';
import { hop, hops, replay, startBoil } from '../patch/toon';
import { BOX, Cap, Far, FootArt, HOOKS, HollySprig, IN_BOX, Lights, Live, ORDER, Plates, Snowball, TREE, Tint, Yard } from './Art';
import { SFX, SNOW } from './copy';
import { hang, kick, light, shake, story, tip } from './story';
import { useEntrance } from '../useEntrance';
import { markSeen, seenBefore } from '../navigate';
import { loadToon, reduced, scrollMotion, type G } from '../gsap';
import '../motion.css';
import '../patch/patch.css';
import './snow.css';

/* The home page as a Sunday comic for Christmas: the pumpkin patch's yard two months on, under snow. The name is
   lettered into a title box with snow on it, over the kid in the bedsheet (now in a knit hat) trimming a little pine.
   As you scroll it gets dark and the lights come on, snow piles up on every panel you pass, and one snowball rolls the
   whole page down to be the snowman's head in the footer, where a sleigh crosses the moon. Tap the tree to hang the
   ornaments and put the star on, tip the snowman's hat, rattle a present, kick a drift, or make it snow. */

/** The project a link opens on this site, for the picture that grows into its page (navigate.ts). */
const handover = (href: string) => /^\/projects\/([\w-]+)$/.exec(href)?.[1];
/** The snow in the hero: where each flake falls, how big it is and how long it takes. */
const FLAKES = Array.from({ length: 56 }, (_, i) => ({ left: (i * 37 + 11) % 100, size: 5 + ((i * 7) % 8), dur: 8 + ((i * 5) % 7), delay: -(i * 1.37) % 14 }));
const GUST = Array.from({ length: 44 }, (_, i) => ({ left: (i * 29 + 3) % 96 - 10, top: (i * 13) % 40, size: 6 + ((i * 3) % 7), delay: ((i * 7) % 10) / 14 }));

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
    const t = setTimeout(() => { stop = startBoil(['#sn-yardInk', '#sn-liveInk', '#sn-footInk', '#sn-footFront'].map(s => root.current!.querySelector(s)!), 'sn-b'); }, 1700);
    return () => { clearTimeout(t); stop?.(); };
  });

  // Taps. The tree takes the next ornament from the box (three, then the star, and then it lights up), the snowman's
  // hat flips, a present rattles, a drift gets kicked and the kid says boo. Until GSAP is here each one plays a CSS
  // bounce that starts over on every tap.
  useEffect(() => {
    const el = root.current!;
    const scene = el.querySelector<SVGSVGElement>('#sn-scene')!, hero = el.querySelector<HTMLElement>('#sn-hero')!;
    const sfx = el.querySelector<HTMLElement>('#sn-sfx')!, done = el.querySelector<HTMLElement>('#sn-done')!, gust = el.querySelector<HTMLElement>('.gust')!;
    const kid = el.querySelector<SVGGElement>('#sn-kid')!, pine = scene.querySelector<SVGGElement>('.pine')!, hat = scene.querySelector<SVGGElement>('.snowman .hat')!;
    const gifts = [...scene.querySelectorAll<SVGGElement>('.gift')];
    let trimmed = 0, g: G | undefined, gone = false, flips = 0;
    if (!reduced()) loadToon().then(x => { if (!gone) g = x; }).catch(() => {});
    const say = (word: string, x: number, y: number) => {
      const r = hero.getBoundingClientRect();
      sfx.textContent = word;
      sfx.style.left = `${Math.min(r.width - 120, Math.max(12, x - r.left - 40))}px`;
      sfx.style.top = `${Math.max(12, y - r.top - 90)}px`;
      replay(sfx, 'go');
    };
    const jump = (p: Element) => { if (g) hop(g, p as SVGGraphicsElement); else replay(p, 'boing'); };
    const startle = () => { if (g) hop(g, kid); else replay(kid.querySelector('.ghost')!, 'hop'); };
    const lightUp = () => { if (g) light(g, pine); else pine.classList.add('lit'); done.textContent = SNOW.done; };
    /** Hangs the next thing from the box, or says there's nothing left to hang. */
    const trim = () => {
      if (trimmed >= ORDER.length) return false;
      const name = ORDER[trimmed++], from = scene.querySelector<SVGGElement>(`.boxed[data-trim="${name}"]`)!, to = pine.querySelector<SVGGElement>(`.hung[data-trim="${name}"]`)!;
      const last = trimmed === ORDER.length;
      if (g) {
        const [bx, by] = IN_BOX[name], [hx, hy] = HOOKS[name];
        hang(g, from, to, { x: TREE.x + hx - (BOX.x + bx), y: TREE.y + hy - (BOX.y + by) }, () => { if (last) lightUp(); });
      } else { from.classList.add('gone'); to.classList.add('on'); if (last) lightUp(); }
      setTimeout(startle, g ? 650 : 0);
      return true;
    };
    const down = (e: PointerEvent) => {
      const t = e.target as Element, at = [e.clientX, e.clientY] as const;
      const tree = t.closest('.pine, .box'), gift = t.closest('.gift'), man = t.closest('.snowman'), pile = t.closest('.pile'), pump = t.closest('.pump');
      if (tree) {
        const next = ORDER[trimmed];
        if (trim()) say(next === 'star' ? SFX.star : SFX.hang, ...at);
        else { if (g) shake(g, pine); else replay(pine, 'boing'); say(SFX.tree, ...at); }
      } else if (gift) { jump(gift); say(SFX.gift, ...at); }
      else if (man) { if (g) tip(g, hat, flips++ % 2 ? -1 : 1); else replay(hat, 'boing'); say(SFX.hat, ...at); }
      else if (pile) { if (g) kick(g, pile); else replay(pile, 'boing'); say(SFX.drift, ...at); }
      else if (pump) { jump(pump); say(SFX.pumpkin, ...at); }
      else if (t.closest('.ghost')) { startle(); say(SFX.kid, ...at); }
    };
    // Make it snow: a gust blows through, the presents hop one after another and the kid jumps.
    const snow = () => {
      replay(gust, 'go');
      gifts.forEach((d, i) => setTimeout(() => jump(d), 240 + i * 70));
      if (g && trimmed >= ORDER.length) shake(g, pine);
      setTimeout(startle, 300);
      const r = scene.getBoundingClientRect();
      say(SFX.snow, r.left + r.width * 0.35, r.top + r.height * 0.5);
    };
    const btn = el.querySelector<HTMLButtonElement>('#sn-snow')!;
    scene.addEventListener('pointerdown', down);
    btn.addEventListener('click', snow);
    return () => {
      gone = true;
      scene.removeEventListener('pointerdown', down);
      btn.removeEventListener('click', snow);
      [...gifts, kid, pine, ...el.querySelectorAll('#sn-scene .pump')].forEach(p => hops.get(p)?.kill());
    };
  }, []);

  // The scroll story (story.ts). Nothing stands in for it before GSAP arrives: the page just holds the evening, with
  // the snow already down on the panels.
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

  return <div className={again ? 'pk sn again' : 'pk sn'} ref={root}>
    <Plates />
    <div className="night-page" aria-hidden="true" />
    <div className="wrap">
      <span className="roll" id="sn-roll" aria-hidden="true"><Snowball /></span>
      <header className="top">
        <a href="/" className="letter name">{NAME}</a>
        <nav aria-label="site">{NAV.map(l => <a key={l.href} className="link" href={l.href}>{l.label}</a>)}</nav>
      </header>

      <main>
        <section className="hero panel" id="sn-hero" aria-labelledby="sn-name" data-enter>
          <div className="stage">
            <div className="sky" aria-hidden="true" /><div className="sky-dusk" aria-hidden="true" /><div className="sky-night" aria-hidden="true" />
            <Far /><Yard /><Tint /><Lights /><Live label={SNOW.art} />
          </div>
          <div className="snowfall" aria-hidden="true">{FLAKES.map((f, i) => <span key={i} className="flake" style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay.toFixed(2)}s` }}><i style={{ animationDelay: `${(-i * 0.7).toFixed(1)}s` }} /></span>)}</div>
          <div className="gust" aria-hidden="true">{GUST.map((f, i) => <span key={i} className="flake" style={{ left: `${f.left}%`, top: `${f.top}%`, width: f.size, height: f.size, animationDelay: `${f.delay.toFixed(2)}s` }}><i /></span>)}</div>
          <div className="hero-copy" id="sn-heroCopy">
            <h1 className="title-box" id="sn-name">
              <Cap i={1} /><HollySprig />
              <span className="pk-vh">{NAME}</span>
              {[...NAME].map((c, i) => <span key={i} className="ch" aria-hidden="true" style={{ animationDelay: `${(0.2 + i * 0.06).toFixed(2)}s` }}>{c === ' ' ? '\u00a0' : c}</span>)}
            </h1>
            <p className="balloon hero-balloon">{HERO.line}</p>
          </div>
          <span className="sfx" id="sn-sfx" aria-hidden="true" />
        </section>
        <div className="hintbar">
          <button type="button" className="hint" id="sn-snow">{SNOW.hint}</button>
          <span className="label" id="sn-done" aria-live="polite" />
        </div>

        <section className="now" aria-label={NOW.label}>
          <p className="caption">{NOW.label}</p>
          <p className="balloon big-balloon pop">{NOW.lead}</p>
        </section>

        <section id="work" aria-labelledby="sn-work">
          <div className="sec-head"><h2 className="caption-h" id="sn-work"><Cap i={2} />{WORK.title}</h2><p className="label">{WORK.year}</p></div>
          <ul className="strip">
            {WORK.rows.map((p, i) => {
              const inner = <>
                <Cap i={i} grow />
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

        <section className="about" id="about" aria-labelledby="sn-about">
          <h2 className="caption-h" id="sn-about"><Cap i={0} />{ABOUT.title}</h2>
          <div className="panel body pop">
            <Cap i={1} grow />
            {ABOUT.body.map(p => <p key={p}>{p}</p>)}
            <p className="label">{ABOUT.off}</p>
          </div>
        </section>
      </main>

      <footer id="sn-foot">
        <div className="panel night"><FootArt label={SNOW.footArt} /></div>
        <div className="foot-row">
          <p className="balloon hi">{SNOW.footBalloon}</p>
          <div className="foot-links">
            <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <nav aria-label="elsewhere" className="foot-links">{FOOTER.links.map(l => <A key={l.href} className="link" href={l.href}>{l.label}</A>)}</nav>
          </div>
        </div>
        <div className="fine">
          <p className="label">{FOOTER.quests.label}: {FOOTER.quests.links.map((l, i) => <span key={l.href}>{i > 0 && ' · '}<a className="link" href={l.href}>{l.label}</a></span>)}</p>
          <p className="label">{SNOW.sign}</p>
        </div>
      </footer>
    </div>
  </div>;
}
